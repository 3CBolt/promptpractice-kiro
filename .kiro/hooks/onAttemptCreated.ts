import { promises as fs } from 'fs';
import { join } from 'path';
import { Attempt, Evaluation } from '@/types';
import { readAttempt, writeEvaluation, writeEvaluationError, hasEvaluation, hasEvaluationError } from '@/lib/storage';

// Schema validation with path traversal guards
function validateAttempt(data: any): data is Attempt {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON: not an object');
  }

  // Required fields
  if (!data.id || typeof data.id !== 'string') {
    throw new Error('Invalid schema: id is required and must be a string');
  }
  
  if (!data.labId || typeof data.labId !== 'string') {
    throw new Error('Invalid schema: labId is required and must be a string');
  }
  
  if (!data.userPrompt || typeof data.userPrompt !== 'string') {
    throw new Error('Invalid schema: userPrompt is required and must be a string');
  }
  
  if (!data.models || !Array.isArray(data.models) || data.models.length === 0) {
    throw new Error('Invalid schema: models is required and must be a non-empty array');
  }
  
  if (!data.createdAt || typeof data.createdAt !== 'string') {
    throw new Error('Invalid schema: createdAt is required and must be a string');
  }

  // Path traversal guards - ensure attemptId contains only safe characters
  if (!/^[a-zA-Z0-9-_]+$/.test(data.id)) {
    throw new Error('Security: attemptId contains invalid characters (only alphanumeric, hyphens, and underscores allowed)');
  }

  // Validate prompt lengths (security requirement)
  if (data.userPrompt.length > 2000) {
    throw new Error('Validation: userPrompt exceeds maximum length of 2000 characters');
  }
  
  if (data.systemPrompt && typeof data.systemPrompt === 'string' && data.systemPrompt.length > 2000) {
    throw new Error('Validation: systemPrompt exceeds maximum length of 2000 characters');
  }

  // Validate models array
  if (data.models.length > 3) {
    throw new Error('Validation: maximum of 3 models allowed');
  }
  
  if (!data.models.every((model: any) => typeof model === 'string')) {
    throw new Error('Validation: all models must be strings');
  }

  return true;
}

// Retry logic with exponential backoff
async function callApiWithRetry(
  userPrompt: string,
  models: string[],
  systemPrompt?: string,
  maxRetries: number = 3
): Promise<any> {
  // In test environment, use mock response
  if (process.env.NODE_ENV === 'test') {
    return {
      results: models.map(modelId => ({
        modelId,
        text: `Mock response for: ${userPrompt}`,
        latencyMs: 100,
        source: 'sample',
        score: 8,
        breakdown: { clarity: 4, completeness: 4 },
        notes: 'Mock evaluation for testing'
      })),
      metadata: {
        totalLatencyMs: 100,
        processedAt: new Date().toISOString(),
        fallbacksUsed: []
      }
    };
  }

  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const url = `${baseUrl}/api/compare`;
  const payload = {
    userPrompt,
    models,
    ...(systemPrompt && { systemPrompt })
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Check if we should retry
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`Attempt ${attempt + 1} failed with status ${response.status}, retrying in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // Don't retry on client errors (except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown client error' }));
        throw new Error(`Client error ${response.status}: ${errorData.error || 'Unknown error'}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(`Server error ${response.status}: ${errorData.error || 'Unknown error'}`);
      }

      return await response.json();

    } catch (error) {
      if (attempt < maxRetries - 1) {
        // Only retry on network errors, not on parsing or client errors
        if (error instanceof TypeError || (error instanceof Error && error.message.includes('fetch'))) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Network error on attempt ${attempt + 1}, retrying in ${delay}ms:`, error instanceof Error ? error.message : 'Unknown error');
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Re-throw the error with retry count information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const enhancedError = new Error(`${errorMessage} (after ${attempt + 1} attempts)`);
      (enhancedError as any).retryCount = attempt + 1;
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  }

  throw new Error(`Max retries (${maxRetries}) exceeded`);
}

// Main hook processing function
export async function processAttemptFile(filePath: string): Promise<void> {
  const startTime = Date.now();
  let attemptId: string;
  let attempt: Attempt | null;
  let logData: any = {};

  try {
    // Extract attemptId from filename
    const filename = filePath.split('/').pop() || '';
    attemptId = filename.replace('.json', '');
    
    if (!attemptId) {
      throw new Error('Could not extract attemptId from filename');
    }

    logData.attemptId = attemptId;
    console.log(`[Hook] Processing attempt: ${attemptId}`);

    // 1. Schema Validation & Security
    attempt = await readAttempt(attemptId);
    if (!attempt) {
      throw new Error(`Could not read attempt file: ${attemptId}`);
    }

    validateAttempt(attempt);
    logData.labId = attempt.labId;
    logData.models = attempt.models;

    // 2. Idempotency Check
    if (await hasEvaluation(attemptId)) {
      logData.status = 'skipped';
      logData.reason = 'evaluation already exists';
      console.log(`[Hook] Skipped ${attemptId}: evaluation already exists`);
      return;
    }

    // Check for previous error (optional - could retry or skip)
    if (await hasEvaluationError(attemptId)) {
      console.log(`[Hook] Previous error found for ${attemptId}, proceeding with retry`);
    }

    // 3. API Call with Retry Logic
    console.log(`[Hook] Calling /api/compare for ${attemptId} with models:`, attempt.models);
    const apiResponse = await callApiWithRetry(
      attempt.userPrompt,
      attempt.models,
      attempt.systemPrompt
    );

    logData.totalLatencyMs = apiResponse.metadata?.totalLatencyMs || 0;
    logData.fallbacksUsed = apiResponse.metadata?.fallbacksUsed || [];
    logData.retryCount = 0; // Successful on first try or within retry limit

    // 4. Result Processing - Success
    const evaluation: Evaluation = {
      id: `eval-${attemptId}`,
      attemptId,
      perModelResults: apiResponse.results,
      createdAt: new Date().toISOString()
    };

    await writeEvaluation(evaluation);
    
    logData.status = 'completed';
    logData.modelResults = apiResponse.results.map((result: any) => ({
      modelId: result.modelId,
      latencyMs: result.latencyMs,
      score: result.score,
      source: result.source
    }));

    console.log(`[Hook] Successfully processed ${attemptId}:`, {
      models: logData.models,
      totalLatency: logData.totalLatencyMs,
      fallbacks: logData.fallbacksUsed
    });

  } catch (error: any) {
    // 4. Result Processing - Error
    logData.status = 'failed';
    logData.error = error.message;
    logData.retryCount = error.retryCount || 0;

    console.error(`[Hook] Failed to process ${attemptId}:`, error.message);

    if (attemptId) {
      try {
        await writeEvaluationError(attemptId, {
          attemptId,
          error: error.message,
          code: error.code || 'PROCESSING_ERROR',
          timestamp: new Date().toISOString(),
          retryCount: error.retryCount || 0,
          originalAttempt: attempt || null
        });
      } catch (writeError) {
        console.error(`[Hook] Failed to write error file for ${attemptId}:`, writeError);
        // Don't fail the entire process if error file write fails
      }
    }
  } finally {
    // 5. Comprehensive Logging
    const processingTime = Date.now() - startTime;
    logData.processingTimeMs = processingTime;

    console.log(`[Hook] Completed processing ${attemptId || 'unknown'}:`, {
      status: logData.status,
      processingTime: `${processingTime}ms`,
      ...logData
    });
  }
}

// Development bypass function - can be called directly for testing
export async function processAttemptDirect(attemptId: string): Promise<void> {
  const filePath = `data/attempts/${attemptId}.json`;
  await processAttemptFile(filePath);
}