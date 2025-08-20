'use client';

import React from 'react';

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
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3'
  };

  const colorClasses = {
    primary: 'border-gray-200 border-t-blue-600',
    secondary: 'border-gray-200 border-t-gray-600',
    white: 'border-gray-400 border-t-white'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]} 
          rounded-full animate-spin
        `}
        role="status"
        aria-label={text || 'Loading'}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">
          {text}
        </p>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
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
      className={`
        skeleton bg-gray-200 
        ${rounded ? 'rounded-full' : 'rounded'} 
        ${className}
      `}
      style={{ width, height }}
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
    <div className={`animate-pulse ${className}`}>
      <div className="flex space-x-4">
        {showAvatar && (
          <Skeleton width="3rem" height="3rem" rounded className="flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
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