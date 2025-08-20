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
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-400',
          button: 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-400',
          button: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-400',
          button: 'bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-500'
        };
    }
  };

  const styles = getStyles();

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className={`h-5 w-5 ${styles.icon}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`h-5 w-5 ${styles.icon}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className={`h-5 w-5 ${styles.icon}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className={`border rounded-md p-4 ${styles.container} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-sm mt-1">{message}</p>
          
          {/* Error details */}
          {(errorCode || timestamp) && (
            <div className="mt-2 text-xs opacity-75">
              {errorCode && <span>Error Code: {errorCode}</span>}
              {errorCode && timestamp && <span className="mx-2">•</span>}
              {timestamp && <span>Time: {formatTimestamp(timestamp)}</span>}
            </div>
          )}

          {/* Expandable details */}
          {details && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetailsExpanded(!showDetailsExpanded)}
                className="text-xs underline opacity-75 hover:opacity-100 focus:outline-none"
              >
                {showDetailsExpanded ? 'Hide Details' : 'Show Details'}
              </button>
              {showDetailsExpanded && (
                <div className="mt-2 p-2 bg-black bg-opacity-10 rounded text-xs font-mono whitespace-pre-wrap">
                  {details}
                </div>
              )}
            </div>
          )}

          {(onRetry || dismiss