// Client-side utility functions

// Generate unique ID for attempts and evaluations
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Generate a fresh attempt ID for retries
export function generateAttemptId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

// Validate and sanitize user input
export function sanitizePrompt(prompt: string): string {
  // Basic sanitization - remove dangerous characters
  return prompt.trim().slice(0, 2000); // Max 2000 characters
}

// Path traversal guard for file operations
export function validateFilePath(path: string): boolean {
  // Prevent ../../../ attacks
  return !path.includes('..') && !path.includes('~') && !!path.match(/^[a-zA-Z0-9\-_./]+$/);
}

// Format timestamp for consistent display
export function formatTimestamp(date: Date): string {
  return date.toISOString();
}

/**
 * Error handling utilities
 */

// Determines if an error is due to rate limiting
export function isRateLimitError(error: any): boolean {
  if (error?.message?.includes('RATE_LIMITED')) return true;
  if (error?.message?.includes('rate limit')) return true;
  if (error?.message?.includes('quota exceeded')) return true;
  if (error?.code === 'RATE_LIMITED') return true;
  return false;
}

// Determines if an error is due to network issues
export function isNetworkError(error: any): boolean {
  if (error?.message?.includes('fetch')) return true;
  if (error?.message?.includes('network')) return true;
  if (error?.message?.includes('connection')) return true;
  if (error?.code === 'NETWORK_ERROR') return true;
  return false;
}

// Determines if an error is due to API issues
export function isAPIError(error: any): boolean {
  if (error?.message?.includes('API')) return true;
  if (error?.message?.includes('HTTP 5')) return true;
  if (error?.code === 'API_ERROR') return true;
  return false;
}

// Gets a user-friendly error message from an error object
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'An unexpected error occurred';
}

// Gets the appropriate offline mode reason from an error
export function getOfflineReason(error: any): 'no-api-key' | 'rate-limited' | 'network-error' | 'api-error' | undefined {
  if (isRateLimitError(error)) return 'rate-limited';
  if (isNetworkError(error)) return 'network-error';
  if (isAPIError(error)) return 'api-error';
  if (error?.message?.includes('HUGGINGFACE_API_KEY')) return 'no-api-key';
  return undefined;
}

// Calculates time remaining until a reset time
export function getTimeUntilReset(resetTime: number): string {
  const now = Date.now();
  const diff = resetTime - now;
  
  if (diff <= 0) return 'now';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Retry mechanism utilities
 */

// Retry configuration interface
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

// Calculate delay for exponential backoff
export function calculateRetryDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

// Sleep utility for retry delays
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generic retry wrapper with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  shouldRetry?: (error: any) => boolean
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt > config.maxRetries) {
        break;
      }
      
      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(error)) {
        break;
      }
      
      // Don't retry certain error types
      if ((error as any)?.code === 'VALIDATION_ERROR' || (error as any)?.code === 'NOT_FOUND') {
        break;
      }
      
      const delay = calculateRetryDelay(attempt, config);
      console.log(`Retry attempt ${attempt}/${config.maxRetries} after ${delay}ms delay`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

// Specific retry function for API calls
export async function retryApiCall<T>(
  apiCall: () => Promise<Response>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  return withRetry(
    async () => {
      const response = await apiCall();
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).code = errorData.code || `HTTP_${response.status}`;
        (error as any).status = response.status;
        throw error;
      }
      
      return response.json();
    },
    config,
    (error) => {
      // Retry on network errors and 5xx server errors, but not 4xx client errors
      const status = (error as any)?.status;
      if (status && status >= 400 && status < 500) {
        return false; // Don't retry client errors
      }
      return true; // Retry network errors and server errors
    }
  );
}

/**
 * Resubmit functionality for feedback panel
 */

// Create a new attempt with preserved context for resubmission
export function createResubmitAttempt(
  originalAttempt: any,
  newPrompt?: string
): any {
  const newAttemptId = generateAttemptId();
  
  return {
    ...originalAttempt,
    attemptId: newAttemptId,
    userPrompt: newPrompt || originalAttempt.userPrompt,
    timestamp: new Date().toISOString(),
    context: {
      ...originalAttempt.context,
      isResubmit: true,
      originalAttemptId: originalAttempt.attemptId
    }
  };
}

// Preserve learning context when resubmitting
export function preserveLearningContext(
  originalContext: any,
  feedbackReceived: boolean = true
): any {
  return {
    ...originalContext,
    feedbackReceived,
    resubmitCount: (originalContext?.resubmitCount || 0) + 1,
    learningSession: originalContext?.learningSession || generateId()
  };
}

/**
 * Enhanced error classification
 */

// Check if error indicates a temporary issue that might resolve
export function isTemporaryError(error: any): boolean {
  return isRateLimitError(error) || isNetworkError(error) || isAPIError(error);
}

// Check if error indicates a permanent issue that won't resolve with retry
export function isPermanentError(error: any): boolean {
  const status = (error as any)?.status;
  if (status && status >= 400 && status < 500 && status !== 429) {
    return true; // 4xx errors except rate limiting are permanent
  }
  
  const code = (error as any)?.code;
  if (code === 'VALIDATION_ERROR' || code === 'NOT_FOUND' || code === 'UNAUTHORIZED') {
    return true;
  }
  
  return false;
}

// Get retry recommendation based on error type
export function getRetryRecommendation(error: any): {
  canRetry: boolean;
  reason: string;
  suggestedDelay?: number;
} {
  if (isPermanentError(error)) {
    return {
      canRetry: false,
      reason: 'This error cannot be resolved by retrying'
    };
  }
  
  if (isRateLimitError(error)) {
    return {
      canRetry: true,
      reason: 'Rate limit exceeded - retry after delay',
      suggestedDelay: 60000 // 1 minute
    };
  }
  
  if (isNetworkError(error)) {
    return {
      canRetry: true,
      reason: 'Network connection issue - retry after brief delay',
      suggestedDelay: 5000 // 5 seconds
    };
  }
  
  if (isAPIError(error)) {
    return {
      canRetry: true,
      reason: 'API service issue - retry after delay',
      suggestedDelay: 10000 // 10 seconds
    };
  }
  
  return {
    canRetry: true,
    reason: 'Temporary issue - retry may help',
    suggestedDelay: 3000 // 3 seconds
  };
}