/**
 * Development utilities for testing hook functionality and file artifact validation
 * These utilities help validate that bypass mode produces identical results to hook mode
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { Attempt, Evaluation } from '@/types';
import { readAttempt, readEvaluation, hasEvaluation, hasEvaluationError } from './storage';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details?: any;
}

export interface FileArtifacts {
  attempt?: Attempt;
  evaluation?: Evaluation;
  error?: any;
  hasAttemptFile: boolean;
  hasEvaluationFile: boolean;
  hasErrorFile: boolean;
}

/**
 * Validates that an attempt file has the correct structure and required fields
 */
export async function validateAttemptFile(attemptId: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    const attempt = await readAttempt(attemptId);
    
    if (!attempt) {
      result.isValid = false;
      result.errors.push('Attempt file not found');
      return result;
    }

    // Validate required fields
    const requiredFields = ['attemptId', 'labId', 'userPrompt', 'models', 'timestamp'];
    for (const field of requiredFields) {
      if (!attempt[field as keyof Attempt]) {
        result.isValid = false;
        result.errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate field types
    if (typeof attempt.attemptId !== 'string') {
      result.isValid = false;
      result.errors.push('attemptId must be a string');
    }

    if (typeof attempt.labId !== 'string') {
      result.isValid = false;
      result.errors.push('labId must be a string');
    }

    if (typeof attempt.userPrompt !== 'string') {
      result.isValid = false;
      result.errors.push('userPrompt must be a string');
    }

    if (!Array.isArray(attempt.models)) {
      result.isValid = false;
      result.errors.push('models must be an array');
    } else if (attempt.models.length === 0) {
      result.isValid = false;
      result.errors.push('models array cannot be empty');
    }

    if (attempt.systemPrompt !== undefined && typeof attempt.systemPrompt !== 'string') {
      result.isValid = false;
      result.errors.push('systemPrompt must be a string if provided');
    }

    // Validate timestamp is a valid ISO string
    try {
      new Date(attempt.timestamp);
    } catch {
      result.isValid = false;
      result.errors.push('timestamp must be a valid ISO date string');
    }

    // Validate prompt lengths
    if (attempt.userPrompt.length > 2000) {
      result.warnings.push('userPrompt exceeds recommended length of 2000 characters');
    }

    if (attempt.systemPrompt && attempt.systemPrompt.length > 2000) {
      result.warnings.push('systemPrompt exceeds recommended length of 2000 characters');
    }

    // Validate model count
    if (attempt.models.length > 3) {
      result.warnings.push('models array exceeds recommended limit of 3 models');
    }

    result.details = attempt;

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Failed to read attempt file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Validates that an evaluation file has the correct structure and required fields
 */
export async function validateEvaluationFile(attemptId: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    const evaluation = await readEvaluation(attemptId);
    
    if (!evaluation) {
      result.isValid = false;
      result.errors.push('Evaluation file not found');
      return result;
    }

    // Validate required fields
    const requiredFields = ['attemptId', 'status', 'timestamp'];
    for (const field of requiredFields) {
      if (!evaluation[field as keyof Evaluation]) {
        result.isValid = false;
        result.errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate field types
    if (typeof evaluation.attemptId !== 'string') {
      result.isValid = false;
      result.errors.push('attemptId must be a string');
    }

    if (typeof evaluation.attemptId !== 'string') {
      result.isValid = false;
      result.errors.push('attemptId must be a string');
    }

    if (evaluation.results && !Array.isArray(evaluation.results)) {
      result.isValid = false;
      result.errors.push('results must be an array');
    } else if (evaluation.results) {
      // Validate each model result
      evaluation.results.forEach((modelResult: any, index: number) => {
        const requiredModelFields = ['modelId', 'response', 'latency', 'source'];
        for (const field of requiredModelFields) {
          if (!modelResult[field as keyof typeof modelResult]) {
            result.isValid = false;
            result.errors.push(`Missing required field in results[${index}]: ${field}`);
          }
        }

        // Validate model result types
        if (typeof modelResult.modelId !== 'string') {
          result.errors.push(`results[${index}].modelId must be a string`);
        }

        if (typeof modelResult.response !== 'string') {
          result.errors.push(`results[${index}].response must be a string`);
        }

        if (typeof modelResult.latency !== 'number') {
          result.errors.push(`results[${index}].latency must be a number`);
        }

        if (!['hosted', 'sample', 'local'].includes(modelResult.source)) {
          result.errors.push(`perModelResults[${index}].source must be 'hosted', 'sample', or 'local'`);
        }

        // Validate optional evaluation fields
        if (modelResult.score !== undefined) {
          if (typeof modelResult.score !== 'number' || modelResult.score < 0 || modelResult.score > 10) {
            result.warnings.push(`perModelResults[${index}].score should be a number between 0 and 10`);
          }
        }

        if (modelResult.breakdown !== undefined) {
          if (!modelResult.breakdown.clarity || !modelResult.breakdown.completeness) {
            result.warnings.push(`perModelResults[${index}].breakdown should have clarity and completeness scores`);
          }
        }
      });
    }

    // Validate timestamp is a valid ISO string
    try {
      new Date(evaluation.timestamp);
    } catch {
      result.isValid = false;
      result.errors.push('timestamp must be a valid ISO date string');
    }

    result.details = evaluation;

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Failed to read evaluation file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Gets all file artifacts for a given attempt ID
 */
export async function getFileArtifacts(attemptId: string): Promise<FileArtifacts> {
  const artifacts: FileArtifacts = {
    hasAttemptFile: false,
    hasEvaluationFile: false,
    hasErrorFile: false
  };

  try {
    // Check for attempt file
    const attempt = await readAttempt(attemptId);
    if (attempt) {
      artifacts.attempt = attempt;
      artifacts.hasAttemptFile = true;
    }

    // Check for evaluation file
    const evaluation = await readEvaluation(attemptId);
    if (evaluation) {
      artifacts.evaluation = evaluation;
      artifacts.hasEvaluationFile = true;
    }

    // Check for error file
    artifacts.hasErrorFile = await hasEvaluationError(attemptId);
    if (artifacts.hasErrorFile) {
      try {
        const dataDir = join(process.cwd(), 'data');
        const errorPath = join(dataDir, 'evaluations', `${attemptId}.error.json`);
        const errorContent = await fs.readFile(errorPath, 'utf8');
        artifacts.error = JSON.parse(errorContent);
      } catch (error) {
        console.warn(`Failed to read error file for ${attemptId}:`, error);
      }
    }

  } catch (error) {
    console.error(`Error getting file artifacts for ${attemptId}:`, error);
  }

  return artifacts;
}

/**
 * Compares file artifacts between two attempts to ensure identical structure
 * Useful for validating that bypass mode produces identical results to hook mode
 */
export async function compareFileArtifacts(attemptId1: string, attemptId2: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    const artifacts1 = await getFileArtifacts(attemptId1);
    const artifacts2 = await getFileArtifacts(attemptId2);

    // Compare file presence
    if (artifacts1.hasAttemptFile !== artifacts2.hasAttemptFile) {
      result.isValid = false;
      result.errors.push('Attempt file presence differs between attempts');
    }

    if (artifacts1.hasEvaluationFile !== artifacts2.hasEvaluationFile) {
      result.isValid = false;
      result.errors.push('Evaluation file presence differs between attempts');
    }

    if (artifacts1.hasErrorFile !== artifacts2.hasErrorFile) {
      result.isValid = false;
      result.errors.push('Error file presence differs between attempts');
    }

    // Compare attempt structure (excluding IDs and timestamps)
    if (artifacts1.attempt && artifacts2.attempt) {
      const attempt1Copy: any = { ...artifacts1.attempt };
      const attempt2Copy: any = { ...artifacts2.attempt };
      
      // Remove fields that should differ
      delete attempt1Copy.attemptId;
      delete attempt2Copy.attemptId;
      delete attempt1Copy.timestamp;
      delete attempt2Copy.timestamp;

      if (JSON.stringify(attempt1Copy) !== JSON.stringify(attempt2Copy)) {
        result.warnings.push('Attempt content differs (excluding IDs and timestamps)');
      }
    }

    // Compare evaluation structure (excluding IDs and timestamps)
    if (artifacts1.evaluation && artifacts2.evaluation) {
      const eval1Copy: any = { ...artifacts1.evaluation };
      const eval2Copy: any = { ...artifacts2.evaluation };
      
      // Remove fields that should differ
      delete eval1Copy.id;
      delete eval2Copy.id;
      delete eval1Copy.attemptId;
      delete eval2Copy.attemptId;
      delete eval1Copy.timestamp;
      delete eval2Copy.timestamp;

      // Compare structure (scores may vary due to model randomness)
      if (eval1Copy.perModelResults.length !== eval2Copy.perModelResults.length) {
        result.warnings.push('Number of model results differs between evaluations');
      }
    }

    result.details = {
      attempt1: artifacts1,
      attempt2: artifacts2
    };

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Failed to compare file artifacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Validates that the bypass mode environment is properly configured
 */
export function validateBypassEnvironment(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check if bypass mode is enabled
  const bypassEnabled = process.env.KIRO_BYPASS_HOOK === 'true';
  if (!bypassEnabled) {
    result.warnings.push('KIRO_BYPASS_HOOK is not set to "true" - bypass mode disabled');
  }

  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    result.warnings.push('Not in development mode - bypass mode should only be used in development');
  }

  // Check data directory permissions
  try {
    const dataDir = join(process.cwd(), 'data');
    // This will throw if directory doesn't exist or isn't accessible
    require('fs').accessSync(dataDir, require('fs').constants.W_OK);
  } catch (error) {
    result.isValid = false;
    result.errors.push('Data directory is not writable - check permissions');
  }

  result.details = {
    bypassEnabled,
    nodeEnv: process.env.NODE_ENV,
    dataDir: join(process.cwd(), 'data')
  };

  return result;
}

/**
 * Runs a comprehensive test of the bypass functionality
 */
export async function testBypassFunctionality(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Step 1: Validate environment
    const envValidation = validateBypassEnvironment();
    if (!envValidation.isValid) {
      result.isValid = false;
      result.errors.push(...envValidation.errors);
    }
    result.warnings.push(...envValidation.warnings);

    // Step 2: Test attempt creation and processing
    const testRequest = {
      labId: 'test-bypass',
      userPrompt: 'Test prompt for bypass functionality',
      models: ['local-stub'],
      systemPrompt: 'You are a helpful assistant.'
    };

    // This would normally be called via HTTP, but we can test the logic directly
    const { createAttempt, writeAttempt } = await import('./storage');
    const testAttempt = createAttempt(
      testRequest.labId,
      testRequest.userPrompt,
      testRequest.models,
      testRequest.systemPrompt
    );

    await writeAttempt(testAttempt);

    // Step 3: Validate the created attempt
    const attemptValidation = await validateAttemptFile(testAttempt.attemptId);
    if (!attemptValidation.isValid) {
      result.isValid = false;
      result.errors.push(...attemptValidation.errors);
    }
    result.warnings.push(...attemptValidation.warnings);

    result.details = {
      testAttemptId: testAttempt.attemptId,
      environmentCheck: envValidation.details,
      attemptValidation: attemptValidation.details
    };

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Bypass functionality test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}