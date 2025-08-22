/**
 * Shared contracts and enums for the Prompt Practice App v1.0
 * These types ensure consistency across the application and API layers
 */

/**
 * Status enum for attempt processing
 */
export enum AttemptStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCESS = 'success',
  PARTIAL = 'partial',
  ERROR = 'error',
  TIMEOUT = 'timeout'
}

/**
 * Structured error contract for consistent error handling
 */
export interface ErrorContract {
  /** Stage where the error occurred (e.g., 'validation', 'model-call', 'evaluation') */
  stage: string;
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Helpful guidance for resolving the error */
  help: string;
  /** Whether the operation can be retried */
  retryable: boolean;
  /** ISO 8601 timestamp when the error occurred */
  timestamp: string;
}

/**
 * Idempotency record for preventing duplicate processing
 */
export interface IdempotencyRecord {
  /** Attempt ID being tracked */
  attemptId: string;
  /** Current status of the attempt */
  status: AttemptStatus;
  /** ISO 8601 timestamp of last update */
  timestamp: string;
  /** Optional lock expiry for concurrent protection */
  lockExpiry?: string;
}

/**
 * Model configuration parameters
 */
export interface ModelConfig {
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for response randomness (0-2) */
  temperature?: number;
}

/**
 * Context information about how an attempt was initiated
 */
export interface AttemptContext {
  /** Guide slug that led to this attempt */
  sourceGuide?: string;
  /** Prompt text prefilled from guide CTA */
  prefillPrompt?: string;
}

/**
 * Lab identifiers enum for type safety
 */
export enum LabId {
  PRACTICE_BASICS = 'practice-basics',
  COMPARE_BASICS = 'compare-basics',
  SYSTEM_PROMPT_LAB = 'system-prompt-lab'
}

/**
 * Model source types
 */
export enum ModelSource {
  HOSTED = 'hosted',
  SAMPLE = 'sample',
  LOCAL = 'local'
}

/**
 * Evaluation scores structure
 */
export interface EvaluationScores {
  /** Clarity score (0-5) */
  clarity: number;
  /** Completeness score (0-5) */
  completeness: number;
  /** Total score (clarity + completeness) */
  total: number;
}

/**
 * Detailed feedback for improvement
 */
export interface EvaluationFeedback {
  /** Identifier for the evaluation criterion */
  criterionId: string;
  /** Detailed explanation of the score */
  explanation: string;
  /** Specific example of how to improve */
  exampleFix: string;
  /** Guide slug for additional learning */
  relatedGuide?: string;
}