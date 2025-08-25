/**
 * Schema validation utilities for v1.0 contracts
 */

import { Attempt, Evaluation } from '../types';
import { AttemptStatus, ErrorContract } from '../types/contracts';

// Validation limits
export const VALIDATION_LIMITS = {
  MAX_PROMPT_LENGTH: 2000,
  MAX_SYSTEM_PROMPT_LENGTH: 1000,
  MAX_MODELS: 3,
  MIN_MODELS: 1
};

/**
 * Validates that an attempt object matches the v1.0 schema
 */
export function validateAttempt(attempt: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  if (!attempt || typeof attempt !== 'object') {
    errors.push('Attempt must be an object');
  } else {
    if (typeof attempt.attemptId !== 'string' || !attempt.attemptId.match(/^[a-z0-9]{8}-[a-z0-9]{6}$/)) {
      errors.push('Invalid attemptId format');
    }
    if (typeof attempt.userId !== 'string') {
      errors.push('userId must be a string');
    }
    if (typeof attempt.labId !== 'string' || !['practice-basics', 'compare-basics', 'system-prompt-lab'].includes(attempt.labId)) {
      errors.push('Invalid labId');
    }
    if (typeof attempt.userPrompt !== 'string' || attempt.userPrompt.length > 2000) {
      errors.push('userPrompt must be a string with max 2000 characters');
    }
    if (!Array.isArray(attempt.models) || attempt.models.length < 1 || attempt.models.length > 3) {
      errors.push('models must be an array with 1-3 items');
    }
    if (typeof attempt.timestamp !== 'string') {
      errors.push('timestamp must be a string');
    }
    if (attempt.schemaVersion !== '1.0') {
      errors.push('schemaVersion must be "1.0"');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validates that an evaluation object matches the v1.0 schema
 */
export function validateEvaluation(evaluation: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  if (!evaluation || typeof evaluation !== 'object') {
    errors.push('Evaluation must be an object');
  } else {
    if (typeof evaluation.attemptId !== 'string') {
      errors.push('attemptId must be a string');
    }
    if (!Object.values(AttemptStatus).includes(evaluation.status)) {
      errors.push('Invalid status value');
    }
    if (typeof evaluation.timestamp !== 'string') {
      errors.push('timestamp must be a string');
    }
    if (evaluation.schemaVersion !== '1.0') {
      errors.push('schemaVersion must be "1.0"');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validates that an error object matches the ErrorContract
 */
export function validateErrorContract(error: any): error is ErrorContract {
  return (
    error !== null &&
    typeof error === 'object' &&
    typeof error.stage === 'string' &&
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    typeof error.help === 'string' &&
    typeof error.retryable === 'boolean' &&
    typeof error.timestamp === 'string'
  );
}

/**
 * Creates a v1.0 compliant attempt object
 */
export function createAttempt(params: {
  attemptId: string;
  userId?: string;
  labId: string;
  userPrompt: string;
  systemPrompt?: string;
  models: string[];
  rubricVersion?: string;
  modelConfig?: any;
  context?: any;
}): Attempt {
  return {
    attemptId: params.attemptId,
    userId: params.userId || 'anonymous',
    labId: params.labId,
    userPrompt: params.userPrompt,
    systemPrompt: params.systemPrompt,
    models: params.models,
    timestamp: new Date().toISOString(),
    schemaVersion: '1.0',
    rubricVersion: params.rubricVersion || '1.0',
    modelConfig: params.modelConfig,
    context: params.context
  };
}

/**
 * Creates a v1.0 compliant evaluation object
 */
export function createEvaluation(params: {
  attemptId: string;
  status: AttemptStatus;
  results?: any[];
  error?: ErrorContract;
  rubricVersion?: string;
}): Evaluation {
  return {
    attemptId: params.attemptId,
    status: params.status,
    results: params.results,
    error: params.error,
    rubricVersion: params.rubricVersion || '1.0',
    timestamp: new Date().toISOString(),
    schemaVersion: '1.0'
  };
}

/**
 * Creates a structured error contract
 */
export function createErrorContract(params: {
  stage: string;
  code: string;
  message: string;
  help: string;
  retryable: boolean;
}): ErrorContract {
  return {
    ...params,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validates prompt length
 */
export function validatePromptLength(prompt: string): { isValid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { isValid: false, error: 'Prompt cannot be empty' };
  }
  
  if (prompt.length > VALIDATION_LIMITS.MAX_PROMPT_LENGTH) {
    return { 
      isValid: false, 
      error: `Prompt must be ${VALIDATION_LIMITS.MAX_PROMPT_LENGTH} characters or less` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validates system prompt length
 */
export function validateSystemPromptLength(systemPrompt: string): { isValid: boolean; error?: string } {
  if (systemPrompt.length > VALIDATION_LIMITS.MAX_SYSTEM_PROMPT_LENGTH) {
    return { 
      isValid: false, 
      error: `System prompt must be ${VALIDATION_LIMITS.MAX_SYSTEM_PROMPT_LENGTH} characters or less` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validates model selection for a lab
 */
export function validateModelSelection(labId: string, models: string[]): { isValid: boolean; error?: string } {
  if (!models || models.length === 0) {
    return { isValid: false, error: 'At least one model must be selected' };
  }
  
  if (models.length > VALIDATION_LIMITS.MAX_MODELS) {
    return { 
      isValid: false, 
      error: `Maximum ${VALIDATION_LIMITS.MAX_MODELS} models allowed` 
    };
  }
  
  // Lab-specific validation
  if (labId === 'compare-basics' && models.length < 2) {
    return { isValid: false, error: 'Compare lab requires at least 2 models' };
  }
  
  if (labId === 'practice-basics' && models.length > 1) {
    return { isValid: false, error: 'Practice lab allows only 1 model' };
  }
  
  return { isValid: true };
}

/**
 * Sanitizes user prompt input
 */
export function sanitizePrompt(prompt: string): string {
  // Basic sanitization - remove potentially harmful characters
  return prompt
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
}

/**
 * Sanitizes system prompt input
 */
export function sanitizeSystemPrompt(systemPrompt: string): string {
  return sanitizePrompt(systemPrompt);
}

/**
 * Sanitizes markdown content (basic client-side version)
 */
export function sanitizeMarkdown(html: string): string {
  // Basic sanitization for client-side use
  // In production, this should use a proper sanitization library
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '');
}

/**
 * Validates file paths to prevent directory traversal
 */
export function validateFilePath(filePath: string): { isValid: boolean; error?: string } {
  // Check for directory traversal attempts
  if (filePath.includes('..') || filePath.includes('~')) {
    return { isValid: false, error: 'Invalid file path' };
  }
  
  // Ensure path is within allowed directories
  const allowedPrefixes = ['data/', 'docs/', '.kiro/'];
  const isAllowed = allowedPrefixes.some(prefix => filePath.startsWith(prefix));
  
  if (!isAllowed) {
    return { isValid: false, error: 'File path not in allowed directory' };
  }
  
  return { isValid: true };
}

/**
 * Detects potential prompt injection attempts
 */
export function detectPromptInjection(prompt: string): { isDetected: boolean; patterns?: string[] } {
  const suspiciousPatterns = [
    /ignore\s+previous\s+instructions/i,
    /forget\s+everything/i,
    /system\s*:\s*you\s+are/i,
    /\[system\]/i,
    /\<\|system\|\>/i,
    /assistant\s*:\s*i\s+will/i,
    /human\s*:\s*actually/i
  ];
  
  const detectedPatterns: string[] = [];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(prompt)) {
      detectedPatterns.push(pattern.source);
    }
  }
  
  return {
    isDetected: detectedPatterns.length > 0,
    patterns: detectedPatterns.length > 0 ? detectedPatterns : undefined
  };
}

/**
 * Simple request validation (not using Zod for now)
 */
export function validateAttemptRequest(body: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  if (!body.labId || typeof body.labId !== 'string') {
    errors.push('labId is required and must be a string');
  }
  
  if (!body.userPrompt || typeof body.userPrompt !== 'string') {
    errors.push('userPrompt is required and must be a string');
  }
  
  if (!Array.isArray(body.models) || body.models.length === 0) {
    errors.push('models is required and must be a non-empty array');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function validateCompareRequest(body: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  if (!body.userPrompt || typeof body.userPrompt !== 'string') {
    errors.push('userPrompt is required and must be a string');
  }
  
  if (!Array.isArray(body.models) || body.models.length === 0) {
    errors.push('models is required and must be a non-empty array');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

// Legacy schema objects for backward compatibility
export const AttemptRequestSchema = { validateAttemptRequest };
export const CompareRequestSchema = { validateCompareRequest };