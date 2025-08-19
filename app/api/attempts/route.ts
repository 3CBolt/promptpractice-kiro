import { NextRequest, NextResponse } from 'next/server';
import { writeAttempt, createAttempt } from '@/lib/storage';
import { processAttemptDirect } from '../../../.kiro/hooks/onAttemptCreated';

export interface CreateAttemptRequest {
  labId: string;
  userPrompt: string;
  models: string[];
  systemPrompt?: string;
}

/**
 * POST /api/attempts
 * Creates a new attempt and optionally processes it immediately (bypass mode)
 * This endpoint mirrors the hook behavior for development and testing
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateAttemptRequest = await request.json();
    
    // Validate request body
    if (!body.labId || typeof body.labId !== 'string') {
      return NextResponse.json(
        { error: 'labId is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (!body.userPrompt || typeof body.userPrompt !== 'string') {
      return NextResponse.json(
        { error: 'userPrompt is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (!body.models || !Array.isArray(body.models) || body.models.length === 0) {
      return NextResponse.json(
        { error: 'models array is required and must contain at least one model' },
        { status: 400 }
      );
    }

    // Apply same validation as hook
    if (body.userPrompt.length > 2000) {
      return NextResponse.json(
        { error: 'userPrompt exceeds maximum length of 2000 characters' },
        { status: 400 }
      );
    }
    
    if (body.systemPrompt && body.systemPrompt.length > 2000) {
      return NextResponse.json(
        { error: 'systemPrompt exceeds maximum length of 2000 characters' },
        { status: 400 }
      );
    }
    
    if (body.models.length > 3) {
      return NextResponse.json(
        { error: 'Maximum of 3 models allowed per request' },
        { status: 400 }
      );
    }

    // Create attempt
    const attempt = createAttempt(
      body.labId,
      body.userPrompt,
      body.models,
      body.systemPrompt
    );

    // Write attempt file
    await writeAttempt(attempt);

    // Check if we should bypass hooks for development
    const bypassHook = process.env.KIRO_BYPASS_HOOK === 'true';
    
    if (bypassHook) {
      // Process immediately (mirrors hook behavior)
      try {
        await processAttemptDirect(attempt.id);
        console.log(`[Bypass] Processed attempt ${attempt.id} inline`);
      } catch (processError) {
        console.error(`[Bypass] Failed to process attempt ${attempt.id}:`, processError);
        // Don't fail the request - the error will be written to the error file
      }
    }

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        labId: attempt.labId,
        createdAt: attempt.createdAt
      },
      bypassMode: bypassHook,
      message: bypassHook 
        ? 'Attempt created and processed immediately (bypass mode)'
        : 'Attempt created, processing via hook'
    });

  } catch (error) {
    console.error('Error creating attempt:', error);
    return NextResponse.json(
      { error: 'Failed to create attempt' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attempts
 * Returns information about the attempts endpoint and current configuration
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/attempts',
    methods: ['POST'],
    description: 'Create new attempts and optionally process them immediately',
    bypassMode: process.env.KIRO_BYPASS_HOOK === 'true',
    limits: {
      maxPromptLength: 2000,
      maxModelsPerRequest: 3
    }
  });
}