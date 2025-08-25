'use client';

// Score display component with breakdown tooltips
import { useState, useRef } from 'react';
import { tokens } from '@/styles/tokens';
import { createAccessibilityId } from '@/lib/accessibility';

interface ScoreBadgeProps {
  score: number;
  breakdown: { clarity: number; completeness: number };
  notes?: string;
  size?: 'small' | 'medium' | 'large';
  'aria-label'?: string;
}

export default function ScoreBadge({
  score,
  breakdown,
  notes,
  size = 'medium',
  'aria-label': ariaLabel
}: ScoreBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipId] = useState(() => createAccessibilityId('score-tooltip'));
  const badgeRef = useRef<HTMLDivElement>(null);
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'excellent';
    if (score >= 6) return 'good';
    if (score >= 4) return 'fair';
    return 'poor';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Work';
  };

  const formatScore = (score: number) => {
    return score.toFixed(1);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setShowTooltip(!showTooltip);
    } else if (event.key === 'Escape') {
      setShowTooltip(false);
    }
  };

  const scoreColorClass = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const formattedScore = formatScore(score);

  return (
    <div 
      ref={badgeRef}
      className={`score-badge ${size} ${scoreColorClass}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel || `Score: ${formattedScore} out of 10, ${scoreLabel}. Press Enter for detailed breakdown.`}
      aria-describedby={showTooltip ? tooltipId : undefined}
      aria-expanded={showTooltip}
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: size === 'small' ? `${tokens.spacing[1]} ${tokens.spacing[2]}` :
                 size === 'large' ? `${tokens.spacing[3]} ${tokens.spacing[4]}` :
                 `${tokens.spacing[2]} ${tokens.spacing[3]}`,
        borderRadius: tokens.borderRadius.lg,
        cursor: 'pointer',
        transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
        outline: 'none',
      }}
      onFocusCapture={(e) => {
        e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
        e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
      }}
      onBlurCapture={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      <div className="score-display">
        <span className="score-number">{formatScore(score)}</span>
        <span className="score-total">/10</span>
      </div>
      
      <div className="score-label">
        {getScoreLabel(score)}
      </div>
      
      {showTooltip && (
        <div 
          id={tooltipId}
          className="score-tooltip"
          role="tooltip"
          aria-live="polite"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: tokens.colors.neutral[900],
            color: tokens.colors.text.inverse,
            padding: tokens.spacing[4],
            borderRadius: tokens.borderRadius.lg,
            boxShadow: tokens.boxShadow['2xl'],
            zIndex: tokens.zIndex.tooltip,
            minWidth: '250px',
            marginBottom: tokens.spacing[2],
          }}
        >
          <div className="tooltip-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: tokens.spacing[3],
            paddingBottom: tokens.spacing[2],
            borderBottom: `1px solid ${tokens.colors.neutral[700]}`,
          }}>
            <h4 style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              margin: 0,
            }}>Score Breakdown</h4>
            <span className="total-score" style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.warning[400],
            }}>{formattedScore}/10</span>
          </div>
          
          <div className="breakdown-metrics" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing[2],
            marginBottom: notes ? tokens.spacing[3] : 0,
          }}>
            <div className="metric-row" style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[2],
              fontSize: tokens.typography.fontSize.xs,
            }}>
              <span className="metric-name" style={{
                minWidth: '80px',
                fontWeight: tokens.typography.fontWeight.medium,
              }}>Clarity:</span>
              <div className="metric-bar" style={{
                flex: 1,
                height: '6px',
                background: tokens.colors.neutral[700],
                borderRadius: tokens.borderRadius.sm,
                overflow: 'hidden',
              }}>
                <div 
                  className="metric-fill clarity"
                  style={{ 
                    width: `${(breakdown.clarity / 5) * 100}%`,
                    height: '100%',
                    background: tokens.colors.primary[500],
                    borderRadius: tokens.borderRadius.sm,
                    transition: `width ${tokens.animation.duration.normal} ${tokens.animation.easing.out}`,
                  }}
                  role="progressbar"
                  aria-valuenow={breakdown.clarity}
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-label={`Clarity score: ${formatScore(breakdown.clarity)} out of 5`}
                ></div>
              </div>
              <span className="metric-score" style={{
                minWidth: '30px',
                textAlign: 'right',
                fontWeight: tokens.typography.fontWeight.semibold,
              }}>{formatScore(breakdown.clarity)}/5</span>
            </div>
            
            <div className="metric-row" style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[2],
              fontSize: tokens.typography.fontSize.xs,
            }}>
              <span className="metric-name" style={{
                minWidth: '80px',
                fontWeight: tokens.typography.fontWeight.medium,
              }}>Completeness:</span>
              <div className="metric-bar" style={{
                flex: 1,
                height: '6px',
                background: tokens.colors.neutral[700],
                borderRadius: tokens.borderRadius.sm,
                overflow: 'hidden',
              }}>
                <div 
                  className="metric-fill completeness"
                  style={{ 
                    width: `${(breakdown.completeness / 5) * 100}%`,
                    height: '100%',
                    background: tokens.colors.success[500],
                    borderRadius: tokens.borderRadius.sm,
                    transition: `width ${tokens.animation.duration.normal} ${tokens.animation.easing.out}`,
                  }}
                  role="progressbar"
                  aria-valuenow={breakdown.completeness}
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-label={`Completeness score: ${formatScore(breakdown.completeness)} out of 5`}
                ></div>
              </div>
              <span className="metric-score" style={{
                minWidth: '30px',
                textAlign: 'right',
                fontWeight: tokens.typography.fontWeight.semibold,
              }}>{formatScore(breakdown.completeness)}/5</span>
            </div>
          </div>
          
          {notes && (
            <div className="improvement-notes" style={{
              borderTop: `1px solid ${tokens.colors.neutral[700]}`,
              paddingTop: tokens.spacing[3],
            }}>
              <h5 style={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.semibold,
                marginBottom: tokens.spacing[2],
                color: tokens.colors.warning[400],
              }}>Improvement Suggestions:</h5>
              <p style={{
                fontSize: tokens.typography.fontSize.xs,
                lineHeight: tokens.typography.lineHeight.relaxed,
                margin: 0,
              }}>{notes}</p>
            </div>
          )}
          
          <div className="tooltip-arrow" style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${tokens.colors.neutral[900]}`,
          }}></div>
        </div>
      )}
    </div>
  );
}