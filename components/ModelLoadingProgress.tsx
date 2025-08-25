'use client';

import React from 'react';
import { tokens } from '@/styles/tokens';
import { LoadingProgress } from '@/lib/models/webgpuModel';

interface ModelLoadingProgressProps {
  progress: LoadingProgress;
  onRetry?: () => void;
  onEnterDemoMode?: () => void;
  onCancel?: () => void;
  className?: string;
}

export default function ModelLoadingProgress({
  progress,
  onRetry,
  onEnterDemoMode,
  onCancel,
  className = ''
}: ModelLoadingProgressProps) {
  const isError = progress.state === 'error';
  const isComplete = progress.state === 'ready';
  const isLoading = progress.state === 'fetching-weights' || progress.state === 'compiling' || progress.state === 'warming-up';

  const getProgressPercentage = () => {
    if (isComplete) return 100;
    if (isError) return 0;
    return Math.round((progress.progress || 0) * 100);
  };

  const getStatusMessage = () => {
    switch (progress.state) {
      case 'fetching-weights':
        return `Downloading model... ${getProgressPercentage()}%`;
      case 'checking-webgpu':
        return 'Checking WebGPU compatibility...';
      case 'compiling':
        return 'Compiling model for WebGPU...';
      case 'warming-up':
        return 'Warming up model...';
      case 'ready':
        return 'Model loaded successfully!';
      case 'error':
        return progress.error || 'Failed to load model';
      default:
        return 'Preparing model...';
    }
  };

  const getStatusIcon = () => {
    switch (progress.state) {
      case 'fetching-weights':
        return '⬇️';
      case 'checking-webgpu':
        return '🔍';
      case 'compiling':
        return '⚙️';
      case 'warming-up':
        return '🔥';
      case 'ready':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🔄';
    }
  };

  return (
    <div className={className} style={{
      padding: tokens.spacing[6],
      backgroundColor: tokens.colors.background.primary,
      border: `1px solid ${tokens.colors.border.light}`,
      borderRadius: tokens.borderRadius.lg,
      boxShadow: tokens.boxShadow.sm
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: tokens.spacing[4]
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[2]
        }}>
          <span style={{ fontSize: '1.5rem' }}>
            {getStatusIcon()}
          </span>
          <h3 style={{
            margin: 0,
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.text.primary
          }}>
            {isError ? 'Loading Failed' : 'Loading Model'}
          </h3>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
              backgroundColor: 'transparent',
              color: tokens.colors.neutral[500],
              border: 'none',
              borderRadius: tokens.borderRadius.sm,
              cursor: 'pointer',
              fontSize: tokens.typography.fontSize.sm,
              minHeight: tokens.touchTarget.minimum
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {!isError && (
        <div style={{
          marginBottom: tokens.spacing[4]
        }}>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: tokens.colors.neutral[200],
            borderRadius: tokens.borderRadius.full,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getProgressPercentage()}%`,
              height: '100%',
              backgroundColor: isComplete ? tokens.colors.success[500] : tokens.colors.primary[500],
              transition: `width ${tokens.animation.duration.normal} ${tokens.animation.easing.out}`,
              borderRadius: tokens.borderRadius.full
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: tokens.spacing[1],
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.neutral[600]
          }}>
            <span>{getStatusMessage()}</span>
            <span>{getProgressPercentage()}%</span>
          </div>
        </div>
      )}

      {/* Status Message */}
      <div style={{
        padding: tokens.spacing[2],
        backgroundColor: isError ? tokens.colors.error[50] : tokens.colors.neutral[50],
        borderRadius: tokens.borderRadius.base,
        marginBottom: tokens.spacing[4]
      }}>
        <p style={{
          margin: 0,
          fontSize: tokens.typography.fontSize.sm,
          color: isError ? tokens.colors.error[700] : tokens.colors.neutral[700],
          lineHeight: tokens.typography.lineHeight.relaxed
        }}>
          {getStatusMessage()}
        </p>
        {progress.error && (
          <p style={{
            margin: `${tokens.spacing[1]} 0 0 0`,
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.neutral[500],
            fontFamily: tokens.typography.fontFamily.mono.join(', ')
          }}>
            {progress.error}
          </p>
        )}
      </div>

      {/* Retry Information */}
      {progress.retryAttempt && progress.retryAttempt > 0 && (
        <div style={{
          padding: tokens.spacing[2],
          backgroundColor: tokens.colors.warning[50],
          borderRadius: tokens.borderRadius.base,
          marginBottom: tokens.spacing[4],
          border: `1px solid ${tokens.colors.warning[200]}`,
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[2]
        }}>
          <span>🔄</span>
          <span style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.warning[700]
          }}>
            Retry attempt {progress.retryAttempt}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      {isError && (
        <div style={{
          display: 'flex',
          gap: tokens.spacing[3],
          flexWrap: 'wrap'
        }}>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                backgroundColor: tokens.colors.primary[600],
                color: tokens.colors.text.inverse,
                border: 'none',
                borderRadius: tokens.borderRadius.md,
                cursor: 'pointer',
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.medium,
                minHeight: tokens.touchTarget.minimum,
                touchAction: 'manipulation'
              }}
            >
              🔄 Retry
            </button>
          )}
          {onEnterDemoMode && (
            <button
              onClick={onEnterDemoMode}
              style={{
                padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                backgroundColor: tokens.colors.success[600],
                color: tokens.colors.text.inverse,
                border: 'none',
                borderRadius: tokens.borderRadius.md,
                cursor: 'pointer',
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.medium,
                minHeight: tokens.touchTarget.minimum,
                touchAction: 'manipulation'
              }}
            >
              📖 Demo Mode
            </button>
          )}
        </div>
      )}

      {/* Success Actions */}
      {isComplete && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[2],
          padding: tokens.spacing[2],
          backgroundColor: tokens.colors.success[50],
          borderRadius: tokens.borderRadius.base,
          border: `1px solid ${tokens.colors.success[200]}`
        }}>
          <span>🎉</span>
          <span style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.success[700],
            fontWeight: tokens.typography.fontWeight.medium
          }}>
            Ready to use! You can now submit prompts.
          </span>
        </div>
      )}
    </div>
  );
}