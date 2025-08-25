'use client';

import { tokens } from '@/styles/tokens';

export type LabStep = 'draft' | 'submit' | 'feedback';

export interface LabStepHeaderProps {
  /** Current step in the lab workflow */
  currentStep: LabStep;
  /** Current processing status */
  status?: 'idle' | 'processing' | 'completed' | 'error' | 'timeout';
  /** Lab title for context */
  labTitle: string;
  /** Callback when user clicks "Start Over" */
  onStartOver?: () => void;
  /** Whether the lab is currently disabled/processing */
  disabled?: boolean;
}

interface StepConfig {
  id: LabStep;
  number: number;
  label: string;
  description: string;
  icon: string;
}

const STEP_CONFIGS: StepConfig[] = [
  {
    id: 'draft',
    number: 1,
    label: 'Draft',
    description: 'Write your prompt',
    icon: '✏️'
  },
  {
    id: 'submit',
    number: 2,
    label: 'Submit',
    description: 'Evaluating response',
    icon: '🚀'
  },
  {
    id: 'feedback',
    number: 3,
    label: 'Feedback',
    description: 'Review and improve',
    icon: '📊'
  }
];

export default function LabStepHeader({
  currentStep,
  status = 'idle',
  labTitle,
  onStartOver,
  disabled = false
}: LabStepHeaderProps) {
  const getCurrentStepIndex = () => {
    return STEP_CONFIGS.findIndex(step => step.id === currentStep);
  };

  const getStepStatus = (stepConfig: StepConfig) => {
    const currentIndex = getCurrentStepIndex();
    const stepIndex = stepConfig.number - 1;

    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      if (status === 'processing') {
        return 'processing';
      } else if (status === 'error' || status === 'timeout') {
        return 'error';
      } else if (status === 'completed') {
        return 'completed';
      }
      return 'current';
    } else {
      return 'pending';
    }
  };

  const getStepStyles = (stepStatus: string) => {
    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: tokens.borderRadius.full,
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.medium,
      transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
    };

    switch (stepStatus) {
      case 'completed':
        return {
          ...baseStyles,
          backgroundColor: tokens.colors.success[500],
          color: tokens.colors.neutral[0],
          border: `2px solid ${tokens.colors.success[500]}`,
        };
      case 'current':
        return {
          ...baseStyles,
          backgroundColor: tokens.colors.primary[500],
          color: tokens.colors.neutral[0],
          border: `2px solid ${tokens.colors.primary[500]}`,
        };
      case 'processing':
        return {
          ...baseStyles,
          backgroundColor: tokens.colors.warning[500],
          color: tokens.colors.neutral[0],
          border: `2px solid ${tokens.colors.warning[500]}`,
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: tokens.colors.error[500],
          color: tokens.colors.neutral[0],
          border: `2px solid ${tokens.colors.error[500]}`,
        };
      case 'pending':
      default:
        return {
          ...baseStyles,
          backgroundColor: tokens.colors.neutral[100],
          color: tokens.colors.neutral[500],
          border: `2px solid ${tokens.colors.neutral[300]}`,
        };
    }
  };

  const getConnectorStyles = (fromStatus: string, toStatus: string) => {
    const isCompleted = fromStatus === 'completed' || fromStatus === 'current' || fromStatus === 'processing';
    
    return {
      flex: 1,
      height: '2px',
      backgroundColor: isCompleted ? tokens.colors.success[500] : tokens.colors.neutral[300],
      margin: `0 ${tokens.spacing[4]}`,
      transition: `background-color ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
    };
  };

  const getStatusIcon = (stepStatus: string, stepConfig: StepConfig) => {
    switch (stepStatus) {
      case 'completed':
        return '✓';
      case 'processing':
        return '⏳';
      case 'error':
        return '⚠️';
      case 'current':
      case 'pending':
      default:
        return stepConfig.number.toString();
    }
  };

  const getContextualHelp = () => {
    const currentStepConfig = STEP_CONFIGS[getCurrentStepIndex()];
    if (!currentStepConfig) return '';

    if (currentStep === 'submit' && status === 'processing') {
      return 'Your prompt is being evaluated. This may take a few moments...';
    }

    return currentStepConfig.description;
  };

  return (
    <div 
      style={{
        backgroundColor: tokens.colors.background.secondary,
        border: `1px solid ${tokens.colors.border.light}`,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing[6],
        marginBottom: tokens.spacing[6],
      }}
    >
      {/* Lab Title */}
      <div style={{ marginBottom: tokens.spacing[4] }}>
        <h1 
          style={{
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.text.primary,
            margin: 0,
            marginBottom: tokens.spacing[1],
          }}
        >
          {labTitle}
        </h1>
        <p 
          style={{
            fontSize: tokens.typography.fontSize.base,
            color: tokens.colors.text.secondary,
            margin: 0,
          }}
        >
          {getContextualHelp()}
        </p>
      </div>

      {/* Step Progress Indicator */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: tokens.spacing[4],
        }}
        role="progressbar"
        aria-valuenow={getCurrentStepIndex() + 1}
        aria-valuemin={1}
        aria-valuemax={3}
        aria-label={`Step ${getCurrentStepIndex() + 1} of 3: ${STEP_CONFIGS[getCurrentStepIndex()]?.label}`}
      >
        {STEP_CONFIGS.map((stepConfig, index) => {
          const stepStatus = getStepStatus(stepConfig);
          const isLast = index === STEP_CONFIGS.length - 1;

          return (
            <div key={stepConfig.id} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Step Circle */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  style={getStepStyles(stepStatus)}
                  aria-label={`${stepConfig.label}: ${stepStatus}`}
                >
                  {getStatusIcon(stepStatus, stepConfig)}
                </div>
                <div 
                  style={{
                    marginTop: tokens.spacing[2],
                    textAlign: 'center' as const,
                  }}
                >
                  <div 
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      fontWeight: tokens.typography.fontWeight.medium,
                      color: stepStatus === 'current' || stepStatus === 'processing' 
                        ? tokens.colors.text.primary 
                        : tokens.colors.text.secondary,
                    }}
                  >
                    {stepConfig.label}
                  </div>
                  <div 
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: tokens.colors.text.tertiary,
                      marginTop: tokens.spacing[0.5],
                    }}
                  >
                    {stepConfig.icon} {stepConfig.description}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div 
                  style={getConnectorStyles(stepStatus, getStepStatus(STEP_CONFIGS[index + 1]))}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: tokens.spacing[3],
        }}
      >
        {/* Start Over Button - Only show in feedback step */}
        {currentStep === 'feedback' && onStartOver && (
          <button
            onClick={onStartOver}
            disabled={disabled}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: tokens.spacing[2],
              padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.primary[600],
              backgroundColor: tokens.colors.primary[50],
              border: `1px solid ${tokens.colors.primary[200]}`,
              borderRadius: tokens.borderRadius.md,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: `all ${tokens.animation.duration.fast} ${tokens.animation.easing.inOut}`,
              outline: 'none',
              opacity: disabled ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = tokens.colors.primary[100];
                e.currentTarget.style.borderColor = tokens.colors.primary[300];
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = tokens.colors.primary[50];
                e.currentTarget.style.borderColor = tokens.colors.primary[200];
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
            <span>🔄</span>
            Start Over
          </button>
        )}

        {/* Status-specific guidance */}
        {currentStep === 'draft' && (
          <div 
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.text.tertiary,
              fontStyle: 'italic',
            }}
          >
            💡 Tip: Be specific and clear in your prompt for better results
          </div>
        )}

        {currentStep === 'submit' && status === 'processing' && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[2],
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.warning[700],
            }}
          >
            <div 
              style={{
                width: '1rem',
                height: '1rem',
                border: `2px solid ${tokens.colors.warning[300]}`,
                borderTop: `2px solid ${tokens.colors.warning[600]}`,
                borderRadius: tokens.borderRadius.full,
                animation: 'spin 1s linear infinite',
              }}
            />
            Processing your prompt...
          </div>
        )}

        {currentStep === 'feedback' && status === 'completed' && (
          <div 
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.success[700],
            }}
          >
            ✅ Evaluation complete! Review your results below.
          </div>
        )}
      </div>

      {/* CSS animation for spinner is handled inline */}
    </div>
  );
}