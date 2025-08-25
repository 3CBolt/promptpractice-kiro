// Results display component for single and side-by-side layouts
import { ModelResult, Evaluation } from '@/types';
import { getSourceBadge } from '@/lib/models/providers';
import { tokens } from '@/styles/tokens';
import ScoreBadge from './ScoreBadge';

interface ResultsCardsProps {
  results: ModelResult[];
  evaluations?: ModelResult[];
  layout: 'single' | 'side-by-side';
  loading?: boolean;
  error?: string;
}

export default function ResultsCards({
  results,
  evaluations,
  layout,
  loading = false,
  error
}: ResultsCardsProps) {
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing[8],
        backgroundColor: tokens.colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        border: `1px solid ${tokens.colors.border.light}`,
      }}>
        <div style={{
          width: tokens.spacing[8],
          height: tokens.spacing[8],
          border: `2px solid ${tokens.colors.neutral[200]}`,
          borderTop: `2px solid ${tokens.colors.primary[600]}`,
          borderRadius: tokens.borderRadius.full,
          animation: 'spin 1s linear infinite',
          marginBottom: tokens.spacing[4],
        }}></div>
        <p style={{
          color: tokens.colors.text.secondary,
          fontSize: tokens.typography.fontSize.sm,
          fontWeight: tokens.typography.fontWeight.medium,
        }}>Evaluating responses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing[8],
        backgroundColor: tokens.colors.error[50],
        borderRadius: tokens.borderRadius.lg,
        border: `1px solid ${tokens.colors.error[200]}`,
      }}>
        <div style={{
          fontSize: tokens.typography.fontSize['2xl'],
          marginBottom: tokens.spacing[4],
        }}>⚠️</div>
        <h3 style={{
          color: tokens.colors.error[800],
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: tokens.typography.fontWeight.semibold,
          marginBottom: tokens.spacing[2],
        }}>Evaluation Failed</h3>
        <p style={{
          color: tokens.colors.error[700],
          fontSize: tokens.typography.fontSize.sm,
          textAlign: 'center',
          marginBottom: tokens.spacing[4],
        }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: tokens.colors.error[600],
            color: tokens.colors.text.inverse,
            padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
            borderRadius: tokens.borderRadius.md,
            border: 'none',
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            cursor: 'pointer',
            transition: `background-color ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tokens.colors.error[700]}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = tokens.colors.error[600]}
          onFocus={(e) => {
            e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
            e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
          }}
          onBlur={(e) => e.currentTarget.style.outline = 'none'}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing[8],
        backgroundColor: tokens.colors.background.secondary,
        borderRadius: tokens.borderRadius.lg,
        border: `1px solid ${tokens.colors.border.light}`,
      }}>
        <p style={{
          color: tokens.colors.text.tertiary,
          fontSize: tokens.typography.fontSize.sm,
        }}>No results to display</p>
      </div>
    );
  }

  const getEvaluationForModel = (modelId: string) => {
    return evaluations?.find(evaluation => evaluation.modelId === modelId);
  };

  const formatLatency = (latencyMs: number) => {
    if (latencyMs < 1000) {
      return `${latencyMs}ms`;
    }
    return `${(latencyMs / 1000).toFixed(1)}s`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing[6],
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: tokens.spacing[4],
        borderBottom: `1px solid ${tokens.colors.border.light}`,
      }}>
        <h3 style={{
          color: tokens.colors.text.primary,
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: tokens.typography.fontWeight.semibold,
          margin: 0,
        }}>Results</h3>
        <span style={{
          color: tokens.colors.text.tertiary,
          fontSize: tokens.typography.fontSize.sm,
          backgroundColor: tokens.colors.background.tertiary,
          padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
          borderRadius: tokens.borderRadius.base,
        }}>
          {results.length} model{results.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div style={{
        display: 'grid',
        gap: tokens.spacing[4],
        gridTemplateColumns: layout === 'side-by-side' && results.length > 1 
          ? `repeat(${Math.min(results.length, 2)}, 1fr)` 
          : '1fr',
      }}>
        {results.map((result, index) => {
          const evaluation = getEvaluationForModel(result.modelId);
          
          return (
            <div 
              key={`${result.modelId}-${index}`} 
              style={{
                backgroundColor: tokens.colors.background.primary,
                border: `1px solid ${tokens.colors.border.light}`,
                borderRadius: tokens.borderRadius.lg,
                padding: tokens.spacing[6],
                boxShadow: tokens.boxShadow.sm,
                transition: `box-shadow ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = tokens.boxShadow.md}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = tokens.boxShadow.sm}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: tokens.spacing[4],
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing[3],
                }}>
                  <h4 style={{
                    color: tokens.colors.text.primary,
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    margin: 0,
                  }}>{result.modelId}</h4>
                  <span style={{
                    backgroundColor: tokens.colors.status[result.source]?.bg || tokens.colors.neutral[100],
                    color: tokens.colors.status[result.source]?.text || tokens.colors.neutral[700],
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.borderRadius.base,
                    fontSize: tokens.typography.fontSize.xs,
                    fontWeight: tokens.typography.fontWeight.medium,
                  }}>
                    {getSourceBadge(result)}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing[3],
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.colors.text.tertiary,
                }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.spacing[1],
                  }}>
                    ⏱️ {formatLatency(result.latency)}
                  </span>
                  {result.tokenCount && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokens.spacing[1],
                    }}>
                      📝 {result.tokenCount} tokens
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{
                marginBottom: tokens.spacing[4],
              }}>
                <div style={{
                  color: tokens.colors.text.primary,
                  fontSize: tokens.typography.fontSize.sm,
                  lineHeight: tokens.typography.lineHeight.relaxed,
                  backgroundColor: tokens.colors.background.secondary,
                  padding: tokens.spacing[4],
                  borderRadius: tokens.borderRadius.md,
                  border: `1px solid ${tokens.colors.border.light}`,
                  whiteSpace: 'pre-wrap',
                }}>
                  {result.response}
                </div>
              </div>
              
              {result.scores?.total !== undefined && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingTop: tokens.spacing[4],
                  borderTop: `1px solid ${tokens.colors.border.light}`,
                }}>
                  <ScoreBadge
                    score={result.scores.total}
                    breakdown={{ clarity: result.scores.clarity, completeness: result.scores.completeness }}
                    notes={result.feedback?.explanation}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {layout === 'side-by-side' && results.length > 1 && (
        <div style={{
          backgroundColor: tokens.colors.background.secondary,
          border: `1px solid ${tokens.colors.border.light}`,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing[6],
        }}>
          <h4 style={{
            color: tokens.colors.text.primary,
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.semibold,
            marginBottom: tokens.spacing[4],
          }}>Quick Comparison</h4>
          <div style={{
            display: 'flex',
            gap: tokens.spacing[6],
            flexWrap: 'wrap',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[2],
            }}>
              <span style={{
                color: tokens.colors.text.secondary,
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.medium,
              }}>Fastest:</span>
              <span style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.semibold,
                backgroundColor: tokens.colors.success[100],
                color: tokens.colors.success[800],
                padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                borderRadius: tokens.borderRadius.base,
              }}>
                {results.reduce((fastest, current) => 
                  current.latency < fastest.latency ? current : fastest
                ).modelId}
              </span>
            </div>
            
            {results.some(r => r.scores?.total !== undefined) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing[2],
              }}>
                <span style={{
                  color: tokens.colors.text.secondary,
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                }}>Highest Score:</span>
                <span style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  backgroundColor: tokens.colors.primary[100],
                  color: tokens.colors.primary[800],
                  padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                  borderRadius: tokens.borderRadius.base,
                }}>
                  {results.reduce((highest, current) => 
                    (current.scores?.total || 0) > (highest.scores?.total || 0) ? current : highest
                  ).modelId}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}