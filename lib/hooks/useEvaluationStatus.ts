'use client';

import { useState, useEffect, useCallback } from 'react';
import { Evaluation, AttemptStatus } from '@/types';

export interface EvaluationStatusState {
  status: 'idle' | AttemptStatus | 'processing' | 'completed' | 'failed' | 'timeout';
  evaluation?: Evaluation;
  partialResults?: any[];
  error?: {
    message: string;
    code?: string;
    timestamp?: string;
  };
  retryCount: number;
}

export interface UseEvaluationStatusOptions {
  pollInterval?: number;
  maxRetries?: number;
  timeoutMs?: number;
}

export function useEvaluationStatus(
  attemptId: string | null,
  options: UseEvaluationStatusOptions = {}
) {
  const {
    pollInterval = 2000,
    maxRetries = 3,
    timeoutMs = 60000 // 1 minute timeout
  } = options;

  const [state, setState] = useState<EvaluationStatusState>({
    status: 'idle',
    retryCount: 0
  });

  const [startTime, setStartTime] = useState<number | null>(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  // Reset state when attemptId changes
  useEffect(() => {
    if (attemptId) {
      setState({
        status: 'processing',
        retryCount: 0
      });
      setStartTime(Date.now());
      setConsecutiveErrors(0);
    } else {
      setState({
        status: 'idle',
        retryCount: 0
      });
      setStartTime(null);
      setConsecutiveErrors(0);
    }
  }, [attemptId]);

  // Polling logic with enhanced error handling
  useEffect(() => {
    if (!attemptId || state.status !== 'processing') {
      return;
    }

    const pollForStatus = async () => {
      try {
        // Check for timeout
        if (startTime && Date.now() - startTime > timeoutMs) {
          setState(prev => ({
            ...prev,
            status: 'timeout',
            error: {
              message: 'Evaluation timed out. The request may still be processing in the background.',
              code: 'TIMEOUT',
              timestamp: new Date().toISOString()
            }
          }));
          return;
        }

        const response = await fetch(`/api/evaluations/${attemptId}`, {
          // Add cache busting to prevent stale responses
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          // Handle specific HTTP errors
          if (response.status === 404) {
            throw new Error('Attempt not found. It may have been deleted or never existed.');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait before checking again.');
          } else if (response.status >= 500) {
            throw new Error('Server error. The evaluation service may be temporarily unavailable.');
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }

        const data = await response.json();

        // Reset consecutive errors on successful response
        setConsecutiveErrors(0);

        switch (data.status) {
          case AttemptStatus.SUCCESS:
          case 'completed':
            setState(prev => ({
              ...prev,
              status: 'completed',
              evaluation: data.evaluation,
              error: undefined,
              partialResults: undefined
            }));
            break;
            
          case AttemptStatus.PARTIAL:
          case 'partial':
            setState(prev => ({
              ...prev,
              status: AttemptStatus.PARTIAL,
              partialResults: data.partialResults || data.evaluation?.results,
              error: undefined
            }));
            break;
            
          case AttemptStatus.ERROR:
          case 'failed':
            setState(prev => ({
              ...prev,
              status: 'failed',
              error: {
                message: data.error?.message || 'Evaluation failed',
                code: data.error?.code || 'EVALUATION_FAILED',
                timestamp: data.error?.timestamp || data.timestamp
              }
            }));
            break;
            
          case AttemptStatus.TIMEOUT:
          case 'timeout':
            setState(prev => ({
              ...prev,
              status: 'timeout',
              error: {
                message: data.error?.message || 'Evaluation timed out',
                code: data.error?.code || 'TIMEOUT',
                timestamp: data.error?.timestamp || data.timestamp
              }
            }));
            break;
            
          case AttemptStatus.QUEUED:
          case 'queued':
            setState(prev => ({
              ...prev,
              status: AttemptStatus.QUEUED
            }));
            break;
            
          case AttemptStatus.RUNNING:
          case 'running':
          case 'processing':
            setState(prev => ({
              ...prev,
              status: 'processing'
            }));
            break;
            
          default:
            // Unknown status, treat as still processing but log warning
            console.warn(`Unknown evaluation status: ${data.status}`);
            break;
        }

      } catch (error) {
        console.error('Error polling evaluation status:', error);
        
        setConsecutiveErrors(prev => prev + 1);
        
        setState(prev => {
          const newRetryCount = prev.retryCount + 1;
          
          // If we've had too many consecutive errors or exceeded max retries, fail
          if (newRetryCount >= maxRetries || consecutiveErrors >= 5) {
            return {
              ...prev,
              status: 'failed',
              error: {
                message: error instanceof Error ? error.message : 'Failed to check evaluation status',
                code: 'POLLING_FAILED',
                timestamp: new Date().toISOString()
              },
              retryCount: newRetryCount
            };
          }
          
          return {
            ...prev,
            retryCount: newRetryCount
          };
        });
      }
    };

    // Initial poll with slight delay to avoid immediate polling
    const initialTimeout = setTimeout(pollForStatus, 500);

    // Set up polling interval with exponential backoff on errors
    const baseInterval = consecutiveErrors > 0 
      ? Math.min(pollInterval * Math.pow(2, consecutiveErrors), 10000) // Max 10 second intervals
      : pollInterval;
    
    const interval = setInterval(pollForStatus, baseInterval);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [attemptId, state.status, startTime, pollInterval, maxRetries, timeoutMs, consecutiveErrors]);

  // Manual retry function
  const retry = useCallback(() => {
    if (attemptId) {
      setState({
        status: 'processing',
        retryCount: 0
      });
      setStartTime(Date.now());
    }
  }, [attemptId]);

  // Reset function
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      retryCount: 0
    });
    setStartTime(null);
  }, []);

  return {
    ...state,
    retry,
    reset,
    isPolling: state.status === 'processing',
    hasTimedOut: state.status === 'timeout',
    canRetry: state.status === 'failed' || state.status === 'timeout'
  };
}