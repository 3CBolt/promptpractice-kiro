import { ModelProvider, ModelResult } from '@/types';
import { getLocalModelResult } from './localModel';

/**
 * Model provider system with Hugging Face API integration and local fallback
 * Implements rate limiting detection and automatic fallback strategy
 */

// Model registry with all available models
export const MODEL_REGISTRY: ModelProvider[] = [
  // Hosted models (Hugging Face API)
  {
    id: 'llama3.1-8b',
    name: 'Llama 3.1 8B',
    source: 'hosted',
    maxTokens: 512
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B',
    source: 'hosted',
    maxTokens: 512
  },
  // Local fallback models (always available)
  {
    id: 'local-stub',
    name: 'Local Stub',
    source: 'sample',
    maxTokens: 512
  },
  {
    id: 'local-creative',
    name: 'Local Creative',
    source: 'sample',
    maxTokens: 512
  },
  {
    id: 'local-analytical',
    name: 'Local Analytical',
    source: 'sample',
    maxTokens: 512
  }
];

// Hugging Face model mappings
const HF_MODEL_MAPPINGS: Record<string, string> = {
  'llama3.1-8b': 'meta-llama/Llama-3.1-8B-Instruct',
  'mistral-7b': 'mistralai/Mistral-7B-Instruct-v0.3'
};

// Rate limiting tracking
interface RateLimitState {
  isLimited: boolean;
  resetTime?: number;
  requestCount: number;
  lastReset: number;
}

let rateLimitState: RateLimitState = {
  isLimited: false,
  requestCount: 0,
  lastReset: Date.now()
};

// Rate limit constants (Hugging Face free tier)
const RATE_LIMIT_MAX = 1000; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

/**
 * Checks if we're currently rate limited
 */
function isRateLimited(): boolean {
  const now = Date.now();
  
  // Reset counter if window has passed
  if (now - rateLimitState.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitState.requestCount = 0;
    rateLimitState.lastReset = now;
    rateLimitState.isLimited = false;
  }
  
  // Check if we've exceeded the limit
  if (rateLimitState.requestCount >= RATE_LIMIT_MAX) {
    rateLimitState.isLimited = true;
    rateLimitState.resetTime = rateLimitState.lastReset + RATE_LIMIT_WINDOW;
  }
  
  return rateLimitState.isLimited;
}

/**
 * Updates rate limit tracking after a request
 */
function updateRateLimit(wasSuccessful: boolean) {
  if (wasSuccessful) {
    rateLimitState.requestCount++;
  }
}

/**
 * Calls Hugging Face Inference API
 */
async function callHuggingFaceAPI(
  modelId: string,
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 512
): Promise<ModelResult> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    const error = new Error('HUGGINGFACE_API_KEY not configured');
    (error as any).code = 'NO_API_KEY';
    throw error;
  }
  
  const hfModelId = HF_MODEL_MAPPINGS[modelId];
  if (!hfModelId) {
    throw new Error(`Unknown model: ${modelId}`);
  }
  
  // Construct the full prompt
  let fullPrompt = prompt;
  if (systemPrompt) {
    fullPrompt = `System: ${systemPrompt}\n\nUser: ${prompt}`;
  }
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${hfModelId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: maxTokens,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false
          }
        })
      }
    );
    
    const latencyMs = Date.now() - startTime;
    
    if (!response.ok) {
      // Check for rate limiting
      if (response.status === 429) {
        rateLimitState.isLimited = true;
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          rateLimitState.resetTime = Date.now() + (parseInt(retryAfter) * 1000);
        }
        const error = new Error('Hugging Face quota exceeded. Rate limit active.');
        (error as any).code = 'RATE_LIMITED';
        (error as any).resetTime = rateLimitState.resetTime;
        throw error;
      }
      
      // Server errors
      if (response.status >= 500) {
        const error = new Error(`Hugging Face API server error: ${response.status}`);
        (error as any).code = 'API_ERROR';
        throw error;
      }
      
      // Other HTTP errors
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).code = 'HTTP_ERROR';
      throw error;
    }
    
    const data = await response.json();
    updateRateLimit(true);
    
    // Handle different response formats
    let text: string;
    if (Array.isArray(data) && data[0]?.generated_text) {
      text = data[0].generated_text;
    } else if (data.generated_text) {
      text = data.generated_text;
    } else {
      throw new Error('Unexpected response format from Hugging Face API');
    }
    
    // Estimate token usage (rough approximation)
    const usageTokens = Math.round(text.length / 4);
    
    return {
      modelId,
      text: text.trim(),
      latencyMs,
      usageTokens,
      source: 'hosted'
    };
    
  } catch (error) {
    // Re-throw known error types
    if (error instanceof Error && ['RATE_LIMITED', 'API_ERROR', 'NO_API_KEY'].includes((error as any).code)) {
      throw error;
    }
    
    // Network/fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Network connection failed. Please check your internet connection.');
      (networkError as any).code = 'NETWORK_ERROR';
      throw networkError;
    }
    
    // Log other errors but don't update rate limit for network/API errors
    console.error(`Hugging Face API error for ${modelId}:`, error);
    
    // Generic API error
    const apiError = new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    (apiError as any).code = 'API_ERROR';
    throw apiError;
  }
}

/**
 * Gets the fallback model ID for a given hosted model
 */
function getFallbackModelId(modelId: string): string {
  // Map hosted models to appropriate local fallbacks
  const fallbackMap: Record<string, string> = {
    'llama3.1-8b': 'local-stub',
    'mistral-7b': 'local-analytical'
  };
  
  return fallbackMap[modelId] || 'local-stub';
}

/**
 * Main function to call any model with automatic fallback
 */
export async function callModel(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<ModelResult> {
  const provider = MODEL_REGISTRY.find(p => p.id === modelId);
  
  if (!provider) {
    throw new Error(`Unknown model: ${modelId}`);
  }
  
  // If it's a local model, call directly
  if (provider.source === 'sample' || provider.source === 'local') {
    return getLocalModelResult(modelId, prompt, systemPrompt);
  }
  
  // For hosted models, try API first, then fallback
  if (provider.source === 'hosted') {
    // Check if we're rate limited
    if (isRateLimited()) {
      console.log(`Rate limited, falling back to local model for ${modelId}`);
      const fallbackId = getFallbackModelId(modelId);
      return getLocalModelResult(fallbackId, prompt, systemPrompt);
    }
    
    try {
      // Try Hugging Face API
      return await callHuggingFaceAPI(modelId, prompt, systemPrompt, provider.maxTokens);
      
    } catch (error) {
      console.log(`API call failed for ${modelId}, falling back to local model:`, error);
      
      // Fallback to local model
      const fallbackId = getFallbackModelId(modelId);
      const result = await getLocalModelResult(fallbackId, prompt, systemPrompt);
      
      // Keep the original model ID but mark as sample source to indicate fallback
      return {
        ...result,
        modelId, // Keep original model ID
        source: 'sample' // Indicate this is fallback data
      };
    }
  }
  
  throw new Error(`Unsupported model source: ${provider.source}`);
}

/**
 * Gets model information by ID
 */
export function getModelById(modelId: string): ModelProvider | undefined {
  return MODEL_REGISTRY.find(p => p.id === modelId);
}

/**
 * Gets all available models, optionally filtered by source
 */
export function getAvailableModels(sourceFilter?: ModelProvider['source']): ModelProvider[] {
  if (sourceFilter) {
    return MODEL_REGISTRY.filter(p => p.source === sourceFilter);
  }
  return MODEL_REGISTRY;
}

/**
 * Checks if hosted models are available (API key configured and not rate limited)
 */
export function areHostedModelsAvailable(): boolean {
  const hasApiKey = !!process.env.HUGGINGFACE_API_KEY;
  const notRateLimited = !isRateLimited();
  
  return hasApiKey && notRateLimited;
}

/**
 * Gets the current rate limit status
 */
export function getRateLimitStatus(): {
  isLimited: boolean;
  requestCount: number;
  maxRequests: number;
  resetTime?: number;
} {
  return {
    isLimited: rateLimitState.isLimited,
    requestCount: rateLimitState.requestCount,
    maxRequests: RATE_LIMIT_MAX,
    resetTime: rateLimitState.resetTime
  };
}

/**
 * Determines the appropriate source badge for a model result
 */
export function getSourceBadge(result: ModelResult): string {
  switch (result.source) {
    case 'hosted':
      return '✨ Hosted';
    case 'sample':
      return '📦 Sample';
    case 'local':
      return '💻 Local';
    default:
      return '❓ Unknown';
  }
}