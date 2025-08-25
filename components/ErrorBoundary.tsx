'use client';

import React from 'react';
import { tokens } from '@/styles/tokens';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default error UI
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: tokens.spacing[8],
          backgroundColor: tokens.colors.background.secondary,
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
            backgroundColor: tokens.colors.background.primary,
            padding: tokens.spacing[8],
            borderRadius: tokens.borderRadius.xl,
            boxShadow: tokens.boxShadow.lg,
            border: `1px solid ${tokens.colors.border.light}`,
          }}>
            <div style={{
              fontSize: tokens.typography.fontSize['3xl'],
              marginBottom: tokens.spacing[4],
            }}>⚠️</div>
            <h2 style={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.text.primary,
              marginBottom: tokens.spacing[4],
            }}>Something went wrong</h2>
            <p style={{
              fontSize: tokens.typography.fontSize.base,
              color: tokens.colors.text.secondary,
              lineHeight: tokens.typography.lineHeight.relaxed,
              marginBottom: tokens.spacing[6],
            }}>
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            
            <div style={{
              display: 'flex',
              gap: tokens.spacing[3],
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <button 
                onClick={this.resetError}
                type="button"
                style={{
                  backgroundColor: tokens.colors.primary[600],
                  color: tokens.colors.text.inverse,
                  padding: `${tokens.spacing[3]} ${tokens.spacing[6]}`,
                  borderRadius: tokens.borderRadius.md,
                  border: 'none',
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: `background-color ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
                  minHeight: tokens.touchTarget.comfortable,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tokens.colors.primary[700]}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = tokens.colors.primary[600]}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                  e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
                }}
                onBlur={(e) => e.currentTarget.style.outline = 'none'}
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                type="button"
                style={{
                  backgroundColor: 'transparent',
                  color: tokens.colors.primary[600],
                  padding: `${tokens.spacing[3]} ${tokens.spacing[6]}`,
                  borderRadius: tokens.borderRadius.md,
                  border: `1px solid ${tokens.colors.primary[600]}`,
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
                  minHeight: tokens.touchTarget.comfortable,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.primary[600];
                  e.currentTarget.style.color = tokens.colors.text.inverse;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = tokens.colors.primary[600];
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                  e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
                }}
                onBlur={(e) => e.currentTarget.style.outline = 'none'}
              >
                Refresh Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: tokens.spacing[6],
                textAlign: 'left',
                backgroundColor: tokens.colors.neutral[50],
                padding: tokens.spacing[4],
                borderRadius: tokens.borderRadius.md,
                border: `1px solid ${tokens.colors.neutral[200]}`,
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                  color: tokens.colors.text.primary,
                  marginBottom: tokens.spacing[2],
                }}>Error Details (Development)</summary>
                <pre style={{
                  fontSize: tokens.typography.fontSize.xs,
                  fontFamily: tokens.typography.fontFamily.mono.join(', '),
                  color: tokens.colors.text.secondary,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  padding: tokens.spacing[2],
                  backgroundColor: tokens.colors.neutral[100],
                  borderRadius: tokens.borderRadius.base,
                  overflow: 'auto',
                  maxHeight: '200px',
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;