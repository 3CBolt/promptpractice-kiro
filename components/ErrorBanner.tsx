'use client';

import { useState } from 'react';

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
            backgroundColor: 'var(--color-error-50, #fef2f2)',
            borderColor: 'var(--color-error-200, #fecaca)',
            color: 'var(--color-error-800, #991b1b)',
          },
          icon: {
            color: 'var(--color-error-400, #f87171)',
          },
          button: {
            backgroundColor: 'var(--color-error-100, #fee2e2)',
            color: 'var(--color-error-800, #991b1b)',
          }
        };
      case 'warning':
        return {
          container: {
            backgroundColor: 'var(--color-warning-50, #fffbeb)',
            borderColor: 'var(--color-warning-200, #fde68a)',
            color: 'var(--color-warning-800, #92400e)',
          },
          icon: {
            color: 'var(--color-warning-400, #fbbf24)',
          },
          button: {
            backgroundColor: 'var(--color-warning-100, #fef3c7)',
            color: 'var(--color-warning-800, #92400e)',
          }
        };
      case 'info':
        return {
          container: {
            backgroundColor: 'var(--color-primary-50, #eff6ff)',
            borderColor: 'var(--color-primary-200, #bfdbfe)',
            color: 'var(--color-primary-800, #1e40af)',
          },
          icon: {
            color: 'var(--color-primary-400, #60a5fa)',
          },
          button: {
            backgroundColor: 'var(--color-primary-100, #dbeafe)',
            color: 'var(--color-primary-800, #1e40af)',
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
        borderRadius: 'var(--border-radius-md, 0.375rem)',
        padding: 'var(--spacing-4, 1rem)',
        ...styles.container
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={styles.icon}>
            {getIcon()}
          </div>
        </div>
        <div style={{ marginLeft: 'var(--spacing-3, 0.75rem)', flex: 1 }}>
          <h3 style={{ 
            fontSize: 'var(--font-size-sm, 0.875rem)', 
            fontWeight: 'var(--font-weight-medium, 500)' 
          }}>
            {title}
          </h3>
          <p style={{ 
            fontSize: 'var(--font-size-sm, 0.875rem)', 
            marginTop: 'var(--spacing-1, 0.25rem)' 
          }}>
            {message}
          </p>
          
          {/* Error details */}
          {(errorCode || timestamp) && (
            <div style={{ 
              marginTop: 'var(--spacing-2, 0.5rem)', 
              fontSize: 'var(--font-size-xs, 0.75rem)', 
              opacity: 0.75 
            }}>
              {errorCode && <span>Error Code: {errorCode}</span>}
              {errorCode && timestamp && <span style={{ margin: '0 var(--spacing-2, 0.5rem)' }}>•</span>}
              {timestamp && <span>Time: {formatTimestamp(timestamp)}</span>}
            </div>
          )}

          {/* Expandable details */}
          {details && (
            <div style={{ marginTop: 'var(--spacing-2, 0.5rem)' }}>
              <button
                onClick={() => setShowDetailsExpanded(!showDetailsExpanded)}
                style={{
                  fontSize: 'var(--font-size-xs, 0.75rem)',
                  textDecoration: 'underline',
                  opacity: 0.75,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.75'}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `var(--focus-ring-width, 2px) var(--focus-ring-style, solid) var(--focus-ring-color, #2563eb)`;
                  e.currentTarget.style.outlineOffset = 'var(--focus-ring-offset, 2px)';
                }}
                onBlur={(e) => e.currentTarget.style.outline = 'none'}
              >
                {showDetailsExpanded ? 'Hide Details' : 'Show Details'}
              </button>
              {showDetailsExpanded && (
                <div style={{
                  marginTop: 'var(--spacing-2, 0.5rem)',
                  padding: 'var(--spacing-2, 0.5rem)',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: 'var(--border-radius-base, 0.25rem)',
                  fontSize: 'var(--font-size-xs, 0.75rem)',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap'
                }}>
                  {details}
                </div>
              )}
            </div>
          )}

          {(onRetry || dismissible) && (
            <div style={{ 
              marginTop: 'var(--spacing-3, 0.75rem)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-2, 0.5rem)' 
            }}>
              {onRetry && (
                <button
                  onClick={onRetry}
                  disabled={retryDisabled}
                  style={{
                    fontSize: 'var(--font-size-sm, 0.875rem)',
                    padding: 'var(--spacing-1, 0.25rem) var(--spacing-3, 0.75rem)',
                    borderRadius: 'var(--border-radius-md, 0.375rem)',
                    border: 'none',
                    cursor: retryDisabled ? 'not-allowed' : 'pointer',
                    opacity: retryDisabled ? 0.5 : 1,
                    outline: 'none',
                    transition: 'all var(--animation-duration-fast, 150ms) ease',
                    ...styles.button
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = `var(--focus-ring-width, 2px) var(--focus-ring-style, solid) var(--focus-ring-color, #2563eb)`;
                    e.currentTarget.style.outlineOffset = 'var(--focus-ring-offset, 2px)';
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
                    fontSize: 'var(--font-size-sm, 0.875rem)',
                    color: 'var(--color-neutral-600, #4b5563)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 'var(--spacing-2, 0.5rem) var(--spacing-1, 0.25rem)',
                    borderRadius: 'var(--border-radius-md, 0.375rem)',
                    outline: 'none',
                    transition: 'color var(--animation-duration-fast, 150ms) ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-neutral-800, #1f2937)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-neutral-600, #4b5563)'}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = `var(--focus-ring-width, 2px) var(--focus-ring-style, solid) var(--focus-ring-color, #2563eb)`;
                    e.currentTarget.style.outlineOffset = 'var(--focus-ring-offset, 2px)';
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
          <div style={{ marginLeft: 'auto', paddingLeft: 'var(--spacing-3, 0.75rem)' }}>
            <button
              onClick={handleDismiss}
              style={{
                display: 'inline-flex',
                borderRadius: 'var(--border-radius-md, 0.375rem)',
                padding: 'var(--spacing-1-5, 0.375rem)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                outline: 'none',
                transition: 'background-color var(--animation-duration-fast, 150ms) ease',
                ...styles.icon
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onFocus={(e) => {
                e.currentTarget.style.outline = `var(--focus-ring-width, 2px) var(--focus-ring-style, solid) var(--focus-ring-color, #2563eb)`;
                e.currentTarget.style.outlineOffset = 'var(--focus-ring-offset, 2px)';
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
              <svg style={{ height: '1.25rem', width: '1.25rem' }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}