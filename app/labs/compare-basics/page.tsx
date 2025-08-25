'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ModelProvider, AttemptStatus } from '@/types';
import { MODEL_REGISTRY, getRateLimitStatus } from '@/lib/models/providers';
import { useEvaluationStatus } from '@/lib/hooks/useEvaluationStatus';
import { ErrorBanner, StatusIndicator, OfflineModeIndicator } from '@/components';
import LabStepHeader, { LabStep } from '@/components/LabStepHeader';
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
import { tokens, getFocusBoxShadow } from '@/styles/tokens';
import { 
  getStarterPrompts, 
  getConceptDisplayName, 
  StarterPrompt 
} from '@/lib/starterPrompts';
import { getModelStatus } from '@/lib/models/providers';

export default function CompareBasicsLab() {
  const searchParams = useSearchParams();
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

  // Guide context from URL parameters
  const fromGuide = searchParams?.get('from') === 'guide';
  const guideSlug = searchParams?.get('guide');
  const guideConcept = searchParams?.get('concept');
  const guideTitle = searchParams?.get('title');
  const ctaType = searchParams?.get('cta'); // 'inline', 'tryit', or null
  const [showStarterPrompts, setShowStarterPrompts] = useState(fromGuide); // Auto-show if from guide
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

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

  // Handle prefill parameter for revisiting attempts
  useEffect(() => {
    const prefillPrompt = searchParams?.get('prefill');
    if (prefillPrompt) {
      setUserPrompt(decodeURIComponent(prefillPrompt));
    }
  }, [searchParams]);

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

  const handleStartOver = () => {
    // Reset all state to start fresh
    setUserPrompt('');
    setCurrentAttemptId(null);
    setSubmitError(null);
    setValidationErrors([]);
    evaluationStatus.reset();
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

  // Determine current lab step and status
  const getCurrentStep = (): LabStep => {
    if (evaluationStatus.status === 'completed' || currentAttemptId) {
      return 'feedback';
    } else if (isSubmitting || evaluationStatus.status === 'processing') {
      return 'submit';
    } else {
      return 'draft';
    }
  };

  const getCurrentStatus = () => {
    if (isSubmitting || evaluationStatus.status === 'processing') {
      return 'processing';
    } else if (evaluationStatus.status === 'completed') {
      return 'completed';
    } else if (evaluationStatus.status === 'failed' || submitError) {
      return 'error';
    } else if (evaluationStatus.status === 'timeout') {
      return 'timeout';
    } else {
      return 'idle';
    }
  };

  return (
    <div 
      className="max-w-6xl mx-auto safe-area-padding"
      style={{
        padding: `${tokens.mobile.padding.sm} ${tokens.mobile.padding.xs}`,
      }}
    >
      {/* Lab Step Header */}
      <LabStepHeader
        currentStep={getCurrentStep()}
        status={getCurrentStatus()}
        labTitle="Compare Lab"
        onStartOver={handleStartOver}
        disabled={isSubmitting || evaluationStatus.isPolling}
      />

      {/* Guide Context Banner */}
      {fromGuide && guideSlug && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">📚</span>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  From Guide: {guideTitle || getConceptDisplayName(guideConcept || 'general')}
                </p>
                <p className="text-sm text-blue-700">
                  Compare how different models handle the concepts you learned
                </p>
                {ctaType === 'tryit' && (
                  <p className="text-xs text-blue-600 mt-1">
                    💡 The starter prompts below include examples from the guide
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/guides/${guideSlug}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              ← Back to Guide
            </Link>
          </div>
        </div>
      )}

      {/* Starter Prompts Section */}
      <div className={`border rounded-lg p-6 mb-6 ${
        fromGuide 
          ? 'bg-green-50 border-green-200' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {fromGuide ? '🎯 Recommended Starter Prompts' : 'Starter Prompts'}
            </h3>
            {fromGuide && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                From your guide
              </span>
            )}
          </div>
          <button
            onClick={() => setShowStarterPrompts(!showStarterPrompts)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showStarterPrompts ? 'Hide' : 'Show'} Examples
          </button>
        </div>
        
        {fromGuide && !showStarterPrompts && (
          <p className="text-sm text-green-700 mb-2">
            We've selected prompts that match the concepts from your guide. Click "Show Examples" to see them.
          </p>
        )}
        
        {showStarterPrompts && (
          <div className="space-y-4">
            {/* Level Selector */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Skill Level:</span>
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedLevel === level
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>

            {/* Starter Prompts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const allPrompts = getStarterPrompts(guideConcept || 'general', selectedLevel);
                const conceptPrompts = allPrompts.filter(p => p.concept === (guideConcept || 'general'));
                const otherPrompts = allPrompts.filter(p => p.concept !== (guideConcept || 'general'));
                
                // Prioritize concept-specific prompts when coming from guide
                const displayPrompts = fromGuide && conceptPrompts.length > 0 
                  ? [...conceptPrompts, ...otherPrompts].slice(0, 6)
                  : allPrompts.slice(0, 4);
                
                return displayPrompts.map((starter) => {
                  const isFromGuideConcept = fromGuide && starter.concept === (guideConcept || 'general');
                  
                  return (
                    <div
                      key={starter.id}
                      className={`border rounded-md p-4 hover:border-gray-300 transition-colors cursor-pointer ${
                        isFromGuideConcept 
                          ? 'bg-green-50 border-green-200 hover:border-green-300' 
                          : 'bg-white border-gray-200'
                      }`}
                      onClick={() => setUserPrompt(starter.prompt)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{starter.title}</h4>
                        {isFromGuideConcept && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                            Guide
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{starter.description}</p>
                      <p className="text-sm text-gray-800 line-clamp-3">{starter.prompt}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-blue-600 font-medium">
                          {getConceptDisplayName(starter.concept)}
                        </span>
                        <span className="text-xs text-gray-500">Click to use</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            
            {getStarterPrompts(guideConcept || 'general', selectedLevel).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No starter prompts available for this level. Try a different skill level.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Lab Interface */}
      <div className="space-y-6">
        {/* Model Selection */}
        <div>
          <label 
            className="block text-sm font-medium text-gray-700 mb-3"
            style={{
              display: 'block',
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.text.primary,
              marginBottom: tokens.spacing[3],
            }}
          >
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
                  style={{
                    padding: tokens.spacing[4],
                    border: `1px solid ${
                      isSelected ? tokens.colors.primary[500] :
                      canSelect ? tokens.colors.border.light :
                      tokens.colors.border.light
                    }`,
                    borderRadius: tokens.borderRadius.lg,
                    textAlign: 'left' as const,
                    transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
                    backgroundColor: isSelected ? tokens.colors.primary[50] :
                                   canSelect ? tokens.colors.background.primary :
                                   tokens.colors.background.secondary,
                    color: isSelected ? tokens.colors.primary[900] :
                           canSelect ? tokens.colors.text.primary :
                           tokens.colors.text.muted,
                    cursor: (!canSelect || isSubmitting || evaluationStatus.status === 'processing') ? 'not-allowed' : 'pointer',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (canSelect && !isSubmitting && evaluationStatus.status !== 'processing') {
                      e.currentTarget.style.borderColor = tokens.colors.border.dark;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = canSelect ? tokens.colors.border.light : tokens.colors.border.light;
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                    e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{model.name}</h3>
                    {isSelected && (
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">{getSourceBadge(model.source)}</div>
                    <div className="text-gray-500">Max tokens: {model.maxTokens}</div>
                    {(() => {
                      const modelStatus = getModelStatus(model.id);
                      return (
                        <div className={`text-xs ${
                          modelStatus.source === 'hosted' ? 'text-green-600' :
                          modelStatus.source === 'local' ? 'text-blue-600' :
                          'text-orange-600'
                        }`}>
                          {modelStatus.source === 'hosted' && '✨ Real AI'}
                          {modelStatus.source === 'local' && '💻 Browser AI'}
                          {modelStatus.source === 'sample' && '📦 Demo mode'}
                        </div>
                      );
                    })()}
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
              fontSize: '16px', // Prevents zoom on iOS
              lineHeight: tokens.typography.lineHeight.normal,
              color: tokens.colors.text.secondary,
              backgroundColor: tokens.colors.background.primary,
              border: `1px solid ${tokens.colors.border.medium}`,
              borderRadius: tokens.borderRadius.md,
              transition: `border-color ${tokens.animation.duration.fast} ${tokens.animation.easing.inOut}, box-shadow ${tokens.animation.duration.fast} ${tokens.animation.easing.inOut}`,
              outline: 'none',
              resize: 'vertical' as const,
              fontFamily: tokens.typography.fontFamily.sans.join(', '),
              minHeight: tokens.touchTarget.comfortable,
              touchAction: 'manipulation',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
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
            status={AttemptStatus.TIMEOUT}
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Comparison Results</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Compare how different models respond to your prompt
                  </p>
                  {fromGuide && (
                    <p className="text-sm text-gray-600 mt-1">
                      Notice how different models handle the concepts from your guide differently!
                    </p>
                  )}
                </div>
                {fromGuide && guideSlug && (
                  <Link
                    href={`/guides/${guideSlug}`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    📚 Back to Guide
                  </Link>
                )}
              </div>
            </div>
            
            {/* Side-by-side results grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {(evaluationStatus.evaluation.results || []).map((result, index) => {
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
                          {getSourceBadge(result.source)} • {result.latency}ms
                          {result.tokenCount && ` • ${result.tokenCount} tokens`}
                        </p>
                      </div>
                      
                      {/* Score Badge */}
                      {result.scores?.total !== undefined && (
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            result.scores.total >= 8 ? 'bg-green-100 text-green-800' :
                            result.scores.total >= 6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.scores.total}/10
                          </div>
                          {result.scores.clarity !== undefined && result.scores.completeness !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">
                              C: {result.scores.clarity}/5 • Co: {result.scores.completeness}/5
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Model Response */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Response:</h4>
                      <div className="bg-white rounded-md p-3 text-sm text-gray-900 whitespace-pre-wrap border min-h-[120px]">
                        {result.response}
                      </div>
                    </div>

                    {/* Improvement Notes */}
                    {result.feedback?.explanation && (
                      <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">Suggestions:</h4>
                        <p className="text-sm text-blue-700">{result.feedback.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Comparison Metrics Summary */}
            {(evaluationStatus.evaluation.results || []).length > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Comparison Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Best Score:</span>
                    <div className="font-medium">
                      {Math.max(...(evaluationStatus.evaluation.results || []).map(r => r.scores?.total || 0))}/10
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg Latency:</span>
                    <div className="font-medium">
                      {Math.round((evaluationStatus.evaluation.results || []).reduce((sum, r) => sum + r.latency, 0) / (evaluationStatus.evaluation.results || []).length)}ms
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Models Tested:</span>
                    <div className="font-medium">{(evaluationStatus.evaluation.results || []).length}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Sources:</span>
                    <div className="font-medium">
                      {Array.from(new Set((evaluationStatus.evaluation.results || []).map(r => r.source))).map(source => 
                        getSourceBadge(source).split(' ')[0]
                      ).join(' ')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Home
          </Link>
          
          {fromGuide && guideSlug && (
            <Link
              href={`/guides/${guideSlug}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Back to Guide →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}