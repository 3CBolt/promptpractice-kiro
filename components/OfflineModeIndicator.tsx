'use client';

import { useState, useEffect } from 'react';

export interface OfflineModeIndicatorProps {
  isOffline: boolean;
  reason?: 'no-api-key' | 'rate-limited' | 'network-error' | 'api-error';
  resetTime?: number;
  onRetry?: () => void;
  retryDisabled?: boolean;
  className?: string;
}

export default function OfflineModeIndicator({
  isOffline,
  reason,
  resetTime,
  onRetry,
  retryDisabled = false,
  className = ''
}: OfflineModeIndicatorProps) {
  const [countdown, setCountdown] = useState<number>(0);

  // Countdown timer for rate limit reset
  useEffect(() => {
    if (reason === 'rate-limited' && resetTime) {
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.floor((resetTime - Date.now()) / 1000));
        setCountdown(remaining);
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [reason, resetTime]);

  if (!isOffline) {
    return null;
  }

  const getReasonMessage = () => {
    switch (reason) {
      case 'no-api-key':
        return 'No API key configured. Using sample responses for demonstration.';
      case 'rate-limited':
        const resetTimeStr = resetTime ? new Date(resetTime).toLocaleTimeString() : 'soon';
        return `Hugging Face quota exceeded. Rate limit resets at ${resetTimeStr}. Using sample responses.`;
      case 'network-error':
        return 'Network connection issues detected. Using offline sample responses.';
      case 'api-error':
        return 'API service temporarily unavailable. Using sample responses.';
      default:
        return 'Using sample responses for demonstration.';
    }
  };

  const getIcon = () => {
    switch (reason) {
      case 'rate-limited':
        return (
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'network-error':
      case 'api-error':
        return (
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getBgColor = () => {
    switch (reason) {
      case 'rate-limited':
        return 'bg-yellow-50 border-yellow-200';
      case 'network-error':
      case 'api-error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (reason) {
      case 'rate-limited':
        return 'text-yellow-800';
      case 'network-error':
      case 'api-error':
        return 'text-red-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className={`border rounded-md p-4 ${getBgColor()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            <h3 className={`text-sm font-medium ${getTextColor()}`}>
              📦 Sample Mode Active
            </h3>
          </div>
          <p className={`text-sm mt-1 ${getTextColor()} opacity-90`}>
            {getReasonMessage()}
          </p>
          
          {reason === 'no-api-key' && (
            <div className={`mt-2 text-xs ${getTextColor()} opacity-75`}>
              <p>To enable live AI models, add your Hugging Face API key to the environment variables.</p>
            </div>
          )}
          
          {reason === 'rate-limited' && (
            <div className={`mt-2 text-xs ${getTextColor()} opacity-75`}>
              <p>Free tier limit: 1000 requests/hour. Consider upgrading for higher limits.</p>
              {countdown > 0 && (
                <p className="mt-1">Rate limit resets in: {Math.floor(countdown / 60)}m {countdown % 60}s</p>
              )}
            </div>
          )}

          {(reason === 'network-error' || reason === 'api-error') && onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                disabled={retryDisabled}
                className={`text-sm px-3 py-1 rounded-md focus:outline-none focus:ring-2 ${
                  reason === 'network-error' ? 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500' :
                  'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}