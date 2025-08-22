/**
 * Schema validation utilities for v1.0 contracts
 */

import { Attempt, Evaluation } from '../types';
import { AttemptStatus, ErrorContract } from '../types/contracts';

/**
 * Validates that an attempt object matches the v1.0 schema
 */
export function validateAttempt(attempt: any): attempt is Attempt {
  return (
    typeof attempt === 'object' &&
    typeof attempt.attemptId === 'string' &&
    attempt.attemptId.match(/^[a-z0-9]{8}-[a-z0-9]{6}$/) &&
    typeof attempt.userId === 'string' &&
    typeof attempt.labId === 'string' &&
    ['practice-basics', 'compare-basics', 'system-prompt-lab'].includes(attempt.labId) &&
    typeof attempt.userPrompt === 'string' &&
    attempt.userPrompt.length <= 2000 &&
    Array.isArray(attempt.models) &&
    attempt.models.length >= 1 &&
    attempt.models.length <= 3 &&
    typeof attempt.timestamp === 'string' &&
    attempt.schemaVersion === '1.0'
  );
}

/**
 * Validates that an evaluation object matches the v1.0 schema
 */
export function validateEvaluation(evaluation: any): evaluation is Evaluation {
  return (
    typeof evaluation === 'object' &&
    typeof evaluation.attemptId === 'string' &&
    Object.values(AttemptStatus).includes(evaluation.status) &&
    typeof evaluation.timestamp === 'string' &&
    evaluation.schemaVersion === '1.0'
  );
}

/**
 * Validates that an error object matches the ErrorContract
 */
export function validateErrorContract(error: any): error is ErrorContract {
  return (
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