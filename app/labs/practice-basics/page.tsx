'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ModelProvider, AttemptStatus, ModelSource, ModelResult } from '@/types';
import { MODEL_REGISTRY, getRateLimitStatus } from '@/lib/models/providers';
import { useEvaluationStatus } from '@/lib/hooks/useEvaluationStatus';
import { ErrorBanner, StatusIndicator, OfflineModeIndicator, ModelPicker } from '@/components';
import OnboardingModal from '@/components/OnboardingModal';
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
import { 
  getWebGPUManager, 
  detectWebGPUSupport, 
  getOnboardingComplete,
  LoadingProgress,
  WEBGPU_MODELS 
} from '@/lib/models/webgpuModel';
import { tokens, getFocusBoxShadow } from '@/styles/tokens';
import { 
  getStarterPrompts, 
  getConceptDisplayName, 
  StarterPrompt 
} from '@/lib/starterPrompts';
import { getModelStatus } from '@/lib/models/providers';

export default function PracticeBasicsLab() {
  const searchParams = useSearchParams();
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

  // Guide context from URL parameters
  const fromGuide = searchParams?.get('from') === 'guide';
  const guideSlug = searchParams?.get('guide');
  const guideConcept = searchParams?.get('concept');
  const guideTitle = searchParams?.get('title');
  const ctaType = searchParams?.get('cta'); // 'inline', 'tryit', or null
  const [showStarterPrompts, setShowStarterPrompts] = useState(fromGuide); // Auto-show if from guide
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

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
        source: ModelSource.LOCAL,
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

  // Handle prefill parameter for revisiting attempts
  useEffect(() => {
    const prefillPrompt = searchParams?.get('prefill');
    if (prefillPrompt) {
      setUserPrompt(decodeURIComponent(prefillPrompt));
    }
  }, [searchParams]);

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

  const getSourceBadge = (source: string) => {
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

  // Determine current lab step and status
  const getCurrentStep = (): LabStep => {
    if (evaluationStatus.status === 'completed' || evaluationStatus.status === AttemptStatus.SUCCESS || evaluationStatus.status === AttemptStatus.PARTIAL) {
      return 'feedback';
    } else if (isSubmitting || evaluationStatus.status === 'processing' || evaluationStatus.status === AttemptStatus.QUEUED || evaluationStatus.status === AttemptStatus.RUNNING) {
      return 'submit';
    } else {
      return 'draft';
    }
  };

  const getCurrentStatus = (): 'idle' | 'processing' | 'completed' | 'error' | 'timeout' => {
    if (isSubmitting) {
      return 'processing';
    } else if (evaluationStatus.status === AttemptStatus.QUEUED || evaluationStatus.status === AttemptStatus.RUNNING || evaluationStatus.status === 'processing') {
      return 'processing';
    } else if (evaluationStatus.status === AttemptStatus.SUCCESS || evaluationStatus.status === 'completed') {
      return 'completed';
    } else if (evaluationStatus.status === AttemptStatus.PARTIAL) {
      return 'processing';
    } else if (evaluationStatus.status === AttemptStatus.ERROR || evaluationStatus.status === 'failed' || submitError) {
      return 'error';
    } else if (evaluationStatus.status === AttemptStatus.TIMEOUT) {
      return 'timeout';
    } else {
      return 'idle';
    }
  };

  return (
    <>
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
        onStartLab={handleStartLab}
        loadingProgress={loadingProgress || undefined}
      />

      <div 
        className="max-w-4xl mx-auto safe-area-padding"
        style={{
          padding: `${tokens.mobile.padding.sm} ${tokens.mobile.padding.xs}`,
        }}
      >
        {/* Lab Step Header */}
        <LabStepHeader
          currentStep={getCurrentStep()}
          status={getCurrentStatus()}
          labTitle="Practice Lab"
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
                    Practice the concepts you just learned with real model responses
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
              {selectedModelInfo && (() => {
                const modelStatus = getModelStatus(selectedModelInfo.id);
                return (
                  <div id="model-info" className="mt-1 text-sm">
                    <p className="text-gray-500">
                      Max tokens: {selectedModelInfo.maxTokens} • Source: {getSourceBadge(selectedModelInfo.source)}
                    </p>
                    <p className={`text-xs ${
                      modelStatus.source === 'hosted' ? 'text-green-600' :
                      modelStatus.source === 'local' ? 'text-blue-600' :
                      'text-orange-600'
                    }`}>
                      {modelStatus.source === 'hosted' && '✨ Real AI responses via API'}
                      {modelStatus.source === 'local' && '💻 Real AI responses in browser'}
                      {modelStatus.source === 'sample' && '📦 Sample responses for demo'}
                    </p>
                  </div>
                );
              })()}
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
              {isSubmitting ? 'Creating Attempt...' : 
               evaluationStatus.status === AttemptStatus.QUEUED ? 'Queued...' :
               evaluationStatus.status === AttemptStatus.RUNNING || evaluationStatus.isPolling ? 'Evaluating...' : 
               'Run'}
            </span>
          </button>
          <p id="run-button-help" className="sr-only">
            Click to run your prompt against the selected model and receive evaluation feedback
          </p>
        </div>

        {/* Evaluation Status - All Six States */}
        {evaluationStatus.status === AttemptStatus.QUEUED && (
          <StatusIndicator
            status={AttemptStatus.QUEUED}
            title="Request Queued"
            message="Your prompt has been queued for processing. It will begin shortly."
            showSpinner={false}
          />
        )}

        {(evaluationStatus.status === AttemptStatus.RUNNING || evaluationStatus.status === 'processing') && (
          <StatusIndicator
            status={AttemptStatus.RUNNING}
            title="Evaluating your prompt..."
            message="The model is processing your prompt and generating a response. This may take a few moments."
            showSpinner={true}
          />
        )}

        {evaluationStatus.status === AttemptStatus.PARTIAL && (
          <StatusIndicator
            status={AttemptStatus.PARTIAL}
            title="Partial Results Available"
            message="Some results are ready while others are still processing. You can review what's available below."
            partialResults={evaluationStatus.partialResults}
            onRetry={handleRetry}
          />
        )}

        {evaluationStatus.status === AttemptStatus.TIMEOUT && (
          <StatusIndicator
            status={AttemptStatus.TIMEOUT}
            title="Evaluation Timeout"
            message="The evaluation is taking longer than expected. It may still complete in the background, or you can retry with a new attempt."
            onRetry={handleRetry}
          />
        )}

        {/* Evaluation Error */}
        {(evaluationStatus.status === AttemptStatus.ERROR || evaluationStatus.status === 'failed') && (
          <div className="space-y-4">
            <StatusIndicator
              status={AttemptStatus.ERROR}
              title="Evaluation Failed"
              message={evaluationStatus.error?.message || 'An error occurred while processing your prompt.'}
              onRetry={evaluationStatus.canRetry ? handleRetry : undefined}
            />
            <ErrorBanner
              type="error"
              title="Error Details"
              message={evaluationStatus.error?.message || 'An error occurred while processing your prompt.'}
              onRetry={evaluationStatus.canRetry ? handleRetry : undefined}
              retryLabel="Retry Evaluation"
              errorCode={evaluationStatus.error?.code}
              timestamp={evaluationStatus.error?.timestamp}
              showDetails={true}
              details={`Attempt ID: ${currentAttemptId}\nModel: ${selectedModel}\nRetry count: ${evaluationStatus.retryCount}`}
            />
          </div>
        )}

        {/* Results Display */}
        {(((evaluationStatus.status === 'completed' || evaluationStatus.status === AttemptStatus.SUCCESS) && evaluationStatus.evaluation) || 
         (evaluationStatus.status === AttemptStatus.PARTIAL && (evaluationStatus.evaluation || evaluationStatus.partialResults))) && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Results</h2>
                <div className="flex items-center space-x-3">
                  {evaluationStatus.status === AttemptStatus.PARTIAL && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Partial Results
                    </span>
                  )}
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
              {fromGuide && (
                <p className="text-sm text-gray-600 mt-2">
                  Great job practicing! Return to the guide to continue learning or try more examples.
                </p>
              )}
            </div>
            
            {(evaluationStatus.evaluation?.results || evaluationStatus.partialResults || []).map((result: ModelResult, index: number) => (
              <div key={index} className="px-6 py-4">
                {/* Model Info */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-md font-medium text-gray-900">
                      {availableModels.find(m => m.id === result.modelId)?.name || result.modelId}
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
                        Score: {result.scores.total}/10
                      </div>
                      {result.scores && (
                        <p className="text-xs text-gray-500 mt-1">
                          Clarity: {result.scores.clarity}/5 • Completeness: {result.scores.completeness}/5
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Model Response */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Response:</h4>
                  <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-900 whitespace-pre-wrap">
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
            ))}
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
    </>
  );
}
