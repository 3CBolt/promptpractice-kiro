import { NextRequest, NextResponse } from 'next/server';
import { readEvaluation, hasEvaluation, hasEvaluationError } from '@/lib/storage';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * GET /api/evaluations/[attemptId]
 * Returns evaluation status and results for a specific attempt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params;
    
    // Validate attemptId format (security - path traversal guard)
    if (!attemptId || !/^[a-zA-Z0-9-_]+$/.test(attemptId)) {
      return NextResponse.json(
        { error: 'Invalid attemptId format' },
        { status: 400 }
      );
    }

    // Check if evaluation exists
    const hasEval = await hasEvaluation(attemptId);
    const hasError = await hasEvaluationError(attemptId);

    if (hasEval) {
      // Return completed evaluation
      const evaluation = await readEvaluation(attemptId);
      if (!evaluation) {
        return NextResponse.json(
          { error: 'Evaluation file exists but could not be read' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: 'completed',
        evaluation,
        timestamp: evaluation.createdAt
      });
    }

    if (hasError) {
      // Return error information
      try {
        const dataDir = process.env.NODE_ENV === 'test' 
          ? join(process.cwd(), 'data-test') 
          : join(process.cwd(), 'data');
        const errorFilePath = join(dataDir, 'evaluations', `${attemptId}.error.json`);
        const errorContent = await fs.readFile(errorFilePath, 'utf8');
        const errorData = JSON.parse(errorContent);

        return NextResponse.json({
          status: 'failed',
          error: errorData,
          timestamp: errorData.timestamp
        });
      } catch (readError) {
        return NextResponse.json(
          { error: 'Error file exists but could not be read' },
          { status: 500 }
        );
      }
    }

    // Neither evaluation nor error exists - still processing or not started
    return NextResponse.json({
      status: 'processing',
      message: 'Evaluation is being processed or has not started yet'
    });

  } catch (error) {
    console.error(`Error checking evaluation status for ${params.attemptId}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}