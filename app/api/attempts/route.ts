import { NextRequest, NextResponse } from 'next/server';
import { writeAttempt, createAttempt, writeEvaluation, createEvaluation, writeEvaluationError } from '@/lib/storage';
import { CompareRequest, CompareResponse } from '@/app/api/compare/route';
import { 
  validateAttemptRequest, 
  sanitizePrompt, 
  sanitizeSystemPrompt,
  validateModelSelection,
  detectPromptInjection 
} from '@/lib/validation';

export interface CreateAttemptRequest {
  labId: string;
  userPrompt: string;
  models: string[];
  systemPrompt?: string;
  rubricVersion?: string;
}

export interface CreateAttemptResponse {
  attemptId: string;
  status: 'created' | 'processing' | 'completed' | 'failed';
  evaluation?: any;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * POST /api/attempts
 * Creates an attempt and processes it immediately (bypass mode)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if bypass mode is enabled
    const bypassEnabled = process.env.KIRO_BYPASS_HOOK === 'true';
    
    if (!bypassEnabled) {
      return NextResponse.json(
        { 
          error: 'Bypass mode not enabled. Set KIRO_BYPASS_HOOK=true to use this endpoint.',
          hint: 'This endpoint is for development/testing only. In production, use the Kiro hook system.'
        },
        { status: 403 }
      );
    }

    // Parse request body
    const rawBody = await request.json();
    
    // Validate request data
    const validationResult = validateAttemptRequest(rawBody);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.errors },
        { status: 400 }
      );
    }
    
    const body = rawBody;
    
    // Additional model selection validation based on lab type
    const modelValidation = validateModelSelection(body.labId, body.models);
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
      console.warn('Potential prompt injection detected in attempt request:', {
        attemptId: 'pending',
        labId: body.labId,
        patterns: injectionCheck.patterns,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
    }
    
    // Validate sanitized prompts aren't empty after sanitization
    if (!sanitizedUserPrompt.trim()) {
      return NextResponse.json(
        { error: 'User prompt is empty after sanitization' },
        { status: 400 }
      );
    }

    // Create attempt object with sanitized prompts
    const attempt = createAttempt(body.labId, sanitizedUserPrompt, body.models, sanitizedSystemPrompt);
    
    try {
      // Step 1: Write attempt file
      await writeAttempt(attempt);
      console.log(`[BYPASS] Created attempt ${attempt.attemptId} for lab ${body.labId}`);
      
      // Step 2: Process through compare API
      const compareRequest: CompareRequest = {
        userPrompt: sanitizedUserPrompt,
        systemPrompt: sanitizedSystemPrompt,
        models: body.models,
        rubricVersion: body.rubricVersion
      };
      
      // Make internal API call to /api/compare
      const compareUrl = new URL('/api/compare', request.url);
      const compareResponse = await fetch(compareUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(compareRequest)
      });
      
      if (!compareResponse.ok) {
        const errorData = await compareResponse.json();
        throw new Error(`Compare API failed: ${errorData.error || 'Unknown error'}`);
      }
      
      const compareResult: CompareResponse = await compareResponse.json();
      
      // Step 3: Write evaluation file
      const evaluation = createEvaluation(attempt.attemptId, compareResult.results);
      await writeEvaluation(evaluation);
      
      console.log(`[BYPASS] Completed evaluation for attempt ${attempt.attemptId}`);
      
      const response: CreateAttemptResponse = {
        attemptId: attempt.attemptId,
        status: 'completed',
        evaluation
      };
      
      return NextResponse.json(response);
      
    } catch (processingError) {
      console.error(`[BYPASS] Error processing attempt ${attempt.attemptId}:`, processingError);
      
      // Write error file
      await writeEvaluationError(attempt.attemptId, processingError);
      
      const response: CreateAttemptResponse = {
        attemptId: attempt.attemptId,
        status: 'failed',
        error: {
          message: processingError instanceof Error ? processingError.message : 'Processing failed',
          code: 'PROCESSING_ERROR'
        }
      };
      
      return NextResponse.json(response, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in POST /api/attempts:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Failed to create and process attempt',
        message: errorMessage,
        hint: 'Check that KIRO_BYPASS_HOOK=true is set and all required fields are provided.'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attempts
 * Returns information about the bypass endpoint
 */
export async function GET(): Promise<NextResponse> {
  try {
    const bypassEnabled = process.env.KIRO_BYPASS_HOOK === 'true';
    const { listAttempts } = await import('@/lib/storage');
    
    const recentAttempts = await listAttempts();
    
    return NextResponse.json({
      endpoint: '/api/attempts',
      methods: ['POST'],
      description: 'Development bypass endpoint that mirrors Kiro hook behavior',
      bypassEnabled,
      usage: {
        environment: 'Set KIRO_BYPASS_HOOK=true to enable',
        purpose: 'Testing and development - mirrors hook behavior exactly',
        fileStructure: 'Writes identical files to hook mode'
      },
      recentAttempts: recentAttempts.slice(-10),
      limits: {
        maxPromptLength: 2000,
        maxModelsPerRequest: 3,
        requiresBypass: true
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api/attempts:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve attempts information' },
      { status: 500 }
    );
  }
}