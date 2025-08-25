'use client';

import { AttemptStatus } from '@/types/contracts';
import { tokens } from '@/styles/tokens';

export interface StatusIndicatorProps {
  status: AttemptStatus | 'idle' | 'processing' | 'completed' | 'failed';
  title?: string;
  message?: string;
  showSpinner?: boolean;
  className?: string;
  partialResults?: any; // For displaying partial results
  onRetry?: () => void; // For retry functionality
}

export default function StatusIndicator({
  status,
  title,
  message,
  showSpinner = true,
  className = '',
  partialResults,
  onRetry
}: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
        return {
          color: tokens.colors.neutral[500],
          bgColor: tokens.colors.neutral[100],
          borderColor: tokens.colors.neutral[200],
          icon: null,
          defaultTitle: 'Ready',
          defaultMessage: 'Ready to process your request'
        };
      case AttemptStatus.QUEUED:
      case 'queued':
        return {
          color: tokens.colors.primary[500],
          bgColor: tokens.colors.primary[50],
          borderColor: tokens.colors.primary[200],
          icon: 'queued',
          defaultTitle: 'Queued',
          defaultMessage: 'Your request is queued for processing...'
        };
      case AttemptStatus.RUNNING:
      case 'running':
      case 'processing':
        return {
          color: tokens.colors.primary[600],
          bgColor: tokens.colors.primary[50],
          borderColor: tokens.colors.primary[200],
          icon: showSpinner ? 'spinner' : 'processing',
          defaultTitle: 'Processing',
          defaultMessage: 'Your request is being processed...'
        };
      case AttemptStatus.SUCCESS:
      case 'success':
      case 'completed':
        return {
          color: tokens.colors.success[600],
          bgColor: tokens.colors.success[50],
          borderColor: tokens.colors.success[200],
          icon: 'success',
          defaultTitle: 'Completed',
          defaultMessage: 'Request completed successfully'
        };
      case AttemptStatus.PARTIAL:
      case 'partial':
        return {
          color: tokens.colors.warning[600],
          bgColor: tokens.colors.warning[50],
          borderColor: tokens.colors.warning[200],
          icon: 'partial',
          defaultTitle: 'Partial Results',
          defaultMessage: 'Some results are available, but processing is incomplete'
        };
      case AttemptStatus.ERROR:
      case 'error':
      case 'failed':
        return {
          color: tokens.colors.error[600],
          bgColor: tokens.colors.error[50],
          borderColor: tokens.colors.error[200],
          icon: 'error',
          defaultTitle: 'Failed',
          defaultMessage: 'Request failed to process'
        };
      case AttemptStatus.TIMEOUT:
      case 'timeout':
        return {
          color: tokens.colors.warning[600],
          bgColor: tokens.colors.warning[50],
          borderColor: tokens.colors.warning[200],
          icon: 'warning',
          defaultTitle: 'Timeout',
          defaultMessage: 'Request timed out - it may still complete in the background'
        };
      default:
        return {
          color: tokens.colors.neutral[500],
          bgColor: tokens.colors.neutral[100],
          borderColor: tokens.colors.neutral[200],
          icon: null,
          defaultTitle: 'Unknown Status',
          defaultMessage: 'Status unknown'
        };
    }
  };

  const config = getStatusConfig();
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  const renderIcon = () => {
    const iconStyle = {
      width: tokens.spacing[5],
      height: tokens.spacing[5],
      color: config.color,
    };

    switch (config.icon) {
      case 'spinner':
        return (
          <div style={{
            ...iconStyle,
            border: `2px solid transparent`,
            borderTop: `2px solid ${config.color}`,
            borderRadius: tokens.borderRadius.full,
            animation: 'spin 1s linear infinite',
          }}></div>
        );
      case 'queued':
        return (
          <svg style={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'processing':
        return (
          <svg style={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'success':
        return (
          <svg style={iconStyle} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'partial':
        return (
          <svg style={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg style={iconStyle} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg style={iconStyle} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={className}
      style={{
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: tokens.borderRadius.md,
        padding: tokens.spacing[4],
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {config.icon && (
          <div style={{ 
            flexShrink: 0, 
            marginRight: tokens.spacing[3] 
          }}>
            {renderIcon()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h3 style={{
            color: config.color,
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            margin: 0,
          }}>{displayTitle}</h3>
          {displayMessage && (
            <p style={{
              color: config.color,
              fontSize: tokens.typography.fontSize.sm,
              marginTop: tokens.spacing[1],
              opacity: 0.8,
            }}>{displayMessage}</p>
          )}
          
          {/* Partial Results Display */}
          {status === AttemptStatus.PARTIAL && partialResults && (
            <div style={{
              marginTop: tokens.spacing[3],
              padding: tokens.spacing[3],
              backgroundColor: tokens.colors.background.primary,
              borderRadius: tokens.borderRadius.base,
              border: `1px solid ${tokens.colors.warning[200]}`,
            }}>
              <h4 style={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.medium,
                color: tokens.colors.warning[800],
                marginBottom: tokens.spacing[2],
              }}>Available Results:</h4>
              <div style={{
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.colors.warning[700],
              }}>
                {Array.isArray(partialResults) ? (
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: tokens.spacing[1],
                  }}>
                    {partialResults.map((result: any, index: number) => (
                      <li key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'center' 
                      }}>
                        <span style={{
                          width: tokens.spacing[2],
                          height: tokens.spacing[2],
                          backgroundColor: tokens.colors.warning[400],
                          borderRadius: tokens.borderRadius.full,
                          marginRight: tokens.spacing[2],
                        }}></span>
                        {result.modelId || `Model ${index + 1}`}: {result.status || 'Processing...'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{partialResults.toString()}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Retry Button for Error/Timeout States */}
          {(status === AttemptStatus.ERROR || status === AttemptStatus.TIMEOUT || status === 'failed') && onRetry && (
            <div style={{ marginTop: tokens.spacing[3] }}>
              <button
                onClick={onRetry}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: `${tokens.spacing[1]} ${tokens.spacing[3]}`,
                  border: 'none',
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.medium,
                  borderRadius: tokens.borderRadius.base,
                  color: tokens.colors.text.inverse,
                  backgroundColor: tokens.colors.primary[600],
                  cursor: 'pointer',
                  transition: `background-color ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tokens.colors.primary[700]}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = tokens.colors.primary[600]}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                  e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
                }}
                onBlur={(e) => e.currentTarget.style.outline = 'none'}
              >
                <svg 
                  style={{ 
                    width: tokens.spacing[3], 
                    height: tokens.spacing[3], 
                    marginRight: tokens.spacing[1] 
                  }} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}