'use client';

import { useState, useEffect } from 'react';

export interface RetryButtonProps {
  onRetry: () => void;
  disabled?: boolean;
  label?: string;
  countdown?: number;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function RetryButton({
  onRetry,
  disabled = false,
  label = 'Retry',
  countdown,
  variant = 'primary',
  size = 'md',
  className = ''
}: RetryButtonProps) {
  const [internalCountdown, setInternalCountdown] = useState(countdown || 0);

  useEffect(() => {
    if (countdown && countdown > 0) {
      setInternalCountdown(countdown);
      
      const interval = setInterval(() => {
        setInternalCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [countdown]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
      case 'secondary':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-4 py-2 text-base';
    }
  };

  const isDisabled = disabled || internalCountdown > 0;
  const displayLabel = internalCountdown > 0 
    ? `${label} (${internalCountdown}s)`
    : label;

  return (
    <button
      onClick={onRetry}
      disabled={isDisabled}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        rounded-md font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      {displayLabel}
    </button>
  );
}