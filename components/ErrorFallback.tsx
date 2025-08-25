'use client';

import React from 'react';
import { tokens } from '@/styles/tokens';

interface ErrorFallbackProps {
  error: {
    type: string;
    message: string;
    nextSteps?: string[];
    suggestedModel?: { id: string; name: string };
    retryAttempt?: number;
  };
  onRetry?: () => void;
  onEnterDemoMode?: () => void;
  onFallback?: (modelId: string) => void;
  className?: string;
}

export default function ErrorFallback({
  error,
  onRetry,
  onEnterDemoMode,
  onFallback,
  className = ''
}: ErrorFallbackProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'webgpu-unavailable':
        return '🚫';
      case 'insufficient-memory':
        return '💾';
      case 'network-error':
        return '🌐';
      case 'model-load-failed':
        return '📦';
      default:
        return '❌';
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'webgpu-unavailable':
        return 'WebGPU Not Available';
      case 'insufficient-memory':
        return 'Insufficient Memory';
      case 'network-error':
        return 'Network Error';
      case 'model-load-failed':
        return 'Model Loading Failed';
      default:
        return 'Error Occurred';
    }
  };

  const getDefaultNextSteps = () => {
    switch (error.type) {
      case 'webgpu-unavailable':
        return [
          'Try using a WebGPU-compatible browser (Chrome, Edge)',
          'Enable hardware acceleration in browser settings',
          'Use demo mode to see how the app works'
        ];
      case 'insufficient-memory':
        return [
          'Close other browser tabs to free up memory',
          'Try a smaller model',
          'Use demo mode as an alternative'
        ];
      case 'network-error':
        return [
          'Check your internet connection',
          'Try again in a few moments',
          'Use demo mode if the issue persists'
        ];
      default:
        return [
          'Try refreshing the page',
          'Check your browser console for details',
          'Use demo mode as a fallback'
        ];
    }
  };

  const nextSteps = error.nextSteps || getDefaultNextSteps();
  const retryAttempt = error.retryAttempt || 0;

  return (
    <div className={className} style={{
      padding: tokens.spacing[6],
      backgroundColor: tokens.colors.neutral[50],
      border: `1px solid ${tokens.colors.neutral[200]}`,
      borderRadius: tokens.borderRadius.lg,
      boxShadow: tokens.boxShadow.sm
    }}>
      {/* Error Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacing[4],
        marginBottom: tokens.spacing[4]
      }}>
        <span style={{ fontSize: '2rem' }}>{getErrorIcon()}</span>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.text.primary
          }}>
            {getErrorTitle()}
          </h3>
          <p style={{
            margin: 0,
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.text.secondary,
            lineHeight: tokens.typography.lineHeight.relaxed
          }}>
            {error.message}
          </p>
        </div>
      </div>

      {/* Retry Attempt Notice */}
      {retryAttempt > 0 && (
        <div style={{
          padding: tokens.spacing[2],
          backgroundColor: tokens.colors.warning[50],
          borderRadius: '4px',
          marginBottom: tokens.spacing[4],
          border: `1px solid ${tokens.colors.warning[200]}`,
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.warning[700]
        }}>
          🔄 Retry attempt {retryAttempt}
        </div>
      )}

      {/* Next Steps */}
      <div style={{ marginBottom: tokens.spacing[6] }}>
        <h4 style={{
          margin: `0 0 ${tokens.spacing[2]} 0`,
          fontSize: tokens.typography.fontSize.base,
          fontWeight: '500',
          color: tokens.colors.text.primary
        }}>
          What you can do:
        </h4>
        <ul style={{
          margin: 0,
          paddingLeft: tokens.spacing[6],
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.neutral[700]
        }}>
          {nextSteps.map((step, index) => (
            <li key={index} style={{ marginBottom: tokens.spacing[1] }}>
              {step}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: tokens.spacing[4],
        flexWrap: 'wrap'
      }}>
        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
              backgroundColor: tokens.colors.primary[600],
              color: 'white',
              border: 'none',
              borderRadius: tokens.borderRadius.md,
              cursor: 'pointer',
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[1],
              minHeight: tokens.touchTarget.minimum,
              touchAction: 'manipulation'
            }}
          >
            <span>🔄</span>
            <span>Try Again</span>
          </button>
        )}

        {/* Fallback Model Button */}
        {error.suggestedModel && onFallback && (
          <button
            onClick={() => onFallback(error.suggestedModel!.id)}
            style={{
              padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
              backgroundColor: tokens.colors.neutral[100],
              color: tokens.colors.neutral[700],
              border: `1px solid ${tokens.colors.neutral[300]}`,
              borderRadius: tokens.borderRadius.md,
              cursor: 'pointer',
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[1],
              minHeight: tokens.touchTarget.minimum,
              touchAction: 'manipulation'
            }}
          >
            <span>📦</span>
            <span>Try {error.suggestedModel.name}</span>
          </button>
        )}

        {/* Demo Mode Button */}
        {onEnterDemoMode && (
          <button
            onClick={onEnterDemoMode}
            style={{
              padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
              backgroundColor: tokens.colors.success[600],
              color: 'white',
              border: 'none',
              borderRadius: tokens.borderRadius.md,
              cursor: 'pointer',
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[1],
              minHeight: tokens.touchTarget.minimum,
              touchAction: 'manipulation'
            }}
          >
            <span>📖</span>
            <span>Demo Mode</span>
          </button>
        )}
      </div>

      {/* Additional Information */}
      {error.type === 'webgpu-unavailable' && (
        <div style={{
          marginTop: tokens.spacing[6],
          padding: tokens.spacing[4],
          backgroundColor: tokens.colors.neutral[100],
          borderRadius: '4px',
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.neutral[700]
        }}>
          <strong>About WebGPU:</strong> WebGPU enables high-performance computing in browsers. 
          It's supported in Chrome 113+, Edge 113+, and other Chromium-based browsers with hardware acceleration enabled.
        </div>
      )}

      {error.type === 'insufficient-memory' && (
        <div style={{
          marginTop: tokens.spacing[6],
          padding: tokens.spacing[4],
          backgroundColor: tokens.colors.neutral[100],
          borderRadius: '4px',
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.neutral[700]
        }}>
          <strong>Memory Requirements:</strong> Browser-based AI models require significant memory. 
          Smaller models need ~2GB RAM, while larger models may need 4GB+ of available memory.
        </div>
      )}
    </div>
  );
}