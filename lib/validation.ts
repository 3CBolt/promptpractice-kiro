// Comprehensive input validation and security measures
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { Attempt, Evaluation, ModelResult } from '@/types';

// Constants for validation limits
export const VALIDATION_LIMITS = {
  MAX_PROMPT_LENGTH: 2000,
  MAX_SYSTEM_PROMPT_LENGTH: 1000,
  MAX_MODEL_SELECTION_PRACTICE: 1,
  MAX_MODEL_SELECTION_COMPARE: 3,
  MIN_MODEL_SELECTION_COMPARE: 2,
  MAX_FILENAME_LENGTH: 100,
  ALLOWED_LAB_IDS: ['practice-basics', 'compare-basics', 'system-prompt-lab'],
  ALLOWED_MODEL_IDS: ['llama3.1-8b', 'mistral-7b', 'local-stub']
} as const;

// Zod schemas for strict type validation
export const AttemptSchema = z.object({
  id: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\-_]+$/),
  labId: z.enum(['practice-basics', 'compare-basics', 'system-prompt-lab']),
  systemPrompt: z.string().max(VALIDATION_LIMITS.MAX_SYSTEM_PROMPT_LENGTH).optional(),
  userPrompt: z.string().min(1).max(VALIDATION_LIMITS.MAX_PROMPT_LENGTH),
  models: z.array(z.enum(['llama3.1-8b', 'mistral-7b', 'local-stub'])).min(1).max(3),
  createdAt: z.string().datetime()
});

export const ModelResultSchema = z.object({
  modelId: z.enum(['llama3.1-8b', 'mistral-7b', 'local-stub']),
  text: z.string().max(5000), // Allow longer responses
  latencyMs: z.number().min(0).max(60000), // Max 60 seconds
  usageTokens: z.number().min(0).max(2000).optional(),
  source: z.enum(['hosted', 'sample', 'local'])
});

export const EvaluationSchema = z.object({
  id: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\-_]+$/),
  attemptId: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\-_]+$/),
  perModelResults: z.array(ModelResultSchema.extend({
    score: z.number().min(0).max(10).optional(),
    breakdown: z.object({
      clarity: z.number().min(0).max(5),
      completeness: z.number().min(0).max(5)
    }).optional(),
    notes: z.string().max(1000).optional()
  })),
  createdAt: z.string().datetime()
});

// API request schemas
export const CompareRequestSchema = z.object({
  userPrompt: z.string().min(1).max(VALIDATION_LIMITS.MAX_PROMPT_LENGTH),
  systemPrompt: z.string().max(VALIDATION_LIMITS.MAX_SYSTEM_PROMPT_LENGTH).optional(),
  models: z.array(z.enum(['llama3.1-8b', 'mistral-7b', 'local-stub'])).min(1).max(3)
});

export const AttemptRequestSchema = z.object({
  labId: z.enum(['practice-basics', 'compare-basics', 'system-prompt-lab']),
  userPrompt: z.string().min(1).max(VALIDATION_LIMITS.MAX_PROMPT_LENGTH),
  systemPrompt: z.string().max(VALIDATION_LIMITS.MAX_SYSTEM_PROMPT_LENGTH).optional(),
  models: z.array(z.enum(['llama3.1-8b', 'mistral-7b', 'local-stub'])).min(1).max(3)
});

// Path traversal protection
export function validateFilePath(filePath: string): boolean {
  // Prevent directory traversal attacks
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Check for dangerous patterns
  if (normalizedPath.includes('..') || 
      normalizedPath.includes('~') || 
      normalizedPath.startsWith('/') ||
      normalizedPath.includes('//')) {
    return false;
  }
  
  // Only allow alphanumeric, hyphens, underscores, dots, and forward slashes
  if (!normalizedPath.match(/^[a-zA-Z0-9\-_./]+$/)) {
    return false;
  }
  
  // Ensure path is within expected directories
  const allowedPrefixes = ['data/attempts/', 'data/evaluations/', 'docs/guides/'];
  const hasValidPrefix = allowedPrefixes.some(prefix => normalizedPath.startsWith(prefix));
  
  if (!hasValidPrefix) {
    return false;
  }
  
  return true;
}

// Prompt sanitization to prevent injection attacks
export function sanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') {
    return '';
  }
  
  // Remove dangerous characters and patterns
  let sanitized = prompt
    .trim()
    .slice(0, VALIDATION_LIMITS.MAX_PROMPT_LENGTH)
    // Remove null bytes and control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove potential script injection patterns
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove potential prompt injection patterns
    .replace(/ignore\s+previous\s+instructions/gi, '[FILTERED]')
    .replace(/forget\s+everything/gi, '[FILTERED]')
    .replace(/system\s*:\s*you\s+are/gi, '[FILTERED]')
    .replace(/\[INST\]/gi, '[FILTERED]')
    .replace(/\[\/INST\]/gi, '[FILTERED]');
  
  return sanitized;
}

// System prompt sanitization (more restrictive)
export function sanitizeSystemPrompt(systemPrompt: string): string {
  if (!systemPrompt || typeof systemPrompt !== 'string') {
    return '';
  }
  
  let sanitized = systemPrompt
    .trim()
    .slice(0, VALIDATION_LIMITS.MAX_SYSTEM_PROMPT_LENGTH)
    // Remove null bytes and control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove HTML/script content
    .replace(/<[^>]*>/g, '')
    // Remove potential injection patterns
    .replace(/ignore\s+previous\s+instructions/gi, '[FILTERED]')
    .replace(/forget\s+everything/gi, '[FILTERED]')
    .replace(/\[INST\]/gi, '[FILTERED]')
    .replace(/\[\/INST\]/gi, '[FILTERED]');
  
  return sanitized;
}

// Content sanitization for markdown rendering
export function sanitizeMarkdown(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Use DOMPurify to sanitize HTML content
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
      'ul', 'ol', 'li', 'blockquote',
      'a', 'img'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover']
  });
  
  return sanitized;
}

// Model selection validation based on lab type
export function validateModelSelection(labId: string, models: string[]): { isValid: boolean; error?: string } {
  if (!Array.isArray(models) || models.length === 0) {
    return { isValid: false, error: 'At least one model must be selected' };
  }
  
  // Check if all models are valid
  const invalidModels = models.filter(model => !VALIDATION_LIMITS.ALLOWED_MODEL_IDS.includes(model as any));
  if (invalidModels.length > 0) {
    return { isValid: false, error: `Invalid models: ${invalidModels.join(', ')}` };
  }
  
  // Lab-specific validation
  switch (labId) {
    case 'practice-basics':
      if (models.length !== VALIDATION_LIMITS.MAX_MODEL_SELECTION_PRACTICE) {
        return { isValid: false, error: 'Practice lab requires exactly 1 model' };
      }
      break;
      
    case 'compare-basics':
      if (models.length < VALIDATION_LIMITS.MIN_MODEL_SELECTION_COMPARE || 
          models.length > VALIDATION_LIMITS.MAX_MODEL_SELECTION_COMPARE) {
        return { isValid: false, error: 'Compare lab requires 2-3 models' };
      }
      break;
      
    case 'system-prompt-lab':
      // Placeholder lab - allow any valid selection for now
      if (models.length > VALIDATION_LIMITS.MAX_MODEL_SELECTION_COMPARE) {
        return { isValid: false, error: 'Maximum 3 models allowed' };
      }
      break;
      
    default:
      return { isValid: false, error: 'Invalid lab ID' };
  }
  
  return { isValid: true };
}

// Detect potential prompt injection patterns
export function detectPromptInjection(prompt: string): { isDetected: boolean; patterns: string[] } {
  if (!prompt || typeof prompt !== 'string') {
    return { isDetected: false, patterns: [] };
  }
  
  const injectionPatterns = [
    /ignore\s+previous\s+instructions/i,
    /forget\s+everything/i,
    /system\s*:\s*you\s+are/i,
    /\[INST\]/i,
    /\[\/INST\]/i,
    /assistant\s*:\s*i\s+will/i,
    /human\s*:\s*ignore/i,
    /override\s+your\s+instructions/i,
    /disregard\s+your\s+training/i,
    /act\s+as\s+if\s+you\s+are/i,
    /pretend\s+to\s+be/i,
    /roleplay\s+as/i
  ];
  
  const detectedPatterns: string[] = [];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(prompt)) {
      detectedPatterns.push(pattern.source);
    }
  }
  
  return {
    isDetected: detectedPatterns.length > 0,
    patterns: detectedPatterns
  };
}

// Validate and sanitize attempt data
export function validateAttempt(data: any): { isValid: boolean; attempt?: Attempt; errors?: string[] } {
  try {
    // Parse with Zod schema
    const parsed = AttemptSchema.parse(data);
    
    // Additional validation
    const modelValidation = validateModelSelection(parsed.labId, parsed.models);
    if (!modelValidation.isValid) {
      return { isValid: false, errors: [modelValidation.error!] };
    }
    
    // Sanitize prompts
    const sanitizedUserPrompt = sanitizePrompt(parsed.userPrompt);
    const sanitizedSystemPrompt = parsed.systemPrompt ? sanitizeSystemPrompt(parsed.systemPrompt) : undefined;
    
    // Check for prompt injection
    const injectionCheck = detectPromptInjection(sanitizedUserPrompt);
    if (injectionCheck.isDetected) {
      console.warn('Potential prompt injection detected:', injectionCheck.patterns);
      // Don't block, but log for monitoring
    }
    
    const validatedAttempt: Attempt = {
      ...parsed,
      userPrompt: sanitizedUserPrompt,
      systemPrompt: sanitizedSystemPrompt
    };
    
    return { isValid: true, attempt: validatedAttempt };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    
    return { isValid: false, errors: ['Invalid attempt data'] };
  }
}

// Validate evaluation data
export function validateEvaluation(data: any): { isValid: boolean; evaluation?: Evaluation; errors?: string[] } {
  try {
    const parsed = EvaluationSchema.parse(data);
    return { isValid: true, evaluation: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    
    return { isValid: false, errors: ['Invalid evaluation data'] };
  }
}

// Client-side validation helpers
export function validatePromptLength(prompt: string): { isValid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { isValid: false, error: 'Prompt cannot be empty' };
  }
  
  if (prompt.length > VALIDATION_LIMITS.MAX_PROMPT_LENGTH) {
    return { 
      isValid: false, 
      error: `Prompt too long (${prompt.length}/${VALIDATION_LIMITS.MAX_PROMPT_LENGTH} characters)` 
    };
  }
  
  return { isValid: true };
}

export function validateSystemPromptLength(systemPrompt: string): { isValid: boolean; error?: string } {
  if (systemPrompt && systemPrompt.length > VALIDATION_LIMITS.MAX_SYSTEM_PROMPT_LENGTH) {
    return { 
      isValid: false, 
      error: `System prompt too long (${systemPrompt.length}/${VALIDATION_LIMITS.MAX_SYSTEM_PROMPT_LENGTH} characters)` 
    };
  }
  
  return { isValid: true };
}