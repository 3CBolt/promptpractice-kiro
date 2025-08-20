import { NextRequest, NextResponse } from 'next/server';
import { readEvaluation, readAttempt } from '@/lib/storage';
import { existsSync } from 'fs';
import { join } from 'path';
import { validateFilePath } from '@/lib/validation';

export interface EvaluationStatusResponse {
  status: 'processing' | 'completed' | 'failed';
  evaluation?: any;
  error?: {
    message: string;
    code?: string;
    timestamp?: string;
  };
  timestamp: string;
}

/**
 * GET /api/evaluations/[attemptId]
 * Returns the evaluation status and results for a specific attempt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params;
    
    if (!attemptId || typeof attemptId !== 'string') {
      return NextResponse.json(
        { error: 'attemptId is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate attemptId format and prevent path traversal
    if (!attemptId.match(/^[a-zA-Z0-9\-_]+$/)) {
      return NextResponse.json(
        { error: 'Invalid attemptId format' },
        { status: 400 }
      );
    }
    
    // Additional path traversal validation
    const evaluationFilePath = `data/evaluations/${attemptId}.json`;
    const errorFilePath = `data/evaluations/${attemptId}.error.json`;
    const attemptFilePath = `data/attempts/${attemptId}.json`;
    
    if (!validateFilePath(evaluationFilePath) || 
        !validateFilePath(errorFilePath) || 
        !validateFilePath(attemptFilePath)) {
      return NextResponse.json(
        { error: 'Invalid file path detected' },
        { status: 400 }
      );
    }

    const dataDir = join(process.cwd(), 'data');
    const evaluationPath = join(dataDir, 'evaluations', `${attemptId}.json`);
    const errorPath = join(dataDir, 'evaluations', `${attemptId}.error.json`);
    const attemptPath = join(dataDir, 'attempts', `${attemptId}.json`);

    // Check if evaluation completed successfully
    if (existsSync(evaluationPath)) {
      try {
        const evaluation = await readEvaluation(attemptId);
        const response: EvaluationStatusResponse = {
          status: 'completed',
          evaluation,
          timestamp: new Date().toISOString()
        };
        return NextResponse.json(response);
      } catch (error) {
        console.error(`Error reading evaluation ${attemptId}:`, error);
        return NextResponse.json(
          { error: 'Failed to read evaluation results' },
          { status: 500 }
        );
      }
    }

    // Check if evaluation failed
    if (existsSync(errorPath)) {
      try {
        const errorData = JSON.parse(require('fs').readFileSync(errorPath, 'utf8'));
        const response: EvaluationStatusResponse = {
          status: 'failed',
          error: {
            message: errorData.error || 'Evaluation failed',
            code: errorData.code || 'EVALUATION_FAILED',
            timestamp: errorData.timestamp
          },
          timestamp: new Date().toISOString()
        };
        return NextResponse.json(response);
      } catch (error) {
        console.error(`Error reading error file ${attemptId}:`, error);
        const response: EvaluationStatusResponse = {
          status: 'failed',
          error: {
            message: 'Evaluation failed with unknown error',
            code: 'UNKNOWN_ERROR'
          },
          timestamp: new Date().toISOString()
        };
        return NextResponse.json(response);
      }
    }

    // Check if attempt exists (to distinguish between processing and not found)
    if (!existsSync(attemptPath)) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Attempt exists but no evaluation yet - still processing
    const response: EvaluationStatusResponse = {
      status: 'processing',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/evaluations/[attemptId]:', error);
    return NextResponse.json(
      { error: 'Failed to check evaluation status' },
      { status: 500 }
    );
  }
}