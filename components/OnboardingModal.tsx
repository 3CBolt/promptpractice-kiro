'use client';

import React, { useState, useEffect } from 'react';
import { LoadingProgress, LoadingState, getOnboardingComplete, setOnboardingComplete } from '@/lib/models/webgpuModel';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLab: () => void;
  loadingProgress?: LoadingProgress;
}

const WORKFLOW_STEPS = [
  {
    number: 1,
    title: 'Draft',
    description: 'Write your prompt in the text area',
    icon: '✏️',
    detail: 'Take your time to craft a clear, specific prompt. You can edit and refine it before submitting.'
  },
  {
    number: 2,
    title: 'Submit',
    description: 'Click submit to run your prompt through the model',
    icon: '🚀',
    detail: 'The model will process your prompt and generate a response. This usually takes a few seconds.'
  },
  {
    number: 3,
    title: 'Feedback',
    description: 'Review the response and get improvement suggestions',
    icon: '📊',
    detail: 'See how your prompt performed with scores for clarity and completeness, plus tips for improvement.'
  }
];

const LOADING_MESSAGES: Record<LoadingState, { icon: string; title: string }> = {
  'idle': { icon: '⏳', title: 'Ready to start' },
  'checking-webgpu': { icon: '🔍', title: 'Checking compatibility' },
  'fetching-weights': { icon: '📥', title: 'Downloading model' },
  'compiling': { icon: '⚙️', title: 'Compiling for your device' },
  'warming-up': { icon: '🔥', title: 'Warming up' },
  'ready': { icon: '✅', title: 'Ready to go!' },
  'error': { icon: '❌', title: 'Setup failed' }
};

export default function OnboardingModal({
  isOpen,
  onClose,
  onStartLab,
  loadingProgress
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWorkflow, setShowWorkflow] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Auto-advance workflow steps for demo
    if (showWorkflow && currentStep < WORKFLOW_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, showWorkflow]);

  const handleClose = () => {
    if (dontShowAgain) {
      setOnboardingComplete();
    }
    onClose();
  };

  const handleStartLab = () => {
    if (dontShowAgain) {
      setOnboardingComplete();
    }
    onStartLab();
  };

  const isLoading = loadingProgress && loadingProgress.state !== 'idle' && loadingProgress.state !== 'ready';
  const isReady = loadingProgress?.state === 'ready';
  const hasError = loadingProgress?.state === 'error';

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="modal-content onboarding-modal">
        <div className="modal-header">
          <h2 id="onboarding-title" className="modal-title">
            Welcome to Prompt Practice Labs
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            aria-label="Close onboarding"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {showWorkflow ? (
            <div className="workflow-section">
              <p className="workflow-intro">
                This Lab runs a small open model in your browser. <strong>No setup needed.</strong>
              </p>

              <div className="workflow-steps">
                <h3 className="workflow-title">How it works:</h3>
                
                {WORKFLOW_STEPS.map((step, index) => (
                  <div
                    key={step.number}
                    className={`workflow-step ${index <= currentStep ? 'active' : ''} ${index === currentStep ? 'current' : ''}`}
                  >
                    <div className="step-number">
                      <span className="step-icon" aria-hidden="true">{step.icon}</span>
                      <span className="step-num">{step.number}</span>
                    </div>
                    <div className="step-content">
                      <h4 className="step-title">{step.title}</h4>
                      <p className="step-description">{step.description}</p>
                      {index === currentStep && (
                        <p className="step-detail">{step.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="workflow-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowWorkflow(false)}
                >
                  Got it! Let's start
                </button>
              </div>
            </div>
          ) : (
            <div className="setup-section">
              {!loadingProgress || loadingProgress.state === 'idle' ? (
                <div className="setup-ready">
                  <div className="setup-icon">🚀</div>
                  <h3>Ready to start your first lab?</h3>
                  <p>
                    We'll load a small language model in your browser for practice. 
                    This happens only once and the model will be cached for future sessions.
                  </p>
                  
                  <div className="setup-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-large"
                      onClick={handleStartLab}
                    >
                      Start Lab
                    </button>
                  </div>
                </div>
              ) : (
                <div className="setup-loading">
                  <div className="loading-header">
                    <div className="loading-icon">
                      {LOADING_MESSAGES[loadingProgress.state].icon}
                    </div>
                    <h3>{LOADING_MESSAGES[loadingProgress.state].title}</h3>
                  </div>

                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${loadingProgress.progress}%` }}
                        role="progressbar"
                        aria-valuenow={loadingProgress.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Model loading progress"
                      />
                    </div>
                    <div className="progress-text">
                      {loadingProgress.message}
                    </div>
                    <div className="progress-percentage">
                      {Math.round(loadingProgress.progress)}%
                    </div>
                  </div>

                  {hasError && (
                    <div className="error-section" role="alert">
                      <p className="error-message">
                        {loadingProgress.error || 'Failed to load the model'}
                      </p>
                      <p className="error-help">
                        Don't worry! You can still use the lab in read-only demo mode.
                      </p>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleStartLab}
                      >
                        Continue in Demo Mode
                      </button>
                    </div>
                  )}

                  {isReady && (
                    <div className="ready-section">
                      <p className="ready-message">
                        ✅ Model loaded successfully! You're ready to start practicing.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleStartLab}
                      >
                        Start Practicing
                      </button>
                    </div>
                  )}

                  {isLoading && (
                    <div className="loading-tips">
                      <h4>💡 While you wait:</h4>
                      <ul>
                        <li>Models are cached after first download</li>
                        <li>Larger models give better responses but load slower</li>
                        <li>You can switch models anytime in the lab</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Don't show this again
          </label>
        </div>
      </div>
    </div>
  );
}