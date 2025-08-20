'use client';

// Score display component with breakdown tooltips
import { useState } from 'react';

interface ScoreBadgeProps {
  score: number;
  breakdown: { clarity: number; completeness: number };
  notes?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function ScoreBadge({
  score,
  breakdown,
  notes,
  size = 'medium'
}: ScoreBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
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

  return (
    <div 
      className={`score-badge ${size} ${getScoreColor(score)}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="score-display">
        <span className="score-number">{formatScore(score)}</span>
        <span className="score-total">/10</span>
      </div>
      
      <div className="score-label">
        {getScoreLabel(score)}
      </div>
      
      {showTooltip && (
        <div className="score-tooltip">
          <div className="tooltip-header">
            <h4>Score Breakdown</h4>
            <span className="total-score">{formatScore(score)}/10</span>
          </div>
          
          <div className="breakdown-metrics">
            <div className="metric-row">
              <span className="metric-name">Clarity:</span>
              <div className="metric-bar">
                <div 
                  className="metric-fill clarity"
                  style={{ width: `${(breakdown.clarity / 5) * 100}%` }}
                ></div>
              </div>
              <span className="metric-score">{formatScore(breakdown.clarity)}/5</span>
            </div>
            
            <div className="metric-row">
              <span className="metric-name">Completeness:</span>
              <div className="metric-bar">
                <div 
                  className="metric-fill completeness"
                  style={{ width: `${(breakdown.completeness / 5) * 100}%` }}
                ></div>
              </div>
              <span className="metric-score">{formatScore(breakdown.completeness)}/5</span>
            </div>
          </div>
          
          {notes && (
            <div className="improvement-notes">
              <h5>Improvement Suggestions:</h5>
              <p>{notes}</p>
            </div>
          )}
          
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </div>
  );
}