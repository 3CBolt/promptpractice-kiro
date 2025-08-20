'use client';

import { useState, useEffect } from 'react';
import { ModelProvider } from '@/types';
import { MODEL_REGISTRY, getRateLimitStatus } from '@/lib/models/providers';
import { useEvaluationStatus } from '@/lib/hooks/useEvaluationStatus';
import { ErrorBanner, StatusIndicator, OfflineModeIndicator } from '@/components';
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

export default function CompareBasicsLab() {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [offlineMode, setOfflineMode] = useState<{
    isActive: boolean;
    reason?: 'no-api-key' | 'rate-limited' | 'network-error' | 'api-error';
    resetTime?: number;
  }>({ isActive: false });

  // Use the evaluation status hook
  const evaluationStatus = useEvaluationStatus(currentAttemptId, {
    pollInterval: 2000,
    maxRetries: 3,
    timeoutMs: 90000 // Longer timeout for multiple models
  });

  // Get available models (prefer hosted, fallback to sample)
  const availableModels = MODEL_REGISTRY.filter(model => 
    model.source === 'hosted' || model.source === 'sample'
  );

  // Set default models if none selected and check offline mode
  useEffect(() => {
    if (selectedModels.length === 0 && availableModels.length >= 2) {
      // Prefer hosted models, fallback to sample
      const hostedModels = availableModels.filter(m => m.source === 'hosted');
      const sampleModels = availableModels.filter(m => m.source === 'sample');
      
      if (hostedModels.length >= 2) {
        setSelectedModels([hostedModels[0].id, hostedModels[1].id]);
      } else if (hostedModels.length === 1) {
        setSelectedModels([hostedModels[0].id, sampleModels[0].id]);
      } else {
        setSelectedModels([sampleModels[0].id, sampleModels[1].id]);
      }
    }

    // Check rate limit status for offline mode indicator
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
  }, [selectedModels, availableModels]);

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

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        // Remove model if already selected
        return prev.filter(id => id !== modelId);
      } else {
        // Add model if not selected and under limit (max 3)
        if (prev.length < 3) {
          return [...prev, modelId];
        }
        return prev;
      }
    });
  };

  // Client-side validation
  const validateInput = (): boolean => {
    const errors: string[] = [];
    
    // Validate prompt length
    const promptValidation = validatePromptLength(userPrompt);
    if (!promptValidation.isValid) {
      errors.push(promptValidation.error!);
    }
    
    // Validate model selection
    const modelValidation = validateModelSelection('compare-basics', selectedModels);
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
            labId: 'compare-basics',
            userPrompt: userPrompt.trim(),
            models: selectedModels
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
        modelId: selectedModels.join(', '),
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compare Lab</h1>
        <p className="text-gray-600">
          Compare your prompts across multiple models side-by-side to understand how different models respond to the same input.
        </p>
      </div>

      {/* Lab Interface */}
      <div className="space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Models (2-3 models)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableModels.map((model) => {
              const isSelected = selectedModels.includes(model.id);
              const canSelect = selectedModels.length < 3 || isSelected;
              
              return (
                <button
                  key={model.id}
                  onClick={() => handleModelToggle(model.id)}
                  disabled={!canSelect || isSubmitting || evaluationStatus.status === 'processing'}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : canSelect
                      ? 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                      : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{model.name}</h3>
                    {isSelected && (
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    <div>{getSourceBadge(model.source)}</div>
                    <div>Max tokens: {model.maxTokens}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Selected: {selectedModels.length}/3 models
            {selectedModels.length < 2 && (
              <span className="text-red-600 ml-2">• Select at least 2 models to compare</span>
            )}
          </p>
        </div>

        {/* User Prompt Input */}
        <div>
          <label htmlFor="user-prompt" className="form-label">
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
          />
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span id="prompt-help">Enter a prompt to test across the selected models</span>
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
            modelId: selectedModels.join(', '),
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
            disabled={!userPrompt.trim() || selectedModels.length < 2 || isSubmitting || evaluationStatus.isPolling}
            className={`btn btn-primary btn-lg ${(isSubmitting || evaluationStatus.isPolling) ? 'btn-loading' : ''}`}
            aria-describedby="run-button-help"
          >
            <span className="btn-text">
              {isSubmitting ? 'Creating Attempt...' : evaluationStatus.isPolling ? 'Evaluating...' : 'Run Comparison'}
            </span>
          </button>
          <p id="run-button-help" className="sr-only">
            Click to run your prompt against the selected models and compare their responses
          </p>
        </div>

        {/* Evaluation Status */}
        {evaluationStatus.status === 'processing' && (
          <StatusIndicator
            status="processing"
            title="Evaluating your prompt across models..."
            message={`Running your prompt against ${selectedModels.length} models and generating evaluations. This may take a few moments.`}
            showSpinner={true}
          />
        )}

        {evaluationStatus.status === 'timeout' && (
          <StatusIndicator
            status="timeout"
            title="Evaluation Timeout"
            message="The evaluation is taking longer than expected. Multiple models may still be processing in the background."
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
            details={`Attempt ID: ${currentAttemptId}\nModels: ${selectedModels.join(', ')}\nRetry count: ${evaluationStatus.retryCount}`}
          />
        )}

        {/* Results Display - Side-by-side comparison */}
        {evaluationStatus.status === 'completed' && evaluationStatus.evaluation && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Comparison Results</h2>
              <p className="text-sm text-gray-500 mt-1">
                Compare how different models respond to your prompt
              </p>
            </div>
            
            {/* Side-by-side results grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {evaluationStatus.evaluation.perModelResults.map((result, index) => {
                const modelInfo = availableModels.find(m => m.id === result.modelId);
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {/* Model Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-md font-medium text-gray-900">
                          {modelInfo?.name || result.modelId}
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
                            {result.score}/10
                          </div>
                          {result.breakdown && (
                            <p className="text-xs text-gray-500 mt-1">
                              C: {result.breakdown.clarity}/5 • Co: {result.breakdown.completeness}/5
                            </p>
                          )}
                        </div>
                      )}
                    </div>