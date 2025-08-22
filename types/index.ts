// Core types for the Prompt Practice App v1.0
// These interfaces match the JSON schemas exactly for consistency

import {
  AttemptStatus,
  ErrorContract,
  ModelConfig,
  AttemptContext,
  LabId,
  ModelSource,
  EvaluationScores,
  EvaluationFeedback
} from './contracts';

export interface Guide {
  id: string;
  title: string;
  body: string;
  links?: { title: string; url: string }[];
}

export interface Lab {
  id: string;
  type: 'practice' | 'compare' | 'system';
  title: string;
  instructions: string;
  linkedGuideSlug?: string;
  isPlaceholder?: boolean; // For System Prompt Lab - MVP placeholder only
}

/**
 * v1.0 Attempt interface matching attempt.schema.json
 */
export interface Attempt {
  /** Unique identifier for the attempt */
  attemptId: string;
  /** User identifier, defaults to anonymous for demo */
  userId: string;
  /** Laboratory environment identifier */
  labId: string;
  /** The user's input prompt */
  userPrompt: string;
  /** Optional system prompt for context */
  systemPrompt?: string;
  /** Array of model identifiers to test */
  models: string[];
  /** ISO 8601 timestamp of attempt creation */
  timestamp: string;
  /** Schema version for compatibility tracking */
  schemaVersion: string;
  /** Version of evaluation rubric to use */
  rubricVersion: string;
  /** Model configuration parameters */
  modelConfig?: ModelConfig;
  /** Context about how the attempt was initiated */
  context?: AttemptContext;
}

/**
 * Model result with evaluation data
 */
export interface ModelResult {
  /** Identifier of the model that generated this result */
  modelId: string;
  /** The model's response text */
  response: string;
  /** Response latency in milliseconds */
  latency: number;
  /** Number of tokens in the response */
  tokenCount?: number;
  /** Source of the model response */
  source: ModelSource;
  /** Evaluation scores for this result */
  scores?: EvaluationScores;
  /** Detailed feedback for improvement */
  feedback?: EvaluationFeedback;
}

/**
 * v1.0 Evaluation interface matching evaluation.schema.json
 */
export interface Evaluation {
  /** Reference to the attempt being evaluated */
  attemptId: string;
  /** Current status of the evaluation */
  status: AttemptStatus;
  /** Array of results from different models */
  results?: ModelResult[];
  /** Structured error information when status is 'error' */
  error?: ErrorContract;
  /** Version of rubric used for evaluation */
  rubricVersion: string;
  /** ISO 8601 timestamp of evaluation */
  timestamp: string;
  /** Schema version for compatibility tracking */
  schemaVersion: string;
}

export interface ModelProvider {
  id: string;
  name: string;
  source: ModelSource;
  maxTokens: number;
  isPlaceholder?: boolean;
}

// Re-export contracts for convenience
export * from './contracts';