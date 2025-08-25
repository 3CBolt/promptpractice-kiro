/**
 * UnlockableContent Component
 * 
 * Displays content that becomes available after meeting certain criteria.
 * Used for motivation mechanics like example prompts, badges, and achievements.
 */

'use client';

import React, { useState } from 'react';
import { tokens } from '@/styles/tokens';

export interface UnlockCriteria {
  type: 'score' | 'attempts' | 'streak' | 'guide_completion' | 'lab_completion';
  threshold: number;
  labId?: string;
  guideId?: string;
}

export interface UnlockableContentProps {
  /** Unique identifier for this unlockable */
  id: string;
  /** Title of the unlockable content */
  title: string;
  /** Description of what this unlocks */
  description: string;
  /** Criteria that must be met to unlock */
  criteria: UnlockCriteria;
  /** Whether the content is currently unlocked */
  isUnlocked: boolean;
  /** Current progress toward unlocking (0-1) */
  progress?: number;
  /** Content to show when unlocked */
  children: React.ReactNode;
  /** Optional icon for the unlockable */
  icon?: string;
  /** Variant for different types of unlockables */
  variant?: 'achievement' | 'example' | 'feature' | 'bonus';
  /** Callback when user dismisses the unlock notification */
  onDismiss?: () => void;
  /** Whether to show a celebration animation when unlocked */
  showCelebration?: boolean;
}

const UnlockableContent: React.FC<UnlockableContentProps> = ({
  id,
  title,
  description,
  criteria,
  isUnlocked,
  progress = 0,
  children,
  icon,
  variant = 'achievement',
  onDismiss,
  showCelebration = true,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  
  React.useEffect(() => {
    if (isUnlocked && showCelebration && !isDismissed) {
      setShowUnlockAnimation(true);
      const timer = setTimeout(() => setShowUnlockAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked, showCelebration, isDismissed]);
  
  // Variant configurations
  const variantConfig = {
    achievement: {
      color: tokens.colors.primary[500],
      bgColor: tokens.colors.primary[50],
      borderColor: tokens.colors.primary[200],
      icon: icon || '🏆',
    },
    example: {
      color: tokens.colors.success[600],
      bgColor: tokens.colors.success[50],
      borderColor: tokens.colors.success[200],
      icon: icon || '💡',
    },
    feature: {
      color: tokens.colors.warning[600],
      bgColor: tokens.colors.warning[50],
      borderColor: tokens.colors.warning[200],
      icon: icon || '✨',
    },
    bonus: {
      color: tokens.colors.neutral[600],
      bgColor: tokens.colors.neutral[50],
      borderColor: tokens.colors.neutral[200],
      icon: icon || '🎁',
    },
  };
  
  const config = variantConfig[variant];
  
  const getCriteriaText = () => {
    switch (criteria.type) {
      case 'score':
        return `Achieve a score of ${criteria.threshold} or higher`;
      case 'attempts':
        return `Complete ${criteria.threshold} attempt${criteria.threshold > 1 ? 's' : ''}`;
      case 'streak':
        return `Practice for ${criteria.threshold} consecutive day${criteria.threshold > 1 ? 's' : ''}`;
      case 'guide_completion':
        return `Complete the ${criteria.guideId} guide`;
      case 'lab_completion':
        return `Complete ${criteria.threshold} lab${criteria.threshold > 1 ? 's' : ''}`;
      default:
        return 'Meet the unlock criteria';
    }
  };
  
  const containerStyle: React.CSSProperties = {
    border: `2px solid ${config.borderColor}`,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing[4],
    backgroundColor: config.bgColor,
    position: 'relative',
    overflow: 'hidden',
  };
  
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[3],
    marginBottom: tokens.spacing[3],
  };
  
  const iconStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize['2xl'],
    filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(0.5)',
  };
  
  const titleStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: isUnlocked ? config.color : tokens.colors.neutral[500],
    margin: 0,
  };
  
  const descriptionStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
    margin: 0,
  };
  
  const criteriaStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
    fontStyle: 'italic',
    marginTop: tokens.spacing[2],
  };
  
  const contentStyle: React.CSSProperties = {
    marginTop: tokens.spacing[4],
    opacity: isUnlocked ? 1 : 0.3,
    pointerEvents: isUnlocked ? 'auto' : 'none',
  };
  
  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: showUnlockAnimation 
      ? 'linear-gradient(45deg, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0) 100%)'
      : 'none',
    animation: showUnlockAnimation ? 'unlock-celebration 3s ease-out' : 'none',
    pointerEvents: 'none',
  };
  
  const dismissButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: tokens.spacing[2],
    right: tokens.spacing[2],
    background: 'none',
    border: 'none',
    fontSize: tokens.typography.fontSize.lg,
    cursor: 'pointer',
    color: tokens.colors.neutral[400],
    padding: tokens.spacing[1],
    borderRadius: tokens.borderRadius.base,
  };
  
  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };
  
  if (isDismissed && !isUnlocked) {
    return null;
  }
  
  return (
    <div style={containerStyle}>
      <div style={overlayStyle} />
      
      {!isUnlocked && onDismiss && (
        <button
          style={dismissButtonStyle}
          onClick={handleDismiss}
          aria-label="Dismiss unlock notification"
          title="Dismiss"
        >
          ×
        </button>
      )}
      
      <div style={headerStyle}>
        <span style={iconStyle}>{config.icon}</span>
        <div>
          <h3 style={titleStyle}>{title}</h3>
          <p style={descriptionStyle}>{description}</p>
        </div>
      </div>
      
      {!isUnlocked && (
        <div>
          <p style={criteriaStyle}>
            {getCriteriaText()}
          </p>
          {progress > 0 && (
            <div style={{ marginTop: tokens.spacing[2] }}>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: tokens.colors.neutral[200],
                  borderRadius: tokens.borderRadius.full,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(progress * 100, 100)}%`,
                    height: '100%',
                    backgroundColor: config.color,
                    borderRadius: tokens.borderRadius.full,
                    transition: `width ${tokens.animation.duration.normal} ${tokens.animation.easing.out}`,
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.colors.neutral[500],
                  marginTop: tokens.spacing[1],
                  margin: 0,
                }}
              >
                {Math.round(progress * 100)}% complete
              </p>
            </div>
          )}
        </div>
      )}
      
      <div style={contentStyle}>
        {children}
      </div>
      
      <style jsx>{`
        @keyframes unlock-celebration {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default UnlockableContent;