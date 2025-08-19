import { NextRequest, NextResponse } from 'next/server';
import { callModel } from '@/lib/models/providers';
import { evaluateResponse } from '@/lib/evaluator';
import { ModelResult } from '@/types';

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
    // Parse and validate request body
    const body: CompareRequest = await request.json();
    
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
    
    // Validate prompt length (max 2000 characters as per security requirements)
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
    
    // Validate model selection limits
    if (body.models.length > 3) {
      return NextResponse.json(
        { error: 'Maximum of 3 models allowed per request' },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    const fallbacksUsed: string[] = [];
    
    // Process each model in parallel
    const modelPromises = body.models.map(async (modelId) => {
      try {
        // Call the model
        const modelResult = await callModel(modelId, body.userPrompt, body.systemPrompt);
        
        // Track if fallback was used (source changed from hosted to sample)
        if (modelResult.source === 'sample' && modelId.includes('llama') || modelId.includes('mistral')) {
          fallbacksUsed.push(modelId);
        }
        
        // Evaluate the response
        const evaluation = evaluateResponse(body.userPrompt, modelResult);
        
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
    
    // Return standardized error response
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to process comparison request',
        fallback: 'Please try again or use fewer models'
      },
      { status: 500 }
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