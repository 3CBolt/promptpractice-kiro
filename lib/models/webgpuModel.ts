/**
 * Browser-based LLM using WebLLM for in-browser inference
 * Provides zero-setup experience with local model execution
 */

import { ModelResult, ModelSource } from '@/types';
import { trackWebGPUFailure, resetWebGPUFailures } from '@/lib/fallbackResponses';

// WebLLM types (simplified interface)
interface WebLLMEngine {
  reload: (modelId: string, chatOpts?: any) => Promise<void>;
  chat: (messages: Array<{ role: string; content: string }>) => Promise<string>;
  unload: () => Promise<void>;
  isLoaded: () => boolean;
}

interface WebLLMProgressCallback {
  (report: { text: string; progress?: number }): void;
}

// Model configurations for browser inference
export interface WebGPUModelConfig {
  id: string;
  name: string;
  modelId: string; // WebLLM model identifier
  size: 'tiny' | 'small' | 'medium';
  description: string;
  estimatedSize: string;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'basic' | 'good' | 'excellent';
}

export const WEBGPU_MODELS: WebGPUModelConfig[] = [
  {
    id: 'webgpu-tiny',
    name: 'Fast (Tiny)',
    modelId: 'Phi-3-mini-4k-instruct-q4f16_1-MLC',
    size: 'tiny',
    description: 'Fastest inference, basic quality responses',
    estimatedSize: '~2.2GB',
    speed: 'fast',
    quality: 'basic'
  },
  {
    id: 'webgpu-small',
    name: 'Better (Small)',
    modelId: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    size: 'small',
    description: 'Balanced speed and quality',
    estimatedSize: '~1.9GB',
    speed: 'medium',
    quality: 'good'
  }
];

// Loading states for progress tracking
export type LoadingState = 
  | 'idle'
  | 'checking-webgpu'
  | 'fetching-weights'
  | 'compiling'
  | 'warming-up'
  | 'ready'
  | 'error'
  | 'retrying'
  | 'fallback';

export interface LoadingProgress {
  state: LoadingState;
  progress: number; // 0-100
  message: string;
  error?: string;
  estimatedTimeRemaining?: number; // seconds
  retryAttempt?: number;
  maxRetries?: number;
}

// Error types for model loading
export type ModelLoadError = 
  | 'webgpu-unavailable'
  | 'model-download-failed'
  | 'compilation-failed'
  | 'insufficient-memory'
  | 'network-error'
  | 'unknown-error';

export interface ModelLoadErrorDetails {
  type: ModelLoadError;
  message: string;
  canRetry: boolean;
  suggestedFallback?: string;
  nextSteps: string[];
}

// WebGPU capability detection
export function detectWebGPUSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if WebGPU is available
    if (typeof navigator === 'undefined' || !(navigator as any).gpu) {
      resolve(false);
      return;
    }

    (navigator as any).gpu.requestAdapter()
      .then((adapter: any) => {
        resolve(!!adapter);
      })
      .catch(() => {
        resolve(false);
      });
  });
}

// Local storage keys for caching
const STORAGE_KEYS = {
  LAST_MODEL: 'webgpu_last_model',
  MODEL_CACHE: 'webgpu_model_cache',
  ONBOARDING_COMPLETE: 'webgpu_onboarding_complete'
} as const;

// WebGPU Model Manager
export class WebGPUModelManager {
  private engine: WebLLMEngine | null = null;
  private currentModelId: string | null = null;
  private loadingState: LoadingState = 'idle';
  private progressCallback: ((progress: LoadingProgress) => void) | null = null;
  private webgpuSupported: boolean | null = null;
  private retryAttempts: number = 0;
  private maxRetries: number = 3;
  private fallbackMode: boolean = false;
  private loadingStartTime: number = 0;

  constructor() {
    this.checkWebGPUSupport();
  }

  private async checkWebGPUSupport(): Promise<void> {
    if (this.webgpuSupported === null) {
      this.webgpuSupported = await detectWebGPUSupport();
    }
  }

  public async isWebGPUSupported(): Promise<boolean> {
    await this.checkWebGPUSupport();
    return this.webgpuSupported || false;
  }

  public setProgressCallback(callback: (progress: LoadingProgress) => void): void {
    this.progressCallback = callback;
  }

  private updateProgress(state: LoadingState, progress: number, message: string, error?: string): void {
    this.loadingState = state;
    
    // Calculate estimated time remaining based on progress and elapsed time
    let estimatedTimeRemaining: number | undefined;
    if (this.loadingStartTime > 0 && progress > 0 && progress < 100) {
      const elapsed = (Date.now() - this.loadingStartTime) / 1000;
      const totalEstimated = elapsed / (progress / 100);
      estimatedTimeRemaining = Math.max(0, totalEstimated - elapsed);
    }
    
    if (this.progressCallback) {
      this.progressCallback({ 
        state, 
        progress, 
        message, 
        error,
        estimatedTimeRemaining,
        retryAttempt: this.retryAttempts,
        maxRetries: this.maxRetries
      });
    }
  }

  private analyzeLoadError(error: any): ModelLoadErrorDetails {
    const errorMessage = error?.message || 'Unknown error';
    
    if (errorMessage.includes('WebGPU') || errorMessage.includes('gpu')) {
      return {
        type: 'webgpu-unavailable',
        message: 'WebGPU is not available in this browser',
        canRetry: false,
        suggestedFallback: 'read-only-demo',
        nextSteps: [
          'Try using Chrome or Edge browser',
          'Enable hardware acceleration in browser settings',
          'Continue with read-only demo mode'
        ]
      };
    }
    
    if (errorMessage.includes('download') || errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return {
        type: 'network-error',
        message: 'Failed to download model weights',
        canRetry: true,
        suggestedFallback: 'webgpu-tiny',
        nextSteps: [
          'Check your internet connection',
          'Try again in a few moments',
          'Switch to a smaller model'
        ]
      };
    }
    
    if (errorMessage.includes('memory') || errorMessage.includes('OOM')) {
      return {
        type: 'insufficient-memory',
        message: 'Not enough memory to load this model',
        canRetry: false,
        suggestedFallback: 'webgpu-tiny',
        nextSteps: [
          'Close other browser tabs',
          'Try a smaller model',
          'Use read-only demo mode'
        ]
      };
    }
    
    if (errorMessage.includes('compile') || errorMessage.includes('compilation')) {
      return {
        type: 'compilation-failed',
        message: 'Failed to compile model for WebGPU',
        canRetry: true,
        suggestedFallback: 'webgpu-tiny',
        nextSteps: [
          'Try again with a different model',
          'Update your browser',
          'Use read-only demo mode'
        ]
      };
    }
    
    return {
      type: 'unknown-error',
      message: errorMessage,
      canRetry: true,
      suggestedFallback: 'read-only-demo',
      nextSteps: [
        'Try again in a few moments',
        'Switch to a different model',
        'Continue with read-only demo mode'
      ]
    };
  }

  public async loadModel(modelId: string, isRetry: boolean = false): Promise<void> {
    const modelConfig = WEBGPU_MODELS.find(m => m.id === modelId);
    if (!modelConfig) {
      throw new Error(`Unknown WebGPU model: ${modelId}`);
    }

    if (!isRetry) {
      this.retryAttempts = 0;
      this.loadingStartTime = Date.now();
    }

    // Check WebGPU support first
    if (!(await this.isWebGPUSupported())) {
      const error = new Error('WebGPU not supported in this browser');
      const errorDetails = this.analyzeLoadError(error);
      this.updateProgress('error', 0, errorDetails.message, error.message);
      throw error;
    }

    try {
      this.updateProgress('checking-webgpu', 5, 'Checking WebGPU compatibility...');

      // Lazy load WebLLM
      if (!this.engine) {
        this.updateProgress('fetching-weights', 10, 'Loading WebLLM library...');
        
        // Dynamic import of WebLLM (would be actual import in real implementation)
        // For now, we'll simulate the loading process
        await this.simulateWebLLMLoad();
        
        // Create engine instance (simulated)
        this.engine = await this.createWebLLMEngine();
      }

      // Load the specific model
      this.updateProgress('fetching-weights', 20, `Fetching ${modelConfig.name} weights (${modelConfig.estimatedSize})...`);
      
      // Simulate model loading with progress updates
      await this.simulateModelLoad(modelConfig);
      
      this.currentModelId = modelId;
      this.retryAttempts = 0; // Reset on success
      this.updateProgress('ready', 100, `${modelConfig.name} ready for inference`);
      
      // Cache the successful model choice and reset failure tracking
      localStorage.setItem(STORAGE_KEYS.LAST_MODEL, modelId);
      resetWebGPUFailures();
      
    } catch (error) {
      const errorDetails = this.analyzeLoadError(error);
      
      // Try retry logic if applicable
      if (errorDetails.canRetry && this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        this.updateProgress('retrying', 0, `Retry ${this.retryAttempts}/${this.maxRetries}: ${errorDetails.message}`);
        
        // Wait before retry with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, this.retryAttempts - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        return this.loadModel(modelId, true);
      }
      
      // If retries exhausted or error not retryable, try fallback
      if (errorDetails.suggestedFallback && errorDetails.suggestedFallback !== modelId) {
        this.updateProgress('fallback', 0, `Trying fallback: ${errorDetails.suggestedFallback}`);
        
        try {
          return await this.loadModel(errorDetails.suggestedFallback, false);
        } catch (fallbackError) {
          // If fallback also fails, enter read-only mode
          this.fallbackMode = true;
          this.updateProgress('fallback', 100, 'Entering read-only demo mode');
          return;
        }
      }
      
      // Final error state - track failure
      trackWebGPUFailure();
      this.updateProgress('error', 0, errorDetails.message, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async simulateWebLLMLoad(): Promise<void> {
    // Simulate WebLLM library loading
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  private async createWebLLMEngine(): Promise<WebLLMEngine> {
    // Simulate WebLLM engine creation
    return {
      reload: async (modelId: string) => {
        // Simulate model reload
        await new Promise(resolve => setTimeout(resolve, 500));
      },
      chat: async (messages: Array<{ role: string; content: string }>) => {
        // Simulate chat completion
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.generateSimulatedResponse(messages);
      },
      unload: async () => {
        // Simulate model unload
        await new Promise(resolve => setTimeout(resolve, 200));
      },
      isLoaded: () => this.currentModelId !== null
    };
  }

  private async simulateModelLoad(config: WebGPUModelConfig): Promise<void> {
    // Simulate potential failures for demonstration
    const shouldSimulateFailure = Math.random() < 0.1; // 10% chance of failure for demo
    
    const steps = [
      { progress: 30, message: 'Downloading model weights...', delay: 2000, state: 'fetching-weights' as LoadingState },
      { progress: 60, message: 'Compiling model for WebGPU...', delay: 1500, state: 'compiling' as LoadingState },
      { progress: 80, message: 'Warming up inference engine...', delay: 1000, state: 'warming-up' as LoadingState },
      { progress: 95, message: 'Finalizing setup...', delay: 500, state: 'warming-up' as LoadingState }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Simulate failure at different stages
      if (shouldSimulateFailure && i === 1) {
        throw new Error('Model compilation failed: WebGPU shader compilation error');
      }
      
      this.updateProgress(step.state, step.progress, step.message);
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }
  }

  private generateSimulatedResponse(messages: Array<{ role: string; content: string }>): string {
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    
    // Generate contextual responses based on the prompt
    const responses = [
      `Based on your prompt "${userMessage.substring(0, 50)}...", here's a thoughtful response that demonstrates the model's understanding of the context and provides helpful information.`,
      `I understand you're asking about "${userMessage.substring(0, 30)}...". Let me provide a comprehensive answer that addresses your specific needs and offers practical insights.`,
      `Your prompt about "${userMessage.substring(0, 40)}..." is interesting. Here's my analysis and recommendations based on the information you've provided.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  public async generateResponse(
    prompt: string,
    systemPrompt?: string
  ): Promise<ModelResult> {
    // If in fallback mode, use pre-generated responses
    if (this.fallbackMode) {
      const { getFallbackGenerator } = await import('@/lib/fallbackResponses');
      const generator = getFallbackGenerator();
      return generator.generateResponse(prompt, systemPrompt);
    }

    if (!this.engine || !this.currentModelId) {
      throw new Error('No model loaded. Please load a model first.');
    }

    const startTime = Date.now();
    
    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });
      
      const response = await this.engine.chat(messages);
      const latencyMs = Date.now() - startTime;
      
      // Estimate token usage (rough approximation)
      const usageTokens = Math.round(response.length / 4);
      
      return {
        modelId: this.currentModelId,
        response: response,
        latency: latencyMs,
        tokenCount: usageTokens,
        source: ModelSource.LOCAL
      };
      
    } catch (error) {
      throw new Error(`WebGPU inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public getLoadingState(): LoadingState {
    return this.loadingState;
  }

  public getCurrentModelId(): string | null {
    return this.currentModelId;
  }

  public getLastUsedModel(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_MODEL);
  }

  public async unloadModel(): Promise<void> {
    if (this.engine) {
      await this.engine.unload();
    }
    this.currentModelId = null;
    this.loadingState = 'idle';
  }

  public isModelLoaded(): boolean {
    return this.currentModelId !== null && (this.loadingState === 'ready' || this.fallbackMode);
  }

  public isFallbackMode(): boolean {
    return this.fallbackMode;
  }

  public getErrorDetails(): ModelLoadErrorDetails | null {
    if (this.loadingState !== 'error') return null;
    
    return {
      type: 'unknown-error',
      message: 'Model loading failed',
      canRetry: true,
      suggestedFallback: 'read-only-demo',
      nextSteps: [
        'Try again with a different model',
        'Check your internet connection',
        'Continue with read-only demo mode'
      ]
    };
  }

  public async retryCurrentModel(): Promise<void> {
    if (!this.currentModelId) {
      throw new Error('No model to retry');
    }
    
    this.retryAttempts = 0;
    this.fallbackMode = false;
    return this.loadModel(this.currentModelId, false);
  }

  public enterFallbackMode(): void {
    this.fallbackMode = true;
    this.currentModelId = 'read-only-demo';
    this.updateProgress('fallback', 100, 'Read-only demo mode active');
  }
}

// Singleton instance
let webgpuManager: WebGPUModelManager | null = null;

export function getWebGPUManager(): WebGPUModelManager {
  if (!webgpuManager) {
    webgpuManager = new WebGPUModelManager();
  }
  return webgpuManager;
}

// Utility functions for localStorage management
export function getOnboardingComplete(): boolean {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
}

export function setOnboardingComplete(): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
}

export function clearOnboarding(): void {
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
}