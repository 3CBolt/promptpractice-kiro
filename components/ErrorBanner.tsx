'use client';

import { useState } from 'react';
import { tokens } from '@/styles/tokens';

export interface ErrorBannerProps {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  retryDisabled?: boolean;
  retryCountdown?: number;
  showDetails?: boolean;
  details?: string;
  errorCode?: string;
  timestamp?: string;
  className?: string;
}

export default function ErrorBanner({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  onRetry,
  retryLabel = 'Try Again',
  retryDisabled = false,
  retryCountdown,
  showDetails = false,
  details,
  errorCode,
  timestamp,
  className = ''
}: ErrorBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetailsExpanded, setShowDetailsExpanded] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: {
            backgroundColor: tokens.colors.error[50],
            borderColor: tokens.colors.error[200],
            color: tokens.colors.error[800],
          },
          icon: {
            color: tokens.colors.error[400],
          },
          button: {
            backgroundColor: tokens.colors.error[100],
            color: tokens.colors.error[800],
          }
        };
      case 'warning':
        return {
          container: {
            backgroundColor: tokens.colors.warning[50],
            borderColor: tokens.colors.warning[200],
            color: tokens.colors.warning[800],
          },
          icon: {
            color: tokens.colors.warning[400],
          },
          button: {
            backgroundColor: tokens.colors.warning[100],
            color: tokens.colors.warning[800],
          }
        };
      case 'info':
        return {
          container: {
            backgroundColor: tokens.colors.primary[50],
            borderColor: tokens.colors.primary[200],
            color: tokens.colors.primary[800],
          },
          icon: {
            color: tokens.colors.primary[400],
          },
          button: {
            backgroundColor: tokens.colors.primary[100],
            color: tokens.colors.primary[800],
          }
        };
    }
  };

  const styles = getStyles();

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg style={{ height: '1.25rem', width: '1.25rem' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg style={{ height: '1.25rem', width: '1.25rem' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg style={{ height: '1.25rem', width: '1.25rem' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div 
      className={className}
      style={{
        border: '1px solid',
        borderRadius: tokens.borderRadius.md,
        padding: tokens.spacing[4],
        ...styles.container
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={styles.icon}>
            {getIcon()}
          </div>
        </div>
        <div style={{ marginLeft: tokens.spacing[3], flex: 1 }}>
          <h3 style={{ 
            fontSize: tokens.typography.fontSize.sm, 
            fontWeight: tokens.typography.fontWeight.medium,
            margin: 0,
          }}>
            {title}
          </h3>
          <p style={{ 
            fontSize: tokens.typography.fontSize.sm, 
            marginTop: tokens.spacing[1],
            margin: `${tokens.spacing[1]} 0 0 0`,
          }}>
            {message}
          </p>
          
          {/* Error details */}
          {(errorCode || timestamp) && (
            <div style={{ 
              marginTop: tokens.spacing[2], 
              fontSize: tokens.typography.fontSize.xs, 
              opacity: 0.75 
            }}>
              {errorCode && <span>Error Code: {errorCode}</span>}
              {errorCode && timestamp && <span style={{ margin: `0 ${tokens.spacing[2]}` }}>•</span>}
              {timestamp && <span>Time: {formatTimestamp(timestamp)}</span>}
            </div>
          )}

          {/* Expandable details */}
          {details && (
            <div style={{ marginTop: tokens.spacing[2] }}>
              <button
                onClick={() => setShowDetailsExpanded(!showDetailsExpanded)}
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  textDecoration: 'underline',
                  opacity: 0.75,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  color: 'inherit',
                  transition: `opacity ${tokens.animation.duration.fast} ${tokens.animation.easing.inOut}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.75'}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                  e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
                }}
                onBlur={(e) => e.currentTarget.style.outline = 'none'}
              >
                {showDetailsExpanded ? 'Hide Details' : 'Show Details'}
              </button>
              {showDetailsExpanded && (
                <div style={{
                  marginTop: tokens.spacing[2],
                  padding: tokens.spacing[2],
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: tokens.borderRadius.base,
                  fontSize: tokens.typography.fontSize.xs,
                  fontFamily: tokens.typography.fontFamily.mono.join(', '),
                  whiteSpace: 'pre-wrap'
                }}>
                  {details}
                </div>
              )}
            </div>
          )}

          {(onRetry || dismissible) && (
            <div style={{ 
              marginTop: tokens.spacing[3], 
              display: 'flex', 
              alignItems: 'center', 
              gap: tokens.spacing[2] 
            }}>
              {onRetry && (
                <button
                  onClick={onRetry}
                  disabled={retryDisabled}
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    padding: `${tokens.spacing[1]} ${tokens.spacing[3]}`,
                    borderRadius: tokens.borderRadius.md,
                    border: 'none',
                    cursor: retryDisabled ? 'not-allowed' : 'pointer',
                    opacity: retryDisabled ? 0.5 : 1,
                    outline: 'none',
                    transition: `all ${tokens.animation.duration.fast} ${tokens.animation.easing.inOut}`,
                    ...styles.button
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                    e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
                  }}
                  onBlur={(e) => e.currentTarget.style.outline = 'none'}
                >
                  {retryCountdown && retryCountdown > 0 
                    ? `${retryLabel} (${retryCountdown}s)`
                    : retryLabel
                  }
                </button>
              )}
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.neutral[600],
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: `${tokens.spacing[2]} ${tokens.spacing[1]}`,
                    borderRadius: tokens.borderRadius.md,
                    outline: 'none',
                    transition: `color ${tokens.animation.duration.fast} ${tokens.animation.easing.inOut}`
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = tokens.colors.neutral[800]}
                  onMouseLeave={(e) => e.currentTarget.style.color = tokens.colors.neutral[600]}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                    e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
                  }}
                  onBlur={(e) => e.currentTarget.style.outline = 'none'}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
        
        {dismissible && (
          <div style={{ marginLeft: 'auto', paddingLeft: tokens.spacing[3] }}>
            <button
              onClick={handleDismiss}
              style={{
                display: 'inline-flex',
                borderRadius: tokens.borderRadius.md,
                padding: tokens.spacing[1.5],
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                outline: 'none',
                transition: `background-color ${tokens.animation.duration.fast} ${tokens.animation.easing.inOut}`,
                ...styles.icon
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onFocus={(e) => {
                e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
              }}
              onBlur={(e) => e.currentTarget.style.outline = 'none'}
            >
              <span style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0
              }}>
                Dismiss
              </span>
              <svg style={{ height: tokens.spacing[5], width: tokens.spacing[5] }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}