'use client';

import { useState, useEffect } from 'react';
import { tokens, getFocusRing, getFocusBoxShadow } from '@/styles/tokens';

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
        return {
          backgroundColor: tokens.colors.primary[600],
          color: tokens.colors.text.inverse,
          borderColor: tokens.colors.primary[600],
        };
      case 'secondary':
        return {
          backgroundColor: tokens.colors.neutral[100],
          color: tokens.colors.text.primary,
          borderColor: tokens.colors.border.medium,
        };
      case 'danger':
        return {
          backgroundColor: tokens.colors.error[600],
          color: tokens.colors.text.inverse,
          borderColor: tokens.colors.error[600],
        };
    }
  };

  const getHoverStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: tokens.colors.primary[700],
          borderColor: tokens.colors.primary[700],
        };
      case 'secondary':
        return {
          backgroundColor: tokens.colors.neutral[200],
          borderColor: tokens.colors.border.dark,
        };
      case 'danger':
        return {
          backgroundColor: tokens.colors.error[700],
          borderColor: tokens.colors.error[700],
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
          fontSize: tokens.typography.fontSize.xs,
        };
      case 'md':
        return {
          padding: `${tokens.spacing[1.5]} ${tokens.spacing[3]}`,
          fontSize: tokens.typography.fontSize.sm,
        };
      case 'lg':
        return {
          padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
          fontSize: tokens.typography.fontSize.base,
        };
    }
  };

  const isDisabled = disabled || internalCountdown > 0;
  const displayLabel = internalCountdown > 0 
    ? `${label} (${internalCountdown}s)`
    : label;

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: tokens.typography.fontWeight.medium,
    lineHeight: tokens.typography.lineHeight.tight,
    borderRadius: tokens.borderRadius.md,
    border: '1px solid transparent',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
    textDecoration: 'none',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    outline: 'none',
    opacity: isDisabled ? 0.5 : 1,
    ...getVariantStyles(),
    ...getSizeStyles(),
  };

  return (
    <button
      onClick={onRetry}
      disabled={isDisabled}
      className={className}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          Object.assign(e.currentTarget.style, getHoverStyles());
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = tokens.boxShadow.md;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          Object.assign(e.currentTarget.style, getVariantStyles());
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      onFocus={(e) => {
        const focusVariant = variant === 'primary' ? 'primary' : 
                           variant === 'danger' ? 'error' : 'primary';
        e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${
          focusVariant === 'primary' ? tokens.focus.ring.color :
          focusVariant === 'error' ? tokens.colors.error[600] :
          tokens.focus.ring.color
        }`;
        e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = tokens.boxShadow.sm;
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = tokens.boxShadow.md;
        }
      }}
    >
      {displayLabel}
    </button>
  );
}