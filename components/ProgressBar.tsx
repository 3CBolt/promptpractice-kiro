/**
 * ProgressBar Component
 * 
 * Displays visual progress indicators for various metrics like completion,
 * scores, and learning progress with accessibility support.
 */

import React from 'react';
import { tokens } from '@/styles/tokens';

export interface ProgressBarProps {
  /** Current progress value */
  value: number;
  /** Maximum possible value */
  max: number;
  /** Visual variant for different contexts */
  variant?: 'primary' | 'success' | 'warning' | 'neutral';
  /** Size of the progress bar */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label for accessibility */
  label?: string;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Animated progress fill */
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  variant = 'primary',
  size = 'md',
  label,
  showPercentage = false,
  className = '',
  animated = true,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  // Size configurations
  const sizeConfig = {
    sm: {
      height: '0.5rem',
      fontSize: tokens.typography.fontSize.xs,
    },
    md: {
      height: '0.75rem',
      fontSize: tokens.typography.fontSize.sm,
    },
    lg: {
      height: '1rem',
      fontSize: tokens.typography.fontSize.base,
    },
  };
  
  // Color configurations
  const colorConfig = {
    primary: {
      bg: tokens.colors.primary[100],
      fill: tokens.colors.primary[500],
      text: tokens.colors.primary[700],
    },
    success: {
      bg: tokens.colors.success[100],
      fill: tokens.colors.success[500],
      text: tokens.colors.success[700],
    },
    warning: {
      bg: tokens.colors.warning[100],
      fill: tokens.colors.warning[500],
      text: tokens.colors.warning[700],
    },
    neutral: {
      bg: tokens.colors.neutral[200],
      fill: tokens.colors.neutral[500],
      text: tokens.colors.neutral[700],
    },
  };
  
  const config = {
    ...sizeConfig[size],
    ...colorConfig[variant],
  };
  
  const progressBarStyle: React.CSSProperties = {
    width: '100%',
    height: config.height,
    backgroundColor: config.bg,
    borderRadius: tokens.borderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  };
  
  const progressFillStyle: React.CSSProperties = {
    height: '100%',
    width: `${percentage}%`,
    backgroundColor: config.fill,
    borderRadius: tokens.borderRadius.full,
    transition: animated ? `width ${tokens.animation.duration.normal} ${tokens.animation.easing.out}` : 'none',
    position: 'relative',
  };
  
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[2],
  };
  
  const percentageStyle: React.CSSProperties = {
    fontSize: config.fontSize,
    fontWeight: tokens.typography.fontWeight.medium,
    color: config.text,
    minWidth: '3rem',
    textAlign: 'right' as const,
  };
  
  return (
    <div style={containerStyle} className={className}>
      <div
        style={{ flex: 1 }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${value} of ${max}`}
      >
        <div style={progressBarStyle}>
          <div style={progressFillStyle} />
        </div>
      </div>
      
      {showPercentage && (
        <span style={percentageStyle}>
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;