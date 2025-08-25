import { NextRequest, NextResponse } from 'next/server';
import { 
  validateAttempt,
  validateEvaluation,
  sanitizePrompt,
  sanitizeSystemPrompt,
  sanitizeMarkdown,
  detectPromptInjection,
  validateFilePath,
  validateModelSelection,
  validatePromptLength,
  validateSystemPromptLength,
  VALIDATION_LIMITS
} from '@/lib/validation';

export interface ValidationRequest {
  type: 'attempt' | 'evaluation' | 'prompt' | 'system-prompt' | 'markdown' | 'file-path' | 'model-selection' | 'injection-detection';
  data: any;
  options?: {
    labId?: string;
    models?: string[];
  };
}

export interface ValidationResponse {
  isValid: boolean;
  sanitized?: string;
  errors?: string[];
  warnings?: string[];
  detectedPatterns?: string[];
  metadata?: {
    originalLength?: number;
    sanitizedLength?: number;
    validationLimits?: typeof VALIDATION_LIMITS;
  };
}

/**
 * POST /api/dev/validate
 * Development endpoint for testing validation functions
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if development mode is enabled
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_ENDPOINTS === 'true';
    
    if (!isDevelopment) {
      return NextResponse.json(
        { 
          error: 'Development endpoints are disabled in production',
          hint: 'Set ENABLE_DEV_ENDPOINTS=true to enable in non-development environments'
        },
        { status: 403 }
      );
    }

    const body: ValidationRequest = await request.json();
    
    if (!body.type || !body.data) {
      return NextResponse.json(
        { error: 'Missing required fields: type and data' },
        { status: 400 }
      );
    }

    let response: ValidationResponse;

    switch (body.type) {
      case 'attempt':
        const attemptValidation = validateAttempt(body.data);
        response = {
          isValid: attemptValidation.isValid,
          errors: attemptValidation.errors || [],
          metadata: {
            validationLimits: VALIDATION_LIMITS
          }
        };
        break;

      case 'evaluation':
        const evaluationValidation = validateEvaluation(body.data);
        response = {
          isValid: evaluationValidation.isValid,
          errors: evaluationValidation.errors || [],
          metadata: {
            validationLimits: VALIDATION_LIMITS
          }
        };
        break;

      case 'prompt':
        const originalPrompt = String(body.data);
        const sanitizedPrompt = sanitizePrompt(originalPrompt);
        const promptLengthValidation = validatePromptLength(originalPrompt);
        const injectionCheck = detectPromptInjection(originalPrompt);
        
        response = {
          isValid: promptLengthValidation.isValid,
          sanitized: sanitizedPrompt,
          errors: promptLengthValidation.isValid ? [] : [promptLengthValidation.error!],
          warnings: injectionCheck.isDetected ? ['Potential prompt injection patterns detected'] : [],
          detectedPatterns: injectionCheck.patterns,
          metadata: {
            originalLength: originalPrompt.length,
            sanitizedLength: sanitizedPrompt.length,
            validationLimits: VALIDATION_LIMITS
          }
        };
        break;

      case 'system-prompt':
        const originalSystemPrompt = String(body.data);
        const sanitizedSystemPrompt = sanitizeSystemPrompt(originalSystemPrompt);
        const systemPromptLengthValidation = validateSystemPromptLength(originalSystemPrompt);
        const systemInjectionCheck = detectPromptInjection(originalSystemPrompt);
        
        response = {
          isValid: systemPromptLengthValidation.isValid,
          sanitized: sanitizedSystemPrompt,
          errors: systemPromptLengthValidation.isValid ? [] : [systemPromptLengthValidation.error!],
          warnings: systemInjectionCheck.isDetected ? ['Potential prompt injection patterns detected'] : [],
          detectedPatterns: systemInjectionCheck.patterns,
          metadata: {
            originalLength: originalSystemPrompt.length,
            sanitizedLength: sanitizedSystemPrompt.length,
            validationLimits: VALIDATION_LIMITS
          }
        };
        break;

      case 'markdown':
        const originalMarkdown = String(body.data);
        const sanitizedMarkdownContent = sanitizeMarkdown(originalMarkdown);
        
        response = {
          isValid: true,
          sanitized: sanitizedMarkdownContent,
          metadata: {
            originalLength: originalMarkdown.length,
            sanitizedLength: sanitizedMarkdownContent.length
          }
        };
        break;

      case 'file-path':
        const filePath = String(body.data);
        const pathValidation = validateFilePath(filePath);
        
        response = {
          isValid: pathValidation.isValid,
          errors: pathValidation.isValid ? [] : [pathValidation.error || 'Invalid file path']
        };
        break;

      case 'model-selection':
        const { labId, models } = body.options || {};
        if (!labId || !models) {
          return NextResponse.json(
            { error: 'Model selection validation requires labId and models in options' },
            { status: 400 }
          );
        }
        
        const modelValidation = validateModelSelection(labId, models);
        response = {
          isValid: modelValidation.isValid,
          errors: modelValidation.isValid ? [] : [modelValidation.error!],
          metadata: {
            validationLimits: VALIDATION_LIMITS
          }
        };
        break;

      case 'injection-detection':
        const testPrompt = String(body.data);
        const injectionResult = detectPromptInjection(testPrompt);
        
        response = {
          isValid: !injectionResult.isDetected,
          warnings: injectionResult.isDetected ? ['Potential prompt injection detected'] : [],
          detectedPatterns: injectionResult.patterns
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown validation type: ${body.type}` },
          { status: 400 }
        );
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in /api/dev/validate:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Validation endpoint failed',
        message: errorMessage,
        hint: 'Check the request format and try again'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dev/validate
 * Returns information about available validation functions
 */
export async function GET(): Promise<NextResponse> {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_ENDPOINTS === 'true';
    
    if (!isDevelopment) {
      return NextResponse.json(
        { error: 'Development endpoints are disabled in production' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      endpoint: '/api/dev/validate',
      methods: ['POST'],
      description: 'Development endpoint for testing validation functions',
      availableTypes: [
        'attempt',
        'evaluation', 
        'prompt',
        'system-prompt',
        'markdown',
        'file-path',
        'model-selection',
        'injection-detection'
      ],
      validationLimits: VALIDATION_LIMITS,
      schemas: {
        attempt: 'Validates complete attempt objects with sanitization',
        evaluation: 'Validates evaluation result objects',
        prompt: 'Sanitizes and validates user prompts with injection detection',
        'system-prompt': 'Sanitizes and validates system prompts (more restrictive)',
        markdown: 'Sanitizes HTML content for safe rendering',
        'file-path': 'Validates file paths to prevent directory traversal',
        'model-selection': 'Validates model selection based on lab type',
        'injection-detection': 'Detects potential prompt injection patterns'
      },
      usage: {
        method: 'POST',
        body: {
          type: 'string (required)',
          data: 'any (required)',
          options: {
            labId: 'string (for model-selection)',
            models: 'string[] (for model-selection)'
          }
        }
      }
    });

  } catch (error) {
    console.error('Error in GET /api/dev/validate:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve validation endpoint information' },
      { status: 500 }
    );
  }
}