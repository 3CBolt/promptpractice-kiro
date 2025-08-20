/**
 * Comprehensive error handling utilities for the Prompt Practice App
 * Provides standardized error classification, retry logic, and user messaging
 */

import { retryApiCall, getRetryRecommendation, isTemporaryError, isPermanentError } from './clientUtils';

export interface ErrorContext {
  operation: string;
  attemptId?: string;
  modelId?: string;
  timestamp: string;
}

export interface ErrorDetails {
  type: 'network' | 'api' | 'rate-limit' | 'validation' | 'timeout' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
  technicalMessage: string;
  code?: string;
  canRetry: boolean;
  suggestedAction: string;
  retryDelay?: number;
}

/**
 * Analyzes an error and returns detailed information for handling
 */
export function analyzeError(error: any, context?: ErrorContext): ErrorDetails {
  const timestamp = new Date().toISOString();
  const operation = context?.operation || 'unknown operation';

  // Network errors
  if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
    return {
      type: 'network',
      severity: 'medium',
      userMessage: 'Connection failed. Please check your internet connection and try again.',
      technicalMessage: `Network error during ${operation}: ${error.message}`,
      code: error.code || 'NETWORK_ERROR',
      canRetry: true,
      suggestedAction: 'Check your internet connection and retry',
      retryDelay: 5000
    };
  }

  // Rate limiting errors
  if (error?.message?.includes('rate limit') || error?.message?.includes('quota') || error?.code === 'RATE_LIMITED') {
    return {
      type: 'rate-limit',
      severity: 'medium',
      userMessage: 'Rate limit exceeded. The app will automatically use sample responses.',
      technicalMessage: `Rate limit exceeded during ${operation}: ${error.message}`,
      code: error.code || 'RATE_LIMITED',
      canRetry: true,
      suggestedAction: 'Wait for rate limit to reset or use sample mode',
      retryDelay: error.resetTime ? Math.max(0, error.resetTime - Date.now()) : 60000
    };
  }

  // API service errors
  if (error?.message?.includes('API') || error?.code === 'API_ERROR' || (error?.status >= 500)) {
    return {
      type: 'api',
      severity: 'high',
      userMessage: 'AI service is temporarily unavailable. Using sample responses instead.',
      technicalMessage: `API service error during ${operation}: ${error.message}`,
      code: error.code || 'API_ERROR',
      canRetry: true,
      suggestedAction: 'Wait a moment and try again, or continue with sample responses',
      retryDelay: 10000
    };
  }

  // Validation errors
  if (error?.code === 'VALIDATION_ERROR' || (error?.status >= 400 && error?.status < 500 && error?.status !== 429)) {
    return {
      type: 'validation',
      severity: 'low',
      userMessage: 'Invalid input. Please check your prompt and try again.',
      technicalMessage: `Validation error during ${operation}: ${error.message}`,
      code: error.code || 'VALIDATION_ERROR',
      canRetry: false,
      suggestedAction: 'Review your input and correct any issues'
    };
  }

  // Timeout errors
  if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
    return {
      type: 'timeout',
      severity: 'medium',
      userMessage: 'Request timed out. The operation may still be processing in the background.',
      technicalMessage: `Timeout error during ${operation}: ${error.message}`,
      code: error.code || 'TIMEOUT',
      canRetry: true,
      suggestedAction: 'Wait a moment and check again, or retry with a new request',
      retryDelay: 3000
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    severity: 'high',
    userMessage: 'An unexpected error occurred. Please try again.',
    technicalMessage: `Unknown error during ${operation}: ${error?.message || 'No error message'}`,
    code: error?.code || 'UNKNOWN_ERROR',
    canRetry: true,
    suggestedAction: 'Try again, and contact support if the problem persists',
    retryDelay: 3000
  };
}

/**
 * Creates a user-friendly error message with actionable guidance
 */
export function createErrorMessage(error: any, context?: ErrorContext): {
  title: string;
  message: string;
  details: ErrorDetails;
} {
  const details = analyzeError(error, context);
  
  const titles = {
    network: 'Connection Problem',
    api: 'Service Unavailable',
    'rate-limit': 'Rate Limit Reached',
    validation: 'Invalid Input',
    timeout: 'Request Timeout',
    unknown: 'Unexpected Error'
  };

  return {
    title: titles[details.type],
    message: details.userMessage,
    details
  };
}

/**
 * Determines if an error should trigger offline mode
 */
export function shouldEnterOfflineMode(error: any): {
  shouldEnter: boolean;
  reason?: 'no-api-key' | 'rate-limited' | 'network-error' | 'api-error';
  resetTime?: number;
} {
  const details = analyzeError(error);

  switch (details.type) {
    case 'rate-limit':
      return {
        shouldEnter: true,
        reason: 'rate-limited',
        resetTime: error.resetTime
      };
    case 'network':
      return {
        shouldEnter: true,
        reason: 'network-error'
      };
    case 'api':
      return {
        shouldEnter: true,
        reason: 'api-error'
      };
    default:
      return { shouldEnter: false };
  }
}

/**
 * Enhanced retry mechanism with intelligent backoff
 */
export class RetryManager {
  private attempts: Map<string, number> = new Map();
  private lastAttempt: Map<string, number> = new Map();

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRetries: number = 3,
    context?: ErrorContext
  ): Promise<T> {
    const currentAttempts = this.attempts.get(operationId) || 0;
    
    try {
      const result = await operation();
      // Reset on success
      this.attempts.delete(operationId);
      this.lastAttempt.delete(operationId);
      return result;
    } catch (error) {
      const details = analyzeError(error, context);
      
      // Don't retry permanent errors
      if (!details.canRetry || currentAttempts >= maxRetries) {
        throw error;
      }

      // Update attempt tracking
      this.attempts.set(operationId, currentAttempts + 1);
      this.lastAttempt.set(operationId, Date.now());

      // Wait before retry
      if (details.retryDelay) {
        await new Promise(resolve => setTimeout(resolve, details.retryDelay));
      }

      // Recursive retry
      return this.executeWithRetry(operation, operationId, maxRetries, context);
    }
  }

  getAttemptCount(operationId: string): number {
    return this.attempts.get(operationId) || 0;
  }

  getLastAttemptTime(operationId: string): number | undefined {
    return this.lastAttempt.get(operationId);
  }

  reset(operationId: string): void {
    this.attempts.delete(operationId);
    this.lastAttempt.delete(operationId);
  }
}

// Global retry manager instance
export const globalRetryManager = new RetryManager();

/**
 * Hook for managing error state with retry capabilities
 */
export function useErrorHandler() {
  const handleError = (error: any, context?: ErrorContext) => {
    const errorInfo = createErrorMessage(error, context);
    const offlineInfo = shouldEnterOfflineMode(error);
    
    return {
      ...errorInfo,
      offline: offlineInfo,
      canRetry: errorInfo.details.canRetry,
      retryDelay: errorInfo.details.retryDelay
    };
  };

  return { handleError };
}

/**
 * Utility for logging errors with context
 */
export function logError(error: any, context?: ErrorContext): void {
  const details = analyzeError(error, context);
  
  console.error(`[${details.severity.toUpperCase()}] ${details.type} error:`, {
    operation: context?.operation,
    attemptId: context?.attemptId,
    modelId: context?.modelId,
    timestamp: context?.timestamp,
    message: details.technicalMessage,
    code: details.code,
    canRetry: details.canRetry,
    originalError: error
  });
}