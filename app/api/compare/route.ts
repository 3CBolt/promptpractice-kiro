import { NextRequest, NextResponse } from 'next/server';
import { callModel } from '@/lib/models/providers';
import { evaluateResponse } from '@/lib/evaluator';
import { ModelResult } from '@/types';
import { 
  CompareRequestSchema, 
  sanitizePrompt, 
  sanitizeSystemPrompt,
  validateModelSelection,
  detectPromptInjection 
} from '@/lib/validation';

export interface CompareRequest {
  userPrompt: string;
  systemPrompt?: string;
  models: string[];
}

export interface CompareResponse {
  results: (ModelResult & {
    score?: number;
    breakdown?: { clarity: number; completeness: number };
    notes?: string;
  })[];
  metadata: {
    totalLatencyMs: number;
    processedAt: string;
    fallbacksUsed: string[];
  };
}

/**
 * POST /api/compare
 * Processes user prompts against multiple models and returns evaluated results
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const rawBody = await request.json();
    
    // Validate with Zod schema
    const validationResult = CompareRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }
    
    const body = validationResult.data;
    
    // Additional model selection validation (not covered by schema)
    const modelValidation = validateModelSelection('compare-basics', body.models);
    if (!modelValidation.isValid) {
      return NextResponse.json(
        { error: modelValidation.error },
        { status: 400 }
      );
    }
    
    // Sanitize prompts
    const sanitizedUserPrompt = sanitizePrompt(body.userPrompt);
    const sanitizedSystemPrompt = body.systemPrompt ? sanitizeSystemPrompt(body.systemPrompt) : undefined;
    
    // Check for prompt injection patterns
    const injectionCheck = detectPromptInjection(sanitizedUserPrompt);
    if (injectionCheck.isDetected) {
      console.warn('Potential prompt injection detected in compare request:', {
        patterns: injectionCheck.patterns,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      // Continue processing but log the attempt
    }
    
    // Validate sanitized prompts aren't empty after sanitization
    if (!sanitizedUserPrompt.trim()) {
      return NextResponse.json(
        { error: 'User prompt is empty after sanitization' },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    const fallbacksUsed: string[] = [];
    
    // Process each model in parallel
    const modelPromises = body.models.map(async (modelId) => {
      try {
        // Call the model with sanitized prompts
        const modelResult = await callModel(modelId, sanitizedUserPrompt, sanitizedSystemPrompt);
        
        // Track if fallback was used (source changed from hosted to sample)
        if (modelResult.source === 'sample' && modelId.includes('llama') || modelId.includes('mistral')) {
          fallbacksUsed.push(modelId);
        }
        
        // Evaluate the response using sanitized prompt
        const evaluation = evaluateResponse(sanitizedUserPrompt, modelResult);
        
        return {
          ...modelResult,
          score: evaluation.score,
          breakdown: evaluation.breakdown,
          notes: evaluation.notes
        };
        
      } catch (error) {
        console.error(`Error processing model ${modelId}:`, error);
        
        // Return error result for this model
        return {
          modelId,
          text: `Error: Failed to process request for ${modelId}`,
          latencyMs: 0,
          source: 'local' as const,
          score: 0,
          breakdown: { clarity: 0, completeness: 0 },
          notes: 'Model processing failed. Please try again.'
        };
      }
    });
    
    // Wait for all models to complete
    const results = await Promise.all(modelPromises);
    
    const totalLatencyMs = Date.now() - startTime;
    
    const response: CompareResponse = {
      results,
      metadata: {
        totalLatencyMs,
        processedAt: new Date().toISOString(),
        fallbacksUsed
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in /api/compare:', error);
    
    // Return standardized error response with better error classification
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any)?.code || 'INTERNAL_ERROR';
    
    let statusCode = 500;
    let userMessage = 'Failed to process comparison request';
    
    // Classify error types for better user experience
    if (errorCode === 'RATE_LIMITED') {
      statusCode = 429;
      userMessage = 'Rate limit exceeded. Please try again later or use sample mode.';
    } else if (errorCode === 'NETWORK_ERROR') {
      statusCode = 503;
      userMessage = 'Network connection failed. Please check your connection and try again.';
    } else if (errorCode === 'API_ERROR') {
      statusCode = 502;
      userMessage = 'External API service is temporarily unavailable. Please try again later.';
    } else if (errorCode === 'NO_API_KEY') {
      statusCode = 503;
      userMessage = 'API service not configured. Using sample responses.';
    }

    return NextResponse.json(
      {
        error: userMessage,
        code: errorCode,
        message: errorMessage,
        fallback: 'The app will automatically use sample responses when the API is unavailable.'
      },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/compare
 * Returns API information and available models
 */
export async function GET() {
  try {
    const { MODEL_REGISTRY, areHostedModelsAvailable, getRateLimitStatus } = await import('@/lib/models/providers');
    
    return NextResponse.json({
      endpoint: '/api/compare',
      methods: ['POST'],
      description: 'Compare user prompts across multiple AI models with automatic evaluation',
      availableModels: MODEL_REGISTRY,
      hostedModelsAvailable: areHostedModelsAvailable(),
      rateLimitStatus: getRateLimitStatus(),
      limits: {
        maxPromptLength: 2000,
        maxModelsPerRequest: 3,
        maxTokensPerModel: 512
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api/compare:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve API information' },
      { status: 500 }
    );
  }
}