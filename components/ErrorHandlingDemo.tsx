'use client';

import React, { useState, useEffect } from 'react';
import { tokens } from '@/styles/tokens';
import { getWebGPUManager, LoadingProgress } from '@/lib/models/webgpuModel';
import ModelLoadingProgress from './ModelLoadingProgress';
import ErrorFallback from './ErrorFallback';

interface ErrorHandlingDemoProps {
  className?: string;
}

export default function ErrorHandlingDemo({ className = '' }: ErrorHandlingDemoProps) {
  const [manager] = useState(() => getWebGPUManager());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [demoResponse, setDemoResponse] = useState<string>('');
  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const checkWebGPU = async () => {
      try {
        const supported = await manager.isWebGPUSupported();
        setWebgpuSupported(supported);
      } catch (err) {
        setWebgpuSupported(false);
      }
    };
    checkWebGPU();
  }, []);

  const handleLoadModel = async (modelId: string) => {
    setIsLoading(true);
    setError(null);
    setDemoResponse('');
    
    try {
      // Set up progress callback
      manager.setProgressCallback((progress) => {
        setLoadingProgress(progress);
      });
      
      await manager.loadModel(modelId);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestResponse = async () => {
    try {
      const response = await manager.generateResponse('Hello, how are you?');
      setDemoResponse(response.response); // Extract the response text
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className={className} style={{
      padding: tokens.spacing[6],
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h2 style={{
        fontSize: tokens.typography.fontSize.xl,
        fontWeight: '600',
        color: tokens.colors.neutral[900],
        marginBottom: tokens.spacing[6]
      }}>
        Error Handling & Fallback Demo
      </h2>

      {/* Model Selection */}
      <div style={{
        marginBottom: tokens.spacing[6],
        padding: tokens.spacing[4],
        backgroundColor: tokens.colors.neutral[50],
        borderRadius: '8px',
        border: `1px solid ${tokens.colors.neutral[200]}`
      }}>
        <h3 style={{
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: '500',
          marginBottom: tokens.spacing[4]
        }}>
          Try Loading a Model:
        </h3>
        <div style={{
          display: 'flex',
          gap: tokens.spacing[4],
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => handleLoadModel('phi-3-mini')}
            disabled={isLoading}
            style={{
              padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
              backgroundColor: tokens.colors.primary[600],
              color: 'white',
              border: 'none',
              borderRadius: tokens.borderRadius.md,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: tokens.typography.fontSize.sm,
              minHeight: tokens.touchTarget.minimum
            }}
          >
            Load Phi-3 Mini
          </button>
          <button
            onClick={() => handleLoadModel('gemma-2b')}
            disabled={isLoading}
            style={{
              padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
              backgroundColor: tokens.colors.success[600],
              color: 'white',
              border: 'none',
              borderRadius: tokens.borderRadius.md,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: tokens.typography.fontSize.sm,
              minHeight: tokens.touchTarget.minimum
            }}
          >
            Load Gemma 2B
          </button>
        </div>
      </div>

      {/* Loading Progress */}
      {loadingProgress && (loadingProgress.state !== 'idle') && (
        <div style={{ marginBottom: tokens.spacing[6] }}>
          <ModelLoadingProgress
            progress={loadingProgress}
            onRetry={() => handleLoadModel('phi-3-mini')}
            onEnterDemoMode={() => setError({ type: 'demo-mode' })}
          />
        </div>
      )}

      {/* Error Fallback */}
      {error && (
        <div style={{ marginBottom: tokens.spacing[6] }}>
          <ErrorFallback
            error={error}
            onRetry={() => handleLoadModel('phi-3-mini')}
            onEnterDemoMode={() => {
              setError(null);
              setDemoResponse('This is a demo response showing how the app works in fallback mode.');
            }}
          />
        </div>
      )}

      {/* Success State */}
      {manager.isModelLoaded() && !error && !isLoading && (
        <div style={{
          padding: tokens.spacing[6],
          backgroundColor: tokens.colors.success[50],
          border: `1px solid ${tokens.colors.success[600]}`,
          borderRadius: '8px',
          marginBottom: tokens.spacing[6]
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing[4],
            marginBottom: tokens.spacing[4]
          }}>
            <span style={{ fontSize: '2rem' }}>✅</span>
            <div>
              <h4 style={{
                margin: 0,
                color: tokens.colors.success[800],
                fontSize: tokens.typography.fontSize.base
              }}>
                Model Loaded Successfully!
              </h4>
              <p style={{
                margin: 0,
                color: tokens.colors.success[700],
                fontSize: tokens.typography.fontSize.sm
              }}>
                The model is ready for inference.
              </p>
            </div>
          </div>
          <button
            onClick={handleTestResponse}
            style={{
              padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
              backgroundColor: tokens.colors.success[600],
              color: 'white',
              border: 'none',
              borderRadius: tokens.borderRadius.md,
              cursor: 'pointer',
              fontSize: tokens.typography.fontSize.sm,
              minHeight: tokens.touchTarget.minimum
            }}
          >
            Test Response
          </button>
        </div>
      )}

      {/* Demo Response */}
      {demoResponse && (
        <div style={{
          padding: tokens.spacing[6],
          backgroundColor: 'white',
          border: `1px solid ${tokens.colors.neutral[200]}`,
          borderRadius: '8px',
          marginBottom: tokens.spacing[6]
        }}>
          <h4 style={{
            fontSize: tokens.typography.fontSize.base,
            fontWeight: '500',
            marginBottom: tokens.spacing[4],
            color: tokens.colors.neutral[800]
          }}>
            Model Response:
          </h4>
          <p style={{
            margin: 0,
            padding: tokens.spacing[3],
            backgroundColor: tokens.colors.neutral[50],
            borderRadius: tokens.borderRadius.md,
            fontFamily: tokens.typography.fontFamily.mono.join(', '),
            fontSize: tokens.typography.fontSize.sm,
            lineHeight: tokens.typography.lineHeight.relaxed
          }}>
            {demoResponse}
          </p>
          {manager.isFallbackMode() && (
            <div style={{
              marginTop: tokens.spacing[4],
              padding: tokens.spacing[2],
              backgroundColor: tokens.colors.primary[50],
              borderRadius: '4px',
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.primary[700]
            }}>
              ℹ️ This is a demo response (fallback mode active)
            </div>
          )}
        </div>
      )}

      {/* Status Information */}
      <div style={{
        padding: tokens.spacing[4],
        backgroundColor: tokens.colors.neutral[100],
        borderRadius: '6px',
        fontSize: tokens.typography.fontSize.sm,
        color: tokens.colors.neutral[700]
      }}>
        <strong>Current Status:</strong>
        <ul style={{ margin: `${tokens.spacing[1]} 0 0 0`, paddingLeft: tokens.spacing[6] }}>
          <li>WebGPU Supported: {webgpuSupported === null ? '🔍 Checking...' : webgpuSupported ? '✅ Yes' : '❌ No'}</li>
          <li>Model Loaded: {manager.isModelLoaded() ? '✅ Yes' : '❌ No'}</li>
          <li>Fallback Mode: {manager.isFallbackMode() ? '✅ Active' : '❌ Inactive'}</li>
        </ul>
      </div>
    </div>
  );
}