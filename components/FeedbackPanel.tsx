'use client';

import React, { useEffect, useState } from 'react';
import { tokens } from '@/styles/tokens';
import { Evaluation, ModelResult, EvaluationFeedback, Attempt } from '@/types';
import { generateAttemptId } from '@/lib/clientUtils';
import { getPreviousScores, recordAttempt } from '@/lib/progress';
import { getRelevantExamples, StrongPromptExample } from '@/lib/examples';

interface FeedbackPanelProps {
  evaluation: Evaluation;
  attempt: Attempt;
  onResubmit: (newAttemptId: string) => void;
  className?: string;
}

interface CriterionFeedbackProps {
  criterion: 'clarity' | 'completeness';
  score: number;
  maxScore: number;
  feedback?: EvaluationFeedback;
  onGuideLink: (guideSlug: string) => void;
}

interface ProgressIndicatorProps {
  currentScore: number;
  previousScores?: number[];
  maxScore: number;
}

const CriterionFeedback: React.FC<CriterionFeedbackProps> = ({
  criterion,
  score,
  maxScore,
  feedback,
  onGuideLink
}) => {
  const percentage = (score / maxScore) * 100;
  const isGood = score >= 4;
  const isOkay = score === 3;
  
  // Determine colors based on score (using encouraging colors)
  const getScoreColor = () => {
    if (isGood) return tokens.colors.success[600];
    if (isOkay) return tokens.colors.primary[500];
    return tokens.colors.warning[600]; // Warm orange instead of red
  };

  const getScoreBackground = () => {
    if (isGood) return tokens.colors.success[50];
    if (isOkay) return tokens.colors.primary[50];
    return tokens.colors.warning[50];
  };

  // Map criterion to guide suggestions
  const getGuideLink = (criterion: string) => {
    switch (criterion) {
      case 'clarity':
        return { slug: 'fundamentals', text: 'Learn more about clarity in our Fundamentals guide' };
      case 'completeness':
        return { slug: 'fundamentals', text: 'Learn about thorough prompting in our Fundamentals guide' };
      default:
        return null;
    }
  };

  const guideLink = getGuideLink(criterion);

  return (
    <div 
      className="criterion-feedback"
      style={{
        padding: tokens.spacing[4],
        backgroundColor: getScoreBackground(),
        borderRadius: tokens.borderRadius.lg,
        border: `1px solid ${tokens.colors.border.light}`,
        marginBottom: tokens.spacing[3]
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing[2] }}>
        <h4 style={{ 
          margin: 0, 
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: tokens.typography.fontWeight.semibold,
          color: tokens.colors.text.primary,
          textTransform: 'capitalize'
        }}>
          {criterion}
        </h4>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[2]
        }}>
          <div style={{
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            color: getScoreColor()
          }}>
            {score}/{maxScore}
          </div>
          <div style={{
            width: '60px',
            height: '8px',
            backgroundColor: tokens.colors.neutral[200],
            borderRadius: tokens.borderRadius.full,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: getScoreColor(),
              transition: `width ${tokens.animation.duration.normal} ${tokens.animation.easing.out}`
            }} />
          </div>
        </div>
      </div>

      {feedback?.explanation && (
        <p style={{
          margin: `0 0 ${tokens.spacing[2]} 0`,
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.text.secondary,
          lineHeight: tokens.typography.lineHeight.relaxed
        }}>
          {feedback.explanation}
        </p>
      )}

      {feedback?.exampleFix && (
        <div style={{
          backgroundColor: tokens.colors.neutral[0],
          padding: tokens.spacing[3],
          borderRadius: tokens.borderRadius.md,
          border: `1px solid ${tokens.colors.border.light}`,
          marginBottom: tokens.spacing[2]
        }}>
          <div style={{
            fontSize: tokens.typography.fontSize.xs,
            fontWeight: tokens.typography.fontWeight.medium,
            color: tokens.colors.text.tertiary,
            marginBottom: tokens.spacing[1],
            textTransform: 'uppercase',
            letterSpacing: tokens.typography.letterSpacing.wide
          }}>
            💡 Suggestion
          </div>
          <p style={{
            margin: 0,
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.text.primary,
            fontFamily: tokens.typography.fontFamily.mono.join(', '),
            backgroundColor: tokens.colors.neutral[50],
            padding: tokens.spacing[2],
            borderRadius: tokens.borderRadius.sm,
            border: `1px solid ${tokens.colors.border.light}`
          }}>
            {feedback.exampleFix}
          </p>
        </div>
      )}

      {guideLink && (
        <button
          onClick={() => onGuideLink(guideLink.slug)}
          style={{
            background: 'none',
            border: 'none',
            color: tokens.colors.primary[600],
            fontSize: tokens.typography.fontSize.sm,
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'inherit'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = tokens.colors.primary[700];
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = tokens.colors.primary[600];
          }}
        >
          📖 {guideLink.text}
        </button>
      )}
    </div>
  );
};

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentScore,
  previousScores = [],
  maxScore
}) => {
  if (previousScores.length === 0) return null;

  const allScores = [...previousScores, currentScore];
  const improvement = currentScore - (previousScores[previousScores.length - 1] || 0);
  const hasImproved = improvement > 0;
  const hasDeclined = improvement < 0;

  return (
    <div style={{
      padding: tokens.spacing[4],
      backgroundColor: tokens.colors.background.secondary,
      borderRadius: tokens.borderRadius.lg,
      border: `1px solid ${tokens.colors.border.light}`,
      marginBottom: tokens.spacing[4]
    }}>
      <h4 style={{
        margin: `0 0 ${tokens.spacing[3]} 0`,
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.semibold,
        color: tokens.colors.text.primary
      }}>
        📈 Your Progress
      </h4>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacing[2],
        marginBottom: tokens.spacing[3]
      }}>
        {allScores.slice(-5).map((score, index) => (
          <div
            key={index}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: tokens.borderRadius.full,
              backgroundColor: index === allScores.slice(-5).length - 1 
                ? tokens.colors.primary[500] 
                : tokens.colors.neutral[300],
              color: tokens.colors.neutral[0],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium
            }}
          >
            {score}
          </div>
        ))}
      </div>

      {hasImproved && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[2],
          color: tokens.colors.success[600],
          fontSize: tokens.typography.fontSize.sm,
          fontWeight: tokens.typography.fontWeight.medium
        }}>
          <span>🎉</span>
          <span>Great improvement! +{improvement} points from your last attempt</span>
        </div>
      )}

      {hasDeclined && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[2],
          color: tokens.colors.warning[600],
          fontSize: tokens.typography.fontSize.sm,
          fontWeight: tokens.typography.fontWeight.medium
        }}>
          <span>💪</span>
          <span>Keep practicing! Every attempt helps you learn</span>
        </div>
      )}

      {!hasImproved && !hasDeclined && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[2],
          color: tokens.colors.primary[600],
          fontSize: tokens.typography.fontSize.sm,
          fontWeight: tokens.typography.fontWeight.medium
        }}>
          <span>⭐</span>
          <span>Consistent performance! Try experimenting with new techniques</span>
        </div>
      )}
    </div>
  );
};

const ExamplePrompts: React.FC<{ 
  examples: StrongPromptExample[];
  onExampleClick?: (example: StrongPromptExample) => void;
}> = ({ examples, onExampleClick }) => {
  if (examples.length === 0) return null;

  return (
    <div style={{
      padding: tokens.spacing[4],
      backgroundColor: tokens.colors.background.secondary,
      borderRadius: tokens.borderRadius.lg,
      border: `1px solid ${tokens.colors.border.light}`,
      marginBottom: tokens.spacing[4]
    }}>
      <h4 style={{
        margin: `0 0 ${tokens.spacing[3]} 0`,
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.semibold,
        color: tokens.colors.text.primary,
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacing[2]
      }}>
        <span>🌟</span>
        See Example Strong Prompts
      </h4>
      
      <p style={{
        margin: `0 0 ${tokens.spacing[4]} 0`,
        fontSize: tokens.typography.fontSize.sm,
        color: tokens.colors.text.secondary,
        lineHeight: tokens.typography.lineHeight.relaxed
      }}>
        Here are some examples of effective prompts that demonstrate good techniques:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[4] }}>
        {examples.map((example, index) => (
          <div
            key={example.id}
            style={{
              backgroundColor: tokens.colors.neutral[0],
              borderRadius: tokens.borderRadius.md,
              border: `1px solid ${tokens.colors.border.light}`,
              overflow: 'hidden'
            }}
          >
            {/* Example Header */}
            <div style={{
              padding: tokens.spacing[3],
              backgroundColor: tokens.colors.neutral[50],
              borderBottom: `1px solid ${tokens.colors.border.light}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: tokens.spacing[1]
              }}>
                <h5 style={{
                  margin: 0,
                  fontSize: tokens.typography.fontSize.base,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.colors.text.primary
                }}>
                  {example.title}
                </h5>
                <span style={{
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.medium,
                  color: tokens.colors.text.tertiary,
                  backgroundColor: tokens.colors.primary[100],
                  padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                  borderRadius: tokens.borderRadius.full,
                  textTransform: 'uppercase',
                  letterSpacing: tokens.typography.letterSpacing.wide
                }}>
                  {example.category}
                </span>
              </div>
            </div>

            {/* Example Prompt */}
            <div style={{ padding: tokens.spacing[3] }}>
              <div style={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.medium,
                color: tokens.colors.text.tertiary,
                marginBottom: tokens.spacing[2],
                textTransform: 'uppercase',
                letterSpacing: tokens.typography.letterSpacing.wide
              }}>
                Example Prompt
              </div>
              <div style={{
                backgroundColor: tokens.colors.neutral[50],
                padding: tokens.spacing[3],
                borderRadius: tokens.borderRadius.sm,
                border: `1px solid ${tokens.colors.border.light}`,
                marginBottom: tokens.spacing[3]
              }}>
                <p style={{
                  margin: 0,
                  fontSize: tokens.typography.fontSize.sm,
                  color: tokens.colors.text.primary,
                  fontFamily: tokens.typography.fontFamily.mono.join(', '),
                  lineHeight: tokens.typography.lineHeight.relaxed,
                  whiteSpace: 'pre-wrap'
                }}>
                  "{example.prompt}"
                </p>
              </div>

              {/* Why It Works */}
              <div style={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.medium,
                color: tokens.colors.text.tertiary,
                marginBottom: tokens.spacing[2],
                textTransform: 'uppercase',
                letterSpacing: tokens.typography.letterSpacing.wide
              }}>
                Why This Works
              </div>
              <p style={{
                margin: `0 0 ${tokens.spacing[3]} 0`,
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.text.secondary,
                lineHeight: tokens.typography.lineHeight.relaxed
              }}>
                {example.explanation}
              </p>

              {/* Key Techniques */}
              <div style={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.medium,
                color: tokens.colors.text.tertiary,
                marginBottom: tokens.spacing[2],
                textTransform: 'uppercase',
                letterSpacing: tokens.typography.letterSpacing.wide
              }}>
                Key Techniques Used
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: tokens.spacing[2],
                marginBottom: tokens.spacing[3]
              }}>
                {example.techniques.map((technique, techIndex) => (
                  <span
                    key={techIndex}
                    style={{
                      fontSize: tokens.typography.fontSize.xs,
                      color: tokens.colors.primary[700],
                      backgroundColor: tokens.colors.primary[50],
                      padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                      borderRadius: tokens.borderRadius.sm,
                      border: `1px solid ${tokens.colors.primary[200]}`
                    }}
                  >
                    • {technique}
                  </span>
                ))}
              </div>

              {/* Try This Button */}
              {onExampleClick && (
                <button
                  onClick={() => onExampleClick(example)}
                  style={{
                    backgroundColor: tokens.colors.primary[600],
                    color: tokens.colors.neutral[0],
                    border: 'none',
                    borderRadius: tokens.borderRadius.md,
                    padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    cursor: 'pointer',
                    transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.out}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.spacing[2]
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = tokens.colors.primary[700];
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = tokens.colors.primary[600];
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                    e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                  }}
                >
                  <span>🚀</span>
                  Try This Style
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WhatWentWell: React.FC<{ results: ModelResult[] }> = ({ results }) => {
  const positiveAspects: string[] = [];

  results.forEach(result => {
    if (result.scores) {
      if (result.scores.clarity >= 4) {
        positiveAspects.push('Your prompt produced clear, well-structured responses');
      }
      if (result.scores.completeness >= 4) {
        positiveAspects.push('The responses thoroughly addressed your prompt');
      }
      if (result.scores.total >= 8) {
        positiveAspects.push('Excellent overall prompt quality!');
      }
    }
  });

  // Add some general positive observations
  if (positiveAspects.length === 0) {
    positiveAspects.push('You\'re actively practicing and learning prompt engineering');
    positiveAspects.push('Each attempt helps you understand how models respond');
  }

  if (positiveAspects.length === 0) return null;

  return (
    <div style={{
      padding: tokens.spacing[4],
      backgroundColor: tokens.colors.success[50],
      borderRadius: tokens.borderRadius.lg,
      border: `1px solid ${tokens.colors.success[200]}`,
      marginBottom: tokens.spacing[4]
    }}>
      <h4 style={{
        margin: `0 0 ${tokens.spacing[3]} 0`,
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.semibold,
        color: tokens.colors.success[800],
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacing[2]
      }}>
        <span>✨</span>
        What Went Well
      </h4>
      <ul style={{
        margin: 0,
        paddingLeft: tokens.spacing[5],
        color: tokens.colors.success[700]
      }}>
        {positiveAspects.map((aspect, index) => (
          <li key={index} style={{
            marginBottom: tokens.spacing[1],
            fontSize: tokens.typography.fontSize.sm,
            lineHeight: tokens.typography.lineHeight.relaxed
          }}>
            {aspect}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  evaluation,
  attempt,
  onResubmit,
  className = ''
}) => {
  const [previousScores, setPreviousScores] = useState<number[]>([]);
  const [relevantExamples, setRelevantExamples] = useState<StrongPromptExample[]>([]);

  useEffect(() => {
    // Record this attempt in progress tracking
    if (evaluation.status === 'success' && evaluation.results) {
      recordAttempt(attempt, evaluation);
    }

    // Get previous scores for progress indication
    const scores = getPreviousScores(attempt.labId, 5);
    setPreviousScores(scores);

    // Get relevant examples based on feedback
    if (evaluation.results && evaluation.results.length > 0) {
      const bestResult = evaluation.results.reduce((best, current) => 
        (current.scores?.total || 0) > (best.scores?.total || 0) ? current : best
      );
      
      if (bestResult.scores) {
        const examples = getRelevantExamples(
          bestResult.scores.clarity,
          bestResult.scores.completeness,
          attempt.userPrompt,
          2 // Show up to 2 examples
        );
        setRelevantExamples(examples);
      }
    }
  }, [evaluation, attempt]);

  const handleGuideLink = (guideSlug: string) => {
    // Navigate to guide
    window.location.href = `/guides/${guideSlug}`;
  };

  const handleResubmit = () => {
    const newAttemptId = generateAttemptId();
    onResubmit(newAttemptId);
  };

  if (!evaluation.results || evaluation.results.length === 0) {
    return (
      <div className={className} style={{
        padding: tokens.spacing[6],
        textAlign: 'center',
        color: tokens.colors.text.secondary
      }}>
        <p>No feedback available yet. Please try submitting your prompt.</p>
      </div>
    );
  }

  // Get the best result for overall feedback
  const bestResult = evaluation.results.reduce((best, current) => 
    (current.scores?.total || 0) > (best.scores?.total || 0) ? current : best
  );

  const overallScore = bestResult.scores?.total || 0;
  const maxScore = 10;

  return (
    <div className={className} style={{
      padding: tokens.mobile.padding.md,
      backgroundColor: tokens.colors.background.primary,
      borderRadius: tokens.borderRadius.xl,
      border: `1px solid ${tokens.colors.border.light}`,
      boxShadow: tokens.boxShadow.lg,
      width: '100%',
      maxWidth: '100%',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: tokens.spacing[6],
        textAlign: 'center'
      }}>
        <h3 style={{
          margin: `0 0 ${tokens.spacing[2]} 0`,
          fontSize: tokens.typography.fontSize['2xl'],
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.text.primary
        }}>
          📝 Feedback & Suggestions
        </h3>
        <div style={{
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: tokens.typography.fontWeight.semibold,
          color: overallScore >= 8 ? tokens.colors.success[600] : 
                overallScore >= 6 ? tokens.colors.primary[600] : 
                tokens.colors.warning[600]
        }}>
          Overall Score: {overallScore}/{maxScore}
        </div>
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator 
        currentScore={overallScore}
        previousScores={previousScores}
        maxScore={maxScore}
      />

      {/* What Went Well */}
      <WhatWentWell results={evaluation.results} />

      {/* Criterion Feedback */}
      <div style={{ marginBottom: tokens.spacing[6] }}>
        <h4 style={{
          margin: `0 0 ${tokens.spacing[4]} 0`,
          fontSize: tokens.typography.fontSize.xl,
          fontWeight: tokens.typography.fontWeight.semibold,
          color: tokens.colors.text.primary
        }}>
          Detailed Feedback
        </h4>

        {bestResult.scores && (
          <>
            <CriterionFeedback
              criterion="clarity"
              score={bestResult.scores.clarity}
              maxScore={5}
              feedback={bestResult.feedback}
              onGuideLink={handleGuideLink}
            />
            <CriterionFeedback
              criterion="completeness"
              score={bestResult.scores.completeness}
              maxScore={5}
              feedback={bestResult.feedback}
              onGuideLink={handleGuideLink}
            />
          </>
        )}
      </div>

      {/* Example Strong Prompts */}
      <ExamplePrompts 
        examples={relevantExamples}
        onExampleClick={(example) => {
          // Copy example prompt to clipboard and show notification
          navigator.clipboard.writeText(example.prompt).then(() => {
            // Could add a toast notification here in the future
            console.log('Example prompt copied to clipboard');
          }).catch(() => {
            // Fallback for browsers that don't support clipboard API
            console.log('Could not copy to clipboard');
          });
        }}
      />

      {/* General Improvement Tips */}
      <div style={{
        padding: tokens.spacing[4],
        backgroundColor: tokens.colors.primary[50],
        borderRadius: tokens.borderRadius.lg,
        border: `1px solid ${tokens.colors.primary[200]}`,
        marginBottom: tokens.spacing[6]
      }}>
        <h4 style={{
          margin: `0 0 ${tokens.spacing[2]} 0`,
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: tokens.typography.fontWeight.semibold,
          color: tokens.colors.primary[800]
        }}>
          💡 General Tips
        </h4>
        <ul style={{
          margin: 0,
          paddingLeft: tokens.spacing[5],
          color: tokens.colors.primary[700]
        }}>
          <li style={{ marginBottom: tokens.spacing[1], fontSize: tokens.typography.fontSize.sm }}>
            Be specific about what you want the AI to do
          </li>
          <li style={{ marginBottom: tokens.spacing[1], fontSize: tokens.typography.fontSize.sm }}>
            Provide context and examples when helpful
          </li>
          <li style={{ marginBottom: tokens.spacing[1], fontSize: tokens.typography.fontSize.sm }}>
            Break complex requests into smaller steps
          </li>
          <li style={{ fontSize: tokens.typography.fontSize.sm }}>
            Experiment with different phrasings and approaches
          </li>
        </ul>
      </div>

      {/* Resubmit Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleResubmit}
          style={{
            backgroundColor: tokens.colors.primary[600],
            color: tokens.colors.neutral[0],
            border: 'none',
            borderRadius: tokens.borderRadius.lg,
            padding: `${tokens.spacing[3]} ${tokens.spacing[6]}`,
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.semibold,
            cursor: 'pointer',
            transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.out}`,
            boxShadow: tokens.boxShadow.sm
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = tokens.colors.primary[700];
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = tokens.boxShadow.md;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = tokens.colors.primary[600];
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = tokens.boxShadow.sm;
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
            e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        >
          🔄 Try Again with New Prompt
        </button>
      </div>
    </div>
  );
};

export default FeedbackPanel;