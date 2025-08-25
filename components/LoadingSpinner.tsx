'use client';

import React from 'react';
import { tokens } from '@/styles/tokens';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  color = 'primary', 
  text,
  className = '' 
}: LoadingSpinnerProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: tokens.spacing[4],
          height: tokens.spacing[4],
          borderWidth: '2px',
        };
      case 'large':
        return {
          width: tokens.spacing[12],
          height: tokens.spacing[12],
          borderWidth: '3px',
        };
      default: // medium
        return {
          width: tokens.spacing[8],
          height: tokens.spacing[8],
          borderWidth: '2px',
        };
    }
  };

  const getColorStyles = () => {
    switch (color) {
      case 'secondary':
        return {
          borderColor: tokens.colors.neutral[200],
          borderTopColor: tokens.colors.neutral[600],
        };
      case 'white':
        return {
          borderColor: tokens.colors.neutral[400],
          borderTopColor: tokens.colors.text.inverse,
        };
      default: // primary
        return {
          borderColor: tokens.colors.neutral[200],
          borderTopColor: tokens.colors.primary[600],
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const colorStyles = getColorStyles();

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div 
        style={{
          ...sizeStyles,
          ...colorStyles,
          borderRadius: tokens.borderRadius.full,
          borderStyle: 'solid',
          animation: 'spin 1s linear infinite',
        }}
        role="status"
        aria-label={text || 'Loading'}
      />
      {text && (
        <p style={{
          marginTop: tokens.spacing[2],
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.text.secondary,
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}>
          {text}
        </p>
      )}
      <span style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}>
        {text || 'Loading...'}
      </span>
    </div>
  );
}

// Skeleton loader component
interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  rounded?: boolean;
}

export function Skeleton({ 
  width = '100%', 
  height = '1rem', 
  className = '',
  rounded = false 
}: SkeletonProps) {
  return (
    <div 
      className={className}
      style={{
        width,
        height,
        backgroundColor: tokens.colors.neutral[200],
        borderRadius: rounded ? tokens.borderRadius.full : tokens.borderRadius.base,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
      role="status"
      aria-label="Loading content"
    />
  );
}

// Loading card component
interface LoadingCardProps {
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

export function LoadingCard({ 
  showAvatar = false, 
  lines = 3, 
  className = '' 
}: LoadingCardProps) {
  return (
    <div 
      className={className}
      style={{
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    >
      <div style={{
        display: 'flex',
        gap: tokens.spacing[4],
      }}>
        {showAvatar && (
          <Skeleton 
            width={tokens.spacing[12]} 
            height={tokens.spacing[12]} 
            rounded 
            className="flex-shrink-0" 
          />
        )}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing[2],
        }}>
          <Skeleton height="1rem" width="75%" />
          {Array.from({ length: lines - 1 }).map((_, index) => (
            <Skeleton 
              key={index} 
              height="0.875rem" 
              width={index === lines - 2 ? '50%' : '100%'} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}