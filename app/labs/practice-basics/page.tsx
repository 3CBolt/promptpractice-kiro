'use client';

import { useState, useEffect } from 'react';
import { ModelProvider } from '@/types';
import { MODEL_REGISTRY, getRateLimitStatus } from '@/lib/models/providers';
import { useEvaluationStatus } from '@/lib/hooks/useEvaluationStatus';
import { ErrorBanner, StatusIndicator, OfflineModeIndicator, ModelPicker } from '@/components';
import OnboardingModal from '@/components/OnboardingModal';
import { 
  getOfflineReason, 
  retryApiCall,
  DEFAULT_RETRY_CONFIG
} from '@/lib/clientUtils';
import { createErrorMessage, shouldEnterOfflineMode, logError } from '@/lib/errorHandling';
import { 
  validatePromptLength, 
  validateModelSelection, 
  VALIDATION_LIMITS,
  detectPromptInjection 
} from '@/lib/validation';
import { 
  getWebGPUManager, 
  detectWebGPUSupport, 
  getOnboardingComplete,
  LoadingProgress,
  WEBGPU_MODELS 
} from '@/lib/models/webgpuModel';
import { tokens, getFocusBoxShadow } from '@/styles/tokens';

export default function PracticeBasicsLab() {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [offlineMode, setOfflineMode] = useState<{
    isActive: boolean;
    reason?: 'no-api-key' | 'rate-limited' | 'network-error' | 'api-error';
    resetTime?: number;
  }>({ isActive: false });

  // WebGPU and onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [useWebGPU, setUseWebGPU] = useState(true);

  // Use the evaluation status hook
  const evaluationStatus = useEvaluationStatus(currentAttemptId, {
    pollInterval: 2000,
    maxRetries: 3,
    timeoutMs: 60000
  });

  // Get available models based on WebGPU preference
  const availableModels = useWebGPU 
    ? WEBGPU_MODELS.map(model => ({
        id: model.id,
        name: model.name,
        source: 'local' as const,
        maxTokens: 512
      }))
    : MODEL_REGISTRY.filter(model => 
        model.source === 'hosted' || model.source === 'sample'
      );

  // Initialize WebGPU support detection and onboarding
  useEffect(() => {
    const initializeWebGPU = async () => {
      const supported = await detectWebGPUSupport();
      setWebgpuSupported(supported);
      
      // Show onboarding if first time and WebGPU is supported
      if (!getOnboardingComplete() && supported) {
        setShowOnboarding(true);
      }
      
      // If WebGPU not supported, fall back to traditional models
      if (!supported) {
        setUseWebGPU(false);
      }
    };
    
    initializeWebGPU();
  }, []);

  // Set default model if none selected and check offline mode
  useEffect(() => {
    if (!selectedModel && availableModels.length > 0) {
      if (useWebGPU) {
        // Default to first WebGPU model
        setSelectedModel(availableModels[0].id);
      } else {
        // Prefer hosted models, fallback to sample
        const hostedModel = availableModels.find(m => m.source === 'hosted');
        const defaultModel = hostedModel || availableModels[0];
        setSelectedModel(defaultModel.id);
      }
    }

    // Check rate limit status for offline mode indicator (only for non-WebGPU)
    if (!useWebGPU) {
      const rateLimitStatus = getRateLimitStatus();
      if (rateLimitStatus.isLimited) {
        setOfflineMode({
          isActive: true,
          reason: 'rate-limited',
          resetTime: rateLimitStatus.resetTime
        });
      } else if (!process.env.NEXT_PUBLIC_ENABLE_HOSTED_MODELS) {
        setOfflineMode({
          isActive: true,
          reason: 'no-api-key'
        });
      } else {
        setOfflineMode({ isActive: false });
      }
    }
  }, [selectedModel, availableModels, useWebGPU]);

  // Update offline mode based on errors
  useEffect(() => {
    if (submitError) {
      const reason = getOfflineReason(submitError);
      if (reason) {
        setOfflineMode({
          isActive: true,
          reason,
          resetTime: (submitError as any).resetTime
        });
      }
    }
  }, [submitError]);

  // Client-side validation
  const validateInput = (): boolean => {
    const errors: string[] = [];
    
    // Validate prompt length
    const promptValidation = validatePromptLength(userPrompt);
    if (!promptValidation.isValid) {
      errors.push(promptValidation.error!);
    }
    
    // Validate model selection
    const modelValidation = validateModelSelection('practice-basics', selectedModel ? [selectedModel] : []);
    if (!modelValidation.isValid) {
      errors.push(modelValidation.error!);
    }
    
    // Check for potential prompt injection
    const injectionCheck = detectPromptInjection(userPrompt);
    if (injectionCheck.isDetected) {
      errors.push('Your prompt contains patterns that might not work as expected. Consider rephrasing.');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateInput()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setValidationErrors([]);

    try {
      // Create attempt with retry logic
      const data = await retryApiCall<{
        attempt: { id: string; labId: string; createdAt: string };
        bypassMode: boolean;
        message: string;
      }>(
        () => fetch('/api/attempts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            labId: 'practice-basics',
            userPrompt: userPrompt.trim(),
            models: [selectedModel]
          }),
        }),
        DEFAULT_RETRY_CONFIG
      );

      setCurrentAttemptId(data.attempt.id);

    } catch (error) {
      // Enhanced error logging
      logError(error, {
        operation: 'create_attempt',
        attemptId: currentAttemptId || undefined,
        modelId: selectedModel,
        timestamp: new Date().toISOString()
      });

      setSubmitError(error);

      // Update offline mode based on error
      const offlineInfo = shouldEnterOfflineMode(error);
      if (offlineInfo.shouldEnter) {
        setOfflineMode({
          isActive: true,
          reason: offlineInfo.reason,
          resetTime: offlineInfo.resetTime
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    // Generate fresh attempt ID for retry
    setSubmitError(null);
    evaluationStatus.reset();
    setCurrentAttemptId(null);
    
    // Resubmit with fresh attempt
    await handleSubmit();
  };

  const handleDismissError = () => {
    setSubmitError(null);
  };

  // WebGPU model handling
  const handleWebGPUModelSelect = async (modelId: string) => {
    setSelectedModel(modelId);
    
    const manager = getWebGPUManager();
    manager.setProgressCallback(setLoadingProgress);
    
    try {
      await manager.loadModel(modelId);
    } catch (error) {
      console.error('Failed to load WebGPU model:', error);
      // Model will fall back to demo mode automatically
    }
  };

  const handleStartLab = () => {
    setShowOnboarding(false);
    
    // If we have a selected model, start loading it
    if (selectedModel && useWebGPU) {
      handleWebGPUModelSelect(selectedModel);
    }
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  const getSourceBadge = (source: ModelProvider['source']) => {
    switch (source) {
      case 'hosted':
        return '✨ Hosted';
      case 'sample':
        return '📦 Sample';
      case 'local':
        return '💻 Local';
      default:
        return '❓ Unknown';
    }
  };

  const selectedModelInfo = availableModels.find(m => m.id === selectedModel);

  return (
    <>
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
        onStartLab={handleStartLab}
        loadingProgress={loadingProgress || undefined}
      />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Lab</h1>
          <p className="text-gray-600">
            Test your prompts against a single model and receive detailed feedback on clarity and completeness.
          </p>
        </div>

      {/* Lab Interface */}
      <div className="space-y-6">
        {/* Model Selection */}
        <div>
          {useWebGPU ? (
            <ModelPicker
              selectedModels={selectedModel ? [selectedModel] : []}
              onSelectionChange={(models) => setSelectedModel(models[0] || '')}
              maxSelection={1}
              showWebGPUModels={true}
              onWebGPUModelSelect={handleWebGPUModelSelect}
              webgpuSupported={webgpuSupported || false}
              disabled={isSubmitting || evaluationStatus.status === 'processing'}
            />
          ) : (
            <>
              <label 
                htmlFor="model-select" 
                className="form-label"
                style={{
                  display: 'inline-block',
                  marginBottom: tokens.spacing[2],
                  fontWeight: tokens.typography.fontWeight.medium,
                  color: tokens.colors.text.primary,
                  fontSize: tokens.typography.fontSize.sm,
                }}
              >
                Select Model
              </label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="form-control"
                disabled={isSubmitting || evaluationStatus.status === 'processing'}
                aria-describedby="model-info"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: tokens.spacing[3],
                  fontSize: tokens.typography.fontSize.sm,
                  lineHeight: tokens.typography.lineHeight.normal,
                  color: tokens.colors.text.secondary,
                  backgroundColor: tokens.colors.background.primary,
                  border: `1px solid ${tokens.colors.border.medium}`,
                  borderRadius: tokens.borderRadius.md,
                  transition: `border-color ${tokens.animation.duration.fast} ${tokens.animation.easing.inOut}, box-shadow ${tokens.animation.duration.fast} ${tokens.animation.easing.inOut}`,
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = tokens.colors.border.focus;
                  e.currentTarget.style.boxShadow = getFocusBoxShadow('primary');
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = tokens.colors.border.medium;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} {getSourceBadge(model.source)}
                  </option>
                ))}
              </select>
              {selectedModelInfo && (
                <p id="model-info" className="mt-1 text-sm text-gray-500">
                  Max tokens: {selectedModelInfo.maxTokens} • Source: {getSourceBadge(selectedModelInfo.source)}
                </p>
              )}
            </>
          )}
        </div>

        {/* User Prompt Input */}
        <div>
          <label 
            htmlFor="user-prompt" 
            className="form-label"
            style={{
              display: 'inline-block',
              marginBottom: tokens.spacing[2],
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.text.primary,
              fontSize: tokens.typography.fontSize.sm,
            }}
          >
            Your Prompt
          </label>
          <textarea
            id="user-prompt"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Enter your prompt here... (max 2000 characters)"
            rows={6}
            maxLength={2000}
            className="form-control"
            disabled={isSubmitting || evaluationStatus.status === 'processing'}
            aria-describedby="prompt-help prompt-counter"
            style={{
              display: 'block',
              width: '100%',
              padding: tokens.spacing[3],
              fontSize: tokens.typography.fontSize.sm,
              lineHeight: tokens.typography.lineHeight.normal,
              color: tokens.colors.text.secondary,
              backgroundColor: tokens.colors.background.primary,
              border: `1px solid ${tokens.colors.border.medium}`,
              borderRadius: tokens.borderRadius.md,
              transition: `border-color ${tokens.animation.duration.fast} ${tokens.animation.easing.inOut}, box-shadow ${tokens.animation.duration.fast} ${tokens.animation.easing.inOut}`,
              outline: 'none',
              resize: 'vertical' as const,
              fontFamily: tokens.typography.fontFamily.sans.join(', '),
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = tokens.colors.border.focus;
              e.currentTarget.style.boxShadow = getFocusBoxShadow('primary');
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = tokens.colors.border.medium;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span id="prompt-help">Enter a prompt to test against the selected model</span>
            <span 
              id="prompt-counter"
              className={userPrompt.length > VALIDATION_LIMITS.MAX_PROMPT_LENGTH * 0.9 ? 'text-orange-600' : ''}
              aria-live="polite"
            >
              {userPrompt.length}/{VALIDATION_LIMITS.MAX_PROMPT_LENGTH}
            </span>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Please fix the following issues:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Offline Mode Indicator */}
        {offlineMode.isActive && (
          <OfflineModeIndicator
            isOffline={true}
            reason={offlineMode.reason}
            resetTime={offlineMode.resetTime}
          />
        )}

        {/* Submit Error */}
        {submitError && (() => {
          const errorInfo = createErrorMessage(submitError, {
            operation: 'create_attempt',
            attemptId: currentAttemptId || undefined,
            modelId: selectedModel,
            timestamp: new Date().toISOString()
          });
          
          return (
            <ErrorBanner
              type="error"
              title={errorInfo.title}
              message={errorInfo.message}
              dismissible={true}
              onDismiss={handleDismissError}
              onRetry={errorInfo.details.canRetry ? handleRetry : undefined}
              retryLabel="Retry with New Attempt"
              errorCode={errorInfo.details.code}
              details={errorInfo.details.technicalMessage}
              showDetails={true}
            />
          );
        })()}

        {/* Run Button */}
        <div>
          <button
            onClick={handleSubmit}
            disabled={!userPrompt.trim() || !selectedModel || isSubmitting || evaluationStatus.isPolling}
            className={`btn btn-primary btn-lg ${(isSubmitting || evaluationStatus.isPolling) ? 'btn-loading' : ''}`}
            aria-describedby="run-button-help"
          >
            <span className="btn-text">
              {isSubmitting ? 'Creating Attempt...' : evaluationStatus.isPolling ? 'Evaluating...' : 'Run'}
            </span>
          </button>
          <p id="run-button-help" className="sr-only">
            Click to run your prompt against the selected model and receive evaluation feedback
          </p>
        </div>

        {/* Evaluation Status */}
        {evaluationStatus.status === 'processing' && (
          <StatusIndicator
            status="processing"
            title="Evaluating your prompt..."
            message="The model is processing your prompt and generating a response. This may take a few moments."
            showSpinner={true}
          />
        )}

        {evaluationStatus.status === 'timeout' && (
          <StatusIndicator
            status="timeout"
            title="Evaluation Timeout"
            message="The evaluation is taking longer than expected. It may still complete in the background."
          />
        )}

        {/* Evaluation Error */}
        {evaluationStatus.status === 'failed' && (
          <ErrorBanner
            type="error"
            title="Evaluation Failed"
            message={evaluationStatus.error?.message || 'An error occurred while processing your prompt.'}
            onRetry={evaluationStatus.canRetry ? handleRetry : undefined}
            retryLabel="Retry Evaluation"
            errorCode={evaluationStatus.error?.code}
            timestamp={evaluationStatus.error?.timestamp}
            showDetails={true}
            details={`Attempt ID: ${currentAttemptId}\nModel: ${selectedModel}\nRetry count: ${evaluationStatus.retryCount}`}
          />
        )}

        {/* Results Display */}
        {evaluationStatus.status === 'completed' && evaluationStatus.evaluation && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Results</h2>
            </div>
            
            {evaluationStatus.evaluation.perModelResults.map((result, index) => (
              <div key={index} className="px-6 py-4">
                {/* Model Info */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-md font-medium text-gray-900">
                      {availableModels.find(m => m.id === result.modelId)?.name || result.modelId}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getSourceBadge(result.source)} • {result.latencyMs}ms
                      {result.usageTokens && ` • ${result.usageTokens} tokens`}
                    </p>
                  </div>
                  
                  {/* Score Badge */}
                  {result.score !== undefined && (
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        result.score >= 8 ? 'bg-green-100 text-green-800' :
                        result.score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Score: {result.score}/10
                      </div>
                      {result.breakdown && (
                        <p className="text-xs text-gray-500 mt-1">
                          Clarity: {result.breakdown.clarity}/5 • Completeness: {result.breakdown.completeness}/5
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Model Response */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Response:</h4>
                  <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-900 whitespace-pre-wrap">
                    {result.text}
                  </div>
                </div>

                {/* Improvement Notes */}
                {result.notes && (
                  <div className="bg-blue-50 rounded-md p-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Improvement Suggestions:</h4>
                    <p className="text-sm text-blue-700">{result.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <a
          href="/"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Home
        </a>
      </div>
    </div>
    </>
  );
}