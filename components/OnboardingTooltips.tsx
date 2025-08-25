'use client';

import React, { useState, useEffect, useRef } from 'react';
import { tokens } from '@/styles/tokens';
import { TooltipStep, DEFAULT_TOOLTIP_STEPS, onboardingUtils } from '@/lib/onboarding';

interface OnboardingTooltipsProps {
  steps?: TooltipStep[];
  onComplete?: () => void;
  onDismiss?: () => void;
  className?: string;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrow: {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
  };
}

/**
 * OnboardingTooltips component provides guided walkthrough for first-time users
 * 
 * Features:
 * - Step-by-step tooltips pointing to key interface elements
 * - Dismissible with user preference persistence
 * - Keyboard navigation support
 * - Responsive positioning
 */
export default function OnboardingTooltips({
  steps = DEFAULT_TOOLTIP_STEPS,
  onComplete,
  onDismiss,
  className = '',
}: OnboardingTooltipsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sort steps by order
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
  const totalSteps = sortedSteps.length;
  const currentStepData = sortedSteps[currentStep];

  useEffect(() => {
    // Only show if user should see tooltips
    if (onboardingUtils.shouldShowTooltips()) {
      setIsVisible(true);
      calculateTooltipPosition();
    }
  }, []);

  useEffect(() => {
    if (isVisible && currentStepData) {
      calculateTooltipPosition();
    }
  }, [currentStep, isVisible, currentStepData]);

  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        calculateTooltipPosition();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isVisible) return;

      switch (event.key) {
        case 'Escape':
          handleDismiss();
          break;
        case 'ArrowRight':
        case ' ':
          event.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevious();
          break;
        case 'Enter':
          event.preventDefault();
          if (currentStep === totalSteps - 1) {
            handleComplete();
          } else {
            handleNext();
          }
          break;
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, currentStep, totalSteps]);

  const calculateTooltipPosition = () => {
    if (!currentStepData || !isVisible) return;

    const targetElement = document.querySelector(currentStepData.target);
    if (!targetElement || !tooltipRef.current) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    const arrow: { top?: number; left?: number; right?: number; bottom?: number } = {};

    const spacing = 16; // Distance from target element

    switch (currentStepData.position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - spacing;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        arrow.bottom = -8;
        arrow.left = tooltipRect.width / 2 - 8;
        break;
      case 'bottom':
        top = targetRect.bottom + spacing;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        arrow.top = -8;
        arrow.left = tooltipRect.width / 2 - 8;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - spacing;
        arrow.right = -8;
        arrow.top = tooltipRect.height / 2 - 8;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + spacing;
        arrow.left = -8;
        arrow.top = tooltipRect.height / 2 - 8;
        break;
    }

    // Ensure tooltip stays within viewport
    if (left < spacing) {
      left = spacing;
    } else if (left + tooltipRect.width > viewportWidth - spacing) {
      left = viewportWidth - tooltipRect.width - spacing;
    }

    if (top < spacing) {
      top = spacing;
    } else if (top + tooltipRect.height > viewportHeight - spacing) {
      top = viewportHeight - tooltipRect.height - spacing;
    }

    setTooltipPosition({ top, left, arrow });

    // Scroll target into view if needed
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onboardingUtils.markTooltipsSeen();
    setIsVisible(false);
    onComplete?.();
  };

  const handleDismiss = () => {
    onboardingUtils.markTooltipsSeen();
    setIsVisible(false);
    onDismiss?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible || !currentStepData || !tooltipPosition) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`onboarding-overlay ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: tokens.colors.background.overlay,
          zIndex: tokens.zIndex.overlay,
          pointerEvents: 'auto',
        }}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="onboarding-tooltip"
        style={{
          position: 'fixed',
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          zIndex: tokens.zIndex.tooltip,
          maxWidth: '320px',
          backgroundColor: tokens.colors.background.primary,
          border: `1px solid ${tokens.colors.border.medium}`,
          borderRadius: tokens.borderRadius.lg,
          boxShadow: tokens.boxShadow.xl,
          padding: tokens.spacing[6],
          pointerEvents: 'auto',
        }}
        role="dialog"
        aria-labelledby="tooltip-title"
        aria-describedby="tooltip-content"
        aria-live="polite"
      >
        {/* Arrow */}
        <div
          className="tooltip-arrow"
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            borderStyle: 'solid',
            ...tooltipPosition.arrow,
            borderWidth: '8px',
            borderColor: 
              tooltipPosition.arrow.top !== undefined ? `transparent transparent ${tokens.colors.background.primary} transparent` :
              tooltipPosition.arrow.bottom !== undefined ? `${tokens.colors.background.primary} transparent transparent transparent` :
              tooltipPosition.arrow.left !== undefined ? `transparent ${tokens.colors.background.primary} transparent transparent` :
              `transparent transparent transparent ${tokens.colors.background.primary}`,
          }}
        />

        {/* Header */}
        <div className="tooltip-header" style={{ marginBottom: tokens.spacing[4] }}>
          <h3
            id="tooltip-title"
            style={{
              margin: 0,
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.text.primary,
              lineHeight: tokens.typography.lineHeight.tight,
            }}
          >
            {currentStepData.title}
          </h3>
          <div
            style={{
              marginTop: tokens.spacing[2],
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.text.tertiary,
            }}
          >
            Step {currentStep + 1} of {totalSteps}
          </div>
        </div>

        {/* Content */}
        <div
          id="tooltip-content"
          style={{
            marginBottom: tokens.spacing[6],
            fontSize: tokens.typography.fontSize.base,
            color: tokens.colors.text.secondary,
            lineHeight: tokens.typography.lineHeight.relaxed,
          }}
        >
          {currentStepData.content}
        </div>

        {/* Progress indicator */}
        <div
          className="tooltip-progress"
          style={{
            marginBottom: tokens.spacing[4],
            height: '4px',
            backgroundColor: tokens.colors.neutral[200],
            borderRadius: tokens.borderRadius.full,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${((currentStep + 1) / totalSteps) * 100}%`,
              backgroundColor: tokens.colors.primary[500],
              borderRadius: tokens.borderRadius.full,
              transition: `width ${tokens.animation.duration.normal} ${tokens.animation.easing.out}`,
            }}
          />
        </div>

        {/* Actions */}
        <div
          className="tooltip-actions"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: tokens.spacing[3],
          }}
        >
          <div style={{ display: 'flex', gap: tokens.spacing[2] }}>
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                style={{
                  padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                  color: tokens.colors.text.secondary,
                  backgroundColor: 'transparent',
                  border: `1px solid ${tokens.colors.border.medium}`,
                  borderRadius: tokens.borderRadius.md,
                  cursor: 'pointer',
                  transition: `all ${tokens.animation.duration.fast} ${tokens.animation.easing.out}`,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.neutral[50];
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                  e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                }}
              >
                Previous
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: tokens.spacing[2] }}>
            <button
              onClick={handleSkip}
              style={{
                padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.medium,
                color: tokens.colors.text.tertiary,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: tokens.borderRadius.md,
                cursor: 'pointer',
                transition: `all ${tokens.animation.duration.fast} ${tokens.animation.easing.out}`,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = tokens.colors.text.secondary;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = tokens.colors.text.tertiary;
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              Skip Tour
            </button>

            <button
              onClick={currentStep === totalSteps - 1 ? handleComplete : handleNext}
              style={{
                padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.medium,
                color: tokens.colors.text.inverse,
                backgroundColor: tokens.colors.primary[500],
                border: 'none',
                borderRadius: tokens.borderRadius.md,
                cursor: 'pointer',
                transition: `all ${tokens.animation.duration.fast} ${tokens.animation.easing.out}`,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = tokens.colors.primary[600];
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = tokens.colors.primary[500];
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.colors.primary[300]}`;
                e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>

        {/* Keyboard hints */}
        <div
          style={{
            marginTop: tokens.spacing[4],
            paddingTop: tokens.spacing[4],
            borderTop: `1px solid ${tokens.colors.border.light}`,
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.text.muted,
            textAlign: 'center',
          }}
        >
          Use arrow keys to navigate • Press Esc to skip
        </div>
      </div>
    </>
  );
}