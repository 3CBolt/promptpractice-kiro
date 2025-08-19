/**
 * Model provider system exports
 * Main entry point for model-related functionality
 */

export {
  MODEL_REGISTRY,
  callModel,
  getModelById,
  getAvailableModels,
  areHostedModelsAvailable,
  getRateLimitStatus,
  getSourceBadge
} from './providers';

export {
  callLocalModel,
  getLocalModelResult
} from './localModel';

// Re-export types for convenience
export type { ModelProvider, ModelResult } from '@/types';