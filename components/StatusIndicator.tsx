'use client';

export interface StatusIndicatorProps {
  status: 'idle' | 'processing' | 'completed' | 'failed' | 'timeout';
  title?: string;
  message?: string;
  showSpinner?: boolean;
  className?: string;
}

export default function StatusIndicator({
  status,
  title,
  message,
  showSpinner = true,
  className = ''
}: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          icon: null,
          defaultTitle: 'Ready',
          defaultMessage: 'Ready to process your request'
        };
      case 'processing':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: showSpinner ? 'spinner' : 'processing',
          defaultTitle: 'Processing',
          defaultMessage: 'Your request is being processed...'
        };
      case 'completed':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: 'success',
          defaultTitle: 'Completed',
          defaultMessage: 'Request completed successfully'
        };
      case 'failed':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: 'error',
          defaultTitle: 'Failed',
          defaultMessage: 'Request failed to process'
        };
      case 'timeout':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          icon: 'warning',
          defaultTitle: 'Timeout',
          defaultMessage: 'Request timed out'
        };
    }
  };

  const config = getStatusConfig();
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  const renderIcon = () => {
    switch (config.icon) {
      case 'spinner':
        return (
          <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-current ${config.color}`}></div>
        );
      case 'processing':
        return (
          <svg className={`h-5 w-5 ${config.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className={`h-5 w-5 ${config.color}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`h-5 w-5 ${config.color}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`h-5 w-5 ${config.color}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${config.bgColor} border border-opacity-20 rounded-md p-4 ${className}`}>
      <div className="flex items-center">
        {config.icon && (
          <div className="flex-shrink-0 mr-3">
            {renderIcon()}
          </div>
        )}
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${config.color}`}>{displayTitle}</h3>
          {displayMessage && (
            <p className={`text-sm mt-1 ${config.color} opacity-80`}>{displayMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}