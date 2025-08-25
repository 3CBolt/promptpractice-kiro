/**
 * HistoryView Component - Display and manage attempt history
 * Shows past attempts with scores, comparison views, and revisit functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { tokens } from '@/styles/tokens';
import {
  HistoryEntry,
  HistoryComparison,
  loadAttemptHistory,
  getHistoryPage,
  getLabHistory,
  compareAttempts,
  getImprovementTrend,
  toggleFavorite,
  addNotes,
  calculateHistoryStats,
  getStorageInfo
} from '@/lib/history';

interface HistoryViewProps {
  /** Optional lab ID to filter history */
  labId?: string;
  /** Number of entries per page */
  pageSize?: number;
  /** Show comparison features */
  showComparison?: boolean;
  /** Callback when user wants to revisit an attempt */
  onRevisit?: (entry: HistoryEntry) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({
  labId,
  pageSize = 10,
  showComparison = true,
  onRevisit
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [comparison, setComparison] = useState<HistoryComparison | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'trend' | 'comparison'>('list');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');

  // Load history data
  useEffect(() => {
    if (labId) {
      const labEntries = getLabHistory(labId);
      setHistory(labEntries);
      setTotalPages(Math.ceil(labEntries.length / pageSize));
    } else {
      const page = getHistoryPage(currentPage, pageSize);
      setHistory(page.entries);
      setTotalPages(page.totalPages);
    }
  }, [labId, currentPage, pageSize]);

  const stats = calculateHistoryStats(history);
  const storageInfo = getStorageInfo();
  const trendData = getImprovementTrend(labId, 20);

  const handleToggleFavorite = (attemptId: string) => {
    toggleFavorite(attemptId);
    // Refresh history
    const updated = loadAttemptHistory();
    setHistory(labId ? updated.filter(e => e.labId === labId) : updated);
  };

  const handleSaveNotes = (attemptId: string) => {
    addNotes(attemptId, notesText);
    setEditingNotes(null);
    setNotesText('');
    // Refresh history
    const updated = loadAttemptHistory();
    setHistory(labId ? updated.filter(e => e.labId === labId) : updated);
  };

  const handleCompareSelection = (attemptId: string) => {
    if (selectedForComparison.includes(attemptId)) {
      setSelectedForComparison(prev => prev.filter(id => id !== attemptId));
    } else if (selectedForComparison.length < 2) {
      setSelectedForComparison(prev => [...prev, attemptId]);
    }
  };

  const handleCompare = () => {
    if (selectedForComparison.length === 2) {
      const comp = compareAttempts(selectedForComparison[0], selectedForComparison[1]);
      setComparison(comp);
      setViewMode('comparison');
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return tokens.colors.success[600];
    if (score >= 6) return tokens.colors.primary[600];
    if (score >= 4) return tokens.colors.warning[600];
    return tokens.colors.error[600];
  };

  const containerStyle: React.CSSProperties = {
    fontFamily: tokens.typography.fontFamily.sans.join(', '),
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[6],
    flexWrap: 'wrap',
    gap: tokens.spacing[4],
  };

  const titleStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    margin: 0,
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: tokens.spacing[2],
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
    backgroundColor: active ? tokens.colors.primary[500] : tokens.colors.neutral[100],
    color: active ? 'white' : tokens.colors.neutral[700],
    border: 'none',
    borderRadius: tokens.borderRadius.base,
    cursor: 'pointer',
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
  });

  const statsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: tokens.spacing[4],
    marginBottom: tokens.spacing[6],
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.neutral[50],
    borderRadius: tokens.borderRadius.lg,
    border: `1px solid ${tokens.colors.neutral[200]}`,
  };

  const statItemStyle: React.CSSProperties = {
    textAlign: 'center',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary[600],
    display: 'block',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
    marginTop: tokens.spacing[1],
  };

  if (history.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{
          textAlign: 'center',
          padding: tokens.spacing[8],
          backgroundColor: tokens.colors.neutral[50],
          borderRadius: tokens.borderRadius.lg,
          border: `1px solid ${tokens.colors.neutral[200]}`,
        }}>
          <div style={{ fontSize: '3rem', marginBottom: tokens.spacing[4] }}>📊</div>
          <h3 style={{
            fontSize: tokens.typography.fontSize.xl,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.neutral[900],
            marginBottom: tokens.spacing[2],
          }}>
            No History Yet
          </h3>
          <p style={{
            color: tokens.colors.neutral[600],
            marginBottom: tokens.spacing[4],
          }}>
            Complete some lab attempts to see your progress history here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          {labId ? `${labId} History` : 'Attempt History'}
        </h2>
        
        <div style={tabsStyle}>
          <button
            style={tabStyle(viewMode === 'list')}
            onClick={() => setViewMode('list')}
          >
            📋 List
          </button>
          <button
            style={tabStyle(viewMode === 'trend')}
            onClick={() => setViewMode('trend')}
          >
            📈 Trend
          </button>
          {showComparison && (
            <button
              style={tabStyle(viewMode === 'comparison')}
              onClick={() => setViewMode('comparison')}
              disabled={selectedForComparison.length !== 2}
            >
              🔄 Compare ({selectedForComparison.length}/2)
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div style={statsStyle}>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{stats.totalAttempts}</span>
          <div style={statLabelStyle}>Total Attempts</div>
        </div>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{stats.averageScore}</span>
          <div style={statLabelStyle}>Average Score</div>
        </div>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{stats.bestScore}</span>
          <div style={statLabelStyle}>Best Score</div>
        </div>
        <div style={statItemStyle}>
          <span style={{
            ...statValueStyle,
            color: stats.improvementRate > 0 ? tokens.colors.success[600] : 
                   stats.improvementRate < 0 ? tokens.colors.error[600] : 
                   tokens.colors.neutral[600]
          }}>
            {stats.improvementRate > 0 ? '+' : ''}{stats.improvementRate}
          </span>
          <div style={statLabelStyle}>Improvement Rate</div>
        </div>
      </div>

      {/* Storage Info */}
      <div style={{
        fontSize: tokens.typography.fontSize.xs,
        color: tokens.colors.neutral[500],
        marginBottom: tokens.spacing[4],
        textAlign: 'center',
      }}>
        {storageInfo.entriesCount}/{storageInfo.maxEntries} entries stored 
        ({Math.round(storageInfo.usagePercentage)}% of limit)
      </div>

      {/* Compare Button */}
      {showComparison && selectedForComparison.length === 2 && (
        <div style={{ marginBottom: tokens.spacing[4], textAlign: 'center' }}>
          <button
            onClick={handleCompare}
            style={{
              backgroundColor: tokens.colors.primary[500],
              color: 'white',
              border: 'none',
              borderRadius: tokens.borderRadius.base,
              padding: `${tokens.spacing[3]} ${tokens.spacing[6]}`,
              fontSize: tokens.typography.fontSize.base,
              fontWeight: tokens.typography.fontWeight.medium,
              cursor: 'pointer',
            }}
          >
            Compare Selected Attempts
          </button>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing[4],
        }}>
          {history.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(entry => (
            <div
              key={entry.attemptId}
              style={{
                backgroundColor: selectedForComparison.includes(entry.attemptId) 
                  ? tokens.colors.primary[50] 
                  : tokens.colors.neutral[50],
                border: `1px solid ${
                  selectedForComparison.includes(entry.attemptId) 
                    ? tokens.colors.primary[200] 
                    : tokens.colors.neutral[200]
                }`,
                borderRadius: tokens.borderRadius.lg,
                padding: tokens.spacing[4],
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: tokens.spacing[3],
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.spacing[2],
                    marginBottom: tokens.spacing[2],
                  }}>
                    <span style={{
                      fontSize: tokens.typography.fontSize.lg,
                      fontWeight: tokens.typography.fontWeight.semibold,
                      color: getScoreColor(entry.score),
                    }}>
                      {entry.score}/10
                    </span>
                    <span style={{
                      fontSize: tokens.typography.fontSize.sm,
                      color: tokens.colors.neutral[600],
                    }}>
                      {formatDate(entry.timestamp)}
                    </span>
                    <span style={{
                      fontSize: tokens.typography.fontSize.xs,
                      backgroundColor: tokens.colors.neutral[200],
                      color: tokens.colors.neutral[700],
                      padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                      borderRadius: tokens.borderRadius.base,
                    }}>
                      {entry.labId}
                    </span>
                    {entry.favorite && (
                      <span style={{ fontSize: '1rem' }}>⭐</span>
                    )}
                  </div>
                  
                  <div style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.neutral[700],
                    marginBottom: tokens.spacing[2],
                  }}>
                    Clarity: {entry.breakdown.clarity}/5 | Completeness: {entry.breakdown.completeness}/5
                  </div>
                  
                  <div style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.neutral[600],
                    fontFamily: tokens.typography.fontFamily.mono.join(', '),
                    backgroundColor: tokens.colors.neutral[100],
                    padding: tokens.spacing[2],
                    borderRadius: tokens.borderRadius.base,
                    marginBottom: tokens.spacing[2],
                  }}>
                    {entry.userPrompt.length > 100 
                      ? `${entry.userPrompt.slice(0, 100)}...` 
                      : entry.userPrompt
                    }
                  </div>
                  
                  {entry.notes && (
                    <div style={{
                      fontSize: tokens.typography.fontSize.sm,
                      color: tokens.colors.neutral[700],
                      fontStyle: 'italic',
                      marginBottom: tokens.spacing[2],
                    }}>
                      📝 {entry.notes}
                    </div>
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: tokens.spacing[2],
                  marginLeft: tokens.spacing[4],
                }}>
                  {showComparison && (
                    <button
                      onClick={() => handleCompareSelection(entry.attemptId)}
                      style={{
                        backgroundColor: selectedForComparison.includes(entry.attemptId)
                          ? tokens.colors.primary[500]
                          : tokens.colors.neutral[200],
                        color: selectedForComparison.includes(entry.attemptId)
                          ? 'white'
                          : tokens.colors.neutral[700],
                        border: 'none',
                        borderRadius: tokens.borderRadius.base,
                        padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                        fontSize: tokens.typography.fontSize.xs,
                        cursor: 'pointer',
                      }}
                    >
                      {selectedForComparison.includes(entry.attemptId) ? '✓ Selected' : 'Select'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleToggleFavorite(entry.attemptId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      padding: tokens.spacing[1],
                    }}
                  >
                    {entry.favorite ? '⭐' : '☆'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setEditingNotes(entry.attemptId);
                      setNotesText(entry.notes || '');
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      padding: tokens.spacing[1],
                    }}
                  >
                    📝
                  </button>
                  
                  {onRevisit && (
                    <button
                      onClick={() => onRevisit(entry)}
                      style={{
                        backgroundColor: tokens.colors.primary[500],
                        color: 'white',
                        border: 'none',
                        borderRadius: tokens.borderRadius.base,
                        padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                        fontSize: tokens.typography.fontSize.xs,
                        cursor: 'pointer',
                      }}
                    >
                      Revisit
                    </button>
                  )}
                </div>
              </div>
              
              {editingNotes === entry.attemptId && (
                <div style={{
                  marginTop: tokens.spacing[3],
                  padding: tokens.spacing[3],
                  backgroundColor: tokens.colors.neutral[100],
                  borderRadius: tokens.borderRadius.base,
                }}>
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Add notes about this attempt..."
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: tokens.spacing[2],
                      border: `1px solid ${tokens.colors.neutral[300]}`,
                      borderRadius: tokens.borderRadius.base,
                      fontSize: tokens.typography.fontSize.sm,
                      fontFamily: tokens.typography.fontFamily.sans.join(', '),
                      resize: 'vertical',
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    gap: tokens.spacing[2],
                    marginTop: tokens.spacing[2],
                  }}>
                    <button
                      onClick={() => handleSaveNotes(entry.attemptId)}
                      style={{
                        backgroundColor: tokens.colors.success[500],
                        color: 'white',
                        border: 'none',
                        borderRadius: tokens.borderRadius.base,
                        padding: `${tokens.spacing[1]} ${tokens.spacing[3]}`,
                        fontSize: tokens.typography.fontSize.sm,
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotes(null);
                        setNotesText('');
                      }}
                      style={{
                        backgroundColor: tokens.colors.neutral[300],
                        color: tokens.colors.neutral[700],
                        border: 'none',
                        borderRadius: tokens.borderRadius.base,
                        padding: `${tokens.spacing[1]} ${tokens.spacing[3]}`,
                        fontSize: tokens.typography.fontSize.sm,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: tokens.spacing[2],
              marginTop: tokens.spacing[4],
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                style={{
                  backgroundColor: currentPage === 0 ? tokens.colors.neutral[200] : tokens.colors.primary[500],
                  color: currentPage === 0 ? tokens.colors.neutral[500] : 'white',
                  border: 'none',
                  borderRadius: tokens.borderRadius.base,
                  padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                  fontSize: tokens.typography.fontSize.sm,
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              
              <span style={{
                padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.neutral[600],
              }}>
                Page {currentPage + 1} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                style={{
                  backgroundColor: currentPage === totalPages - 1 ? tokens.colors.neutral[200] : tokens.colors.primary[500],
                  color: currentPage === totalPages - 1 ? tokens.colors.neutral[500] : 'white',
                  border: 'none',
                  borderRadius: tokens.borderRadius.base,
                  padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                  fontSize: tokens.typography.fontSize.sm,
                  cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {viewMode === 'trend' && (
        <div style={{
          backgroundColor: tokens.colors.neutral[50],
          border: `1px solid ${tokens.colors.neutral[200]}`,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing[6],
        }}>
          <h3 style={{
            fontSize: tokens.typography.fontSize.xl,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.neutral[900],
            marginBottom: tokens.spacing[4],
          }}>
            Improvement Trend
          </h3>
          
          {trendData.length > 1 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: tokens.spacing[4],
            }}>
              {trendData.map((point, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: 'white',
                    padding: tokens.spacing[3],
                    borderRadius: tokens.borderRadius.base,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                  }}
                >
                  <div style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.neutral[600],
                    marginBottom: tokens.spacing[1],
                  }}>
                    Attempt #{point.attemptNumber}
                  </div>
                  <div style={{
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: getScoreColor(point.score),
                    marginBottom: tokens.spacing[1],
                  }}>
                    {point.score}/10
                  </div>
                  <div style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: tokens.colors.neutral[500],
                  }}>
                    C: {point.clarity} | Comp: {point.completeness}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: tokens.colors.neutral[600] }}>
              Need at least 2 attempts to show trend data.
            </p>
          )}
        </div>
      )}

      {viewMode === 'comparison' && comparison && (
        <div style={{
          backgroundColor: tokens.colors.neutral[50],
          border: `1px solid ${tokens.colors.neutral[200]}`,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing[6],
        }}>
          <h3 style={{
            fontSize: tokens.typography.fontSize.xl,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.neutral[900],
            marginBottom: tokens.spacing[4],
          }}>
            Attempt Comparison
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: tokens.spacing[6],
          }}>
            {/* Current Attempt */}
            <div>
              <h4 style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.neutral[900],
                marginBottom: tokens.spacing[3],
              }}>
                Current ({formatDate(comparison.current.timestamp)})
              </h4>
              <div style={{
                backgroundColor: 'white',
                padding: tokens.spacing[4],
                borderRadius: tokens.borderRadius.base,
                border: `1px solid ${tokens.colors.neutral[200]}`,
              }}>
                <div style={{
                  fontSize: tokens.typography.fontSize.xl,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: getScoreColor(comparison.current.score),
                  marginBottom: tokens.spacing[2],
                }}>
                  {comparison.current.score}/10
                </div>
                <div style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: tokens.colors.neutral[600],
                  marginBottom: tokens.spacing[2],
                }}>
                  Clarity: {comparison.current.breakdown.clarity}/5<br/>
                  Completeness: {comparison.current.breakdown.completeness}/5
                </div>
                <div style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontFamily: tokens.typography.fontFamily.mono.join(', '),
                  backgroundColor: tokens.colors.neutral[100],
                  padding: tokens.spacing[2],
                  borderRadius: tokens.borderRadius.base,
                }}>
                  {comparison.current.userPrompt.slice(0, 150)}...
                </div>
              </div>
            </div>
            
            {/* Previous Attempt */}
            <div>
              <h4 style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.neutral[900],
                marginBottom: tokens.spacing[3],
              }}>
                Previous ({formatDate(comparison.previous.timestamp)})
              </h4>
              <div style={{
                backgroundColor: 'white',
                padding: tokens.spacing[4],
                borderRadius: tokens.borderRadius.base,
                border: `1px solid ${tokens.colors.neutral[200]}`,
              }}>
                <div style={{
                  fontSize: tokens.typography.fontSize.xl,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: getScoreColor(comparison.previous.score),
                  marginBottom: tokens.spacing[2],
                }}>
                  {comparison.previous.score}/10
                </div>
                <div style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: tokens.colors.neutral[600],
                  marginBottom: tokens.spacing[2],
                }}>
                  Clarity: {comparison.previous.breakdown.clarity}/5<br/>
                  Completeness: {comparison.previous.breakdown.completeness}/5
                </div>
                <div style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontFamily: tokens.typography.fontFamily.mono.join(', '),
                  backgroundColor: tokens.colors.neutral[100],
                  padding: tokens.spacing[2],
                  borderRadius: tokens.borderRadius.base,
                }}>
                  {comparison.previous.userPrompt.slice(0, 150)}...
                </div>
              </div>
            </div>
          </div>
          
          {/* Improvement Summary */}
          <div style={{
            marginTop: tokens.spacing[6],
            padding: tokens.spacing[4],
            backgroundColor: comparison.trend === 'improved' ? tokens.colors.success[50] :
                           comparison.trend === 'declined' ? tokens.colors.error[50] :
                           tokens.colors.neutral[100],
            borderRadius: tokens.borderRadius.base,
            border: `1px solid ${
              comparison.trend === 'improved' ? tokens.colors.success[200] :
              comparison.trend === 'declined' ? tokens.colors.error[200] :
              tokens.colors.neutral[200]
            }`,
          }}>
            <h4 style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: comparison.trend === 'improved' ? tokens.colors.success[700] :
                     comparison.trend === 'declined' ? tokens.colors.error[700] :
                     tokens.colors.neutral[700],
              marginBottom: tokens.spacing[2],
            }}>
              {comparison.trend === 'improved' ? '📈 Improvement!' :
               comparison.trend === 'declined' ? '📉 Decline' :
               '➡️ No Change'}
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: tokens.spacing[4],
            }}>
              <div>
                <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                  Total Score: 
                </span>
                <span style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: comparison.improvement.score > 0 ? tokens.colors.success[600] :
                         comparison.improvement.score < 0 ? tokens.colors.error[600] :
                         tokens.colors.neutral[600],
                  marginLeft: tokens.spacing[2],
                }}>
                  {comparison.improvement.score > 0 ? '+' : ''}{comparison.improvement.score}
                </span>
              </div>
              <div>
                <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                  Clarity: 
                </span>
                <span style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: comparison.improvement.clarity > 0 ? tokens.colors.success[600] :
                         comparison.improvement.clarity < 0 ? tokens.colors.error[600] :
                         tokens.colors.neutral[600],
                  marginLeft: tokens.spacing[2],
                }}>
                  {comparison.improvement.clarity > 0 ? '+' : ''}{comparison.improvement.clarity}
                </span>
              </div>
              <div>
                <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                  Completeness: 
                </span>
                <span style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: comparison.improvement.completeness > 0 ? tokens.colors.success[600] :
                         comparison.improvement.completeness < 0 ? tokens.colors.error[600] :
                         tokens.colors.neutral[600],
                  marginLeft: tokens.spacing[2],
                }}>
                  {comparison.improvement.completeness > 0 ? '+' : ''}{comparison.improvement.completeness}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;