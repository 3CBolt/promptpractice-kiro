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