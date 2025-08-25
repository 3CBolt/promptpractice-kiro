/**
 * Progress Page - Comprehensive progress tracking with motivation mechanics
 * 
 * Features:
 * - Visual progress bars for guide completion and lab mastery
 * - Progress calculation based on guide reading time, lab submissions, and improvement
 * - Unlockable example prompts after completing related guides and labs
 * - Optional streak badges for consecutive days of practice (dismissible)
 * - Learning journey with "Next recommended" suggestions
 * - Celebration moments for milestones
 * - Learning analytics: time spent, concepts mastered, areas for improvement
 */

'use client';

import React, { useState, useEffect } from 'react';

// Force dynamic rendering to avoid localStorage issues during build
export const dynamic = 'force-dynamic';
import { tokens } from '@/styles/tokens';
import ProgressBar from '@/components/ProgressBar';
import UnlockableContent from '@/components/UnlockableContent';
import HistoryView from '@/components/HistoryView';
import {
  loadProgressData,
  calculateProgressMetrics,
  getUnlockableExamples,
  calculateLearningVelocity,
  getPersonalizedRecommendations,
  trackGuideProgress,
  type ProgressMetrics,
  type LearningMilestone,
  type AttemptHistory,
} from '@/lib/progress';
import { addToHistory, type HistoryEntry } from '@/lib/history';

interface GuideProgress {
  id: string;
  title: string;
  timeSpent: number;
  completed: boolean;
  lastVisited?: string;
}

interface StreakPreferences {
  showStreaks: boolean;
  showBadges: boolean;
  showCelebrations: boolean;
}

const ProgressPage: React.FC = () => {
  const [progressData, setProgressData] = useState<{
    history: AttemptHistory[];
    milestones: LearningMilestone[];
  }>({ history: [], milestones: [] });
  
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [guideProgress, setGuideProgress] = useState<GuideProgress[]>([]);
  const [streakPrefs, setStreakPrefs] = useState<StreakPreferences>({
    showStreaks: true,
    showBadges: true,
    showCelebrations: true,
  });
  const [showMilestoneModal, setShowMilestoneModal] = useState<LearningMilestone | null>(null);
  const [dismissedMilestones, setDismissedMilestones] = useState<Set<string>>(new Set());

  // Load progress data on mount
  useEffect(() => {
    const data = loadProgressData();
    setProgressData(data);
    setMetrics(calculateProgressMetrics(data.history));
    
    // Load guide progress
    const guides = [
      { id: 'fundamentals', title: 'Fundamentals' },
      { id: 'chain-of-thought', title: 'Chain of Thought' },
      { id: 'chaining', title: 'Chaining' },
      { id: 'system-prompts', title: 'System Prompts' },
      { id: 'prompt-injection', title: 'Prompt Injection' },
    ];
    
    const guideProgressData = guides.map(guide => {
      try {
        const stored = localStorage.getItem(`guide-progress-${guide.id}`);
        const data = stored ? JSON.parse(stored) : { timeSpent: 0, completed: false };
        return {
          id: guide.id,
          title: guide.title,
          timeSpent: data.timeSpent || 0,
          completed: data.completed || false,
          lastVisited: data.lastVisited,
        };
      } catch {
        return {
          id: guide.id,
          title: guide.title,
          timeSpent: 0,
          completed: false,
        };
      }
    });
    
    setGuideProgress(guideProgressData);
    
    // Load preferences
    try {
      const prefs = localStorage.getItem('streak-preferences');
      if (prefs) {
        setStreakPrefs(JSON.parse(prefs));
      }
    } catch {
      // Use defaults
    }
    
    // Load dismissed milestones
    try {
      const dismissed = localStorage.getItem('dismissed-milestones');
      if (dismissed) {
        setDismissedMilestones(new Set(JSON.parse(dismissed)));
      }
    } catch {
      // Use defaults
    }
  }, []);

  // Check for new milestone achievements
  useEffect(() => {
    if (!metrics || !progressData.milestones.length) return;
    
    const newlyAchieved = progressData.milestones.find(
      milestone => milestone.achieved && 
      milestone.achievedDate && 
      !dismissedMilestones.has(milestone.id) &&
      new Date(milestone.achievedDate).getTime() > Date.now() - 5000 // Within last 5 seconds
    );
    
    if (newlyAchieved && streakPrefs.showCelebrations) {
      setShowMilestoneModal(newlyAchieved);
    }
  }, [progressData.milestones, dismissedMilestones, streakPrefs.showCelebrations, metrics]);

  const saveStreakPreferences = (prefs: StreakPreferences) => {
    setStreakPrefs(prefs);
    try {
      localStorage.setItem('streak-preferences', JSON.stringify(prefs));
    } catch {
      // Ignore storage errors
    }
  };

  const dismissMilestone = (milestoneId: string) => {
    const newDismissed = new Set(dismissedMilestones);
    newDismissed.add(milestoneId);
    setDismissedMilestones(newDismissed);
    
    try {
      localStorage.setItem('dismissed-milestones', JSON.stringify(Array.from(newDismissed)));
    } catch {
      // Ignore storage errors
    }
    
    if (showMilestoneModal?.id === milestoneId) {
      setShowMilestoneModal(null);
    }
  };

  const unlockableExamples = getUnlockableExamples();
  const learningVelocity = metrics ? calculateLearningVelocity(progressData.history) : null;
  const recommendations = metrics ? getPersonalizedRecommendations(progressData.history) : [];

  // Calculate overall completion percentage
  const totalGuides = guideProgress.length;
  const completedGuides = guideProgress.filter(g => g.completed).length;
  const guideCompletionRate = totalGuides > 0 ? completedGuides / totalGuides : 0;

  const totalLabs = 2; // practice-basics and compare-basics
  const labsWithAttempts = metrics ? Object.keys(metrics.labProgress).length : 0;
  const labCompletionRate = labsWithAttempts / totalLabs;

  const overallProgress = (guideCompletionRate + labCompletionRate) / 2;

  const pageStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: tokens.mobile.padding.md,
    fontFamily: tokens.typography.fontFamily.sans.join(', '),
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: tokens.spacing[8],
    textAlign: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize['3xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing[2],
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.lg,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing[4],
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacing[6],
    marginBottom: tokens.spacing[8],
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.neutral[50],
    border: `1px solid ${tokens.colors.neutral[200]}`,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing[6],
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing[4],
  };

  const statStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[3],
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
  };

  if (!metrics) {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Your Learning Progress</h1>
          <p style={subtitleStyle}>Start practicing to see your progress!</p>
        </div>
        
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Get Started</h2>
          <p style={{ color: tokens.colors.neutral[600], marginBottom: tokens.spacing[4] }}>
            Complete your first lab attempt to begin tracking your progress and unlocking achievements.
          </p>
          <a
            href="/labs/practice-basics"
            style={{
              display: 'inline-block',
              backgroundColor: tokens.colors.primary[500],
              color: 'white',
              padding: `${tokens.spacing[3]} ${tokens.spacing[6]}`,
              borderRadius: tokens.borderRadius.base,
              textDecoration: 'none',
              fontWeight: tokens.typography.fontWeight.medium,
            }}
          >
            Start Practicing
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Your Learning Progress</h1>
        <p style={subtitleStyle}>
          Track your journey and unlock new achievements as you master prompt engineering
        </p>
        
        {/* Overall Progress */}
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <ProgressBar
            value={overallProgress}
            max={1}
            variant="primary"
            size="lg"
            label="Overall Progress"
            showPercentage
            animated
          />
          <p style={{ 
            fontSize: tokens.typography.fontSize.sm, 
            color: tokens.colors.neutral[600],
            marginTop: tokens.spacing[2],
          }}>
            {Math.round(overallProgress * 100)}% Complete
          </p>
        </div>
      </div>

      {/* Milestone Celebration Modal */}
      {showMilestoneModal && streakPrefs.showCelebrations && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowMilestoneModal(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: tokens.borderRadius.lg,
              padding: tokens.spacing[8],
              maxWidth: '400px',
              textAlign: 'center',
              animation: 'celebration-bounce 0.6s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '4rem', marginBottom: tokens.spacing[4] }}>🎉</div>
            <h2 style={{
              fontSize: tokens.typography.fontSize['2xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.primary[600],
              marginBottom: tokens.spacing[2],
            }}>
              Achievement Unlocked!
            </h2>
            <h3 style={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.semibold,
              marginBottom: tokens.spacing[2],
            }}>
              {showMilestoneModal.title}
            </h3>
            <p style={{
              color: tokens.colors.neutral[600],
              marginBottom: tokens.spacing[6],
            }}>
              {showMilestoneModal.description}
            </p>
            <button
              onClick={() => dismissMilestone(showMilestoneModal.id)}
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
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div style={gridStyle}>
        {/* Learning Statistics */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>📊 Learning Statistics</h2>
          
          <div style={statStyle}>
            <span style={statLabelStyle}>Total Attempts</span>
            <span style={statValueStyle}>{metrics.totalAttempts}</span>
          </div>
          
          <div style={statStyle}>
            <span style={statLabelStyle}>Average Score</span>
            <span style={statValueStyle}>{metrics.averageScore}/10</span>
          </div>
          
          <div style={statStyle}>
            <span style={statLabelStyle}>Best Score</span>
            <span style={statValueStyle}>{metrics.bestScore}/10</span>
          </div>
          
          <div style={statStyle}>
            <span style={statLabelStyle}>Improvement Trend</span>
            <span style={{
              ...statValueStyle,
              color: metrics.improvementTrend === 'improving' ? tokens.colors.success[600] :
                     metrics.improvementTrend === 'declining' ? tokens.colors.warning[600] :
                     tokens.colors.neutral[600],
            }}>
              {metrics.improvementTrend === 'improving' ? '📈 Improving' :
               metrics.improvementTrend === 'declining' ? '📉 Needs Focus' :
               metrics.improvementTrend === 'stable' ? '➡️ Stable' :
               '📊 Learning'}
            </span>
          </div>

          {streakPrefs.showStreaks && (
            <div style={statStyle}>
              <span style={statLabelStyle}>Current Streak</span>
              <span style={{
                ...statValueStyle,
                color: metrics.streakDays > 0 ? tokens.colors.success[600] : tokens.colors.neutral[600],
              }}>
                {metrics.streakDays > 0 ? `🔥 ${metrics.streakDays} day${metrics.streakDays > 1 ? 's' : ''}` : 'Start your streak!'}
              </span>
            </div>
          )}
        </div>

        {/* Guide Progress */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>📚 Guide Progress</h2>
          
          {guideProgress.map(guide => (
            <div key={guide.id} style={{ marginBottom: tokens.spacing[4] }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: tokens.spacing[2],
              }}>
                <span style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                  color: tokens.colors.neutral[700],
                }}>
                  {guide.title}
                </span>
                <span style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: guide.completed ? tokens.colors.success[600] : tokens.colors.neutral[500],
                }}>
                  {guide.completed ? '✅ Complete' : `${Math.round(guide.timeSpent / 60)}min read`}
                </span>
              </div>
              
              <ProgressBar
                value={guide.completed ? 1 : Math.min(guide.timeSpent / 300, 0.9)} // 5min = ~90% if not marked complete
                max={1}
                variant={guide.completed ? 'success' : 'neutral'}
                size="sm"
                animated
              />
            </div>
          ))}
          
          <div style={{ marginTop: tokens.spacing[4], paddingTop: tokens.spacing[4], borderTop: `1px solid ${tokens.colors.neutral[200]}` }}>
            <div style={statStyle}>
              <span style={statLabelStyle}>Guides Completed</span>
              <span style={statValueStyle}>{completedGuides}/{totalGuides}</span>
            </div>
          </div>
        </div>

        {/* Lab Mastery */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>🧪 Lab Mastery</h2>
          
          {Object.entries(metrics.labProgress).map(([labId, progress]) => (
            <div key={labId} style={{ marginBottom: tokens.spacing[4] }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: tokens.spacing[2],
              }}>
                <span style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                  color: tokens.colors.neutral[700],
                }}>
                  {labId === 'practice-basics' ? 'Practice Lab' : 
                   labId === 'compare-basics' ? 'Compare Lab' : labId}
                </span>
                <span style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.colors.neutral[500],
                }}>
                  {progress.attempts} attempt{progress.attempts > 1 ? 's' : ''}
                </span>
              </div>
              
              <ProgressBar
                value={progress.bestScore}
                max={10}
                variant={progress.bestScore >= 8 ? 'success' : progress.bestScore >= 6 ? 'primary' : 'warning'}
                size="sm"
                showPercentage
                animated
              />
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.colors.neutral[500],
                marginTop: tokens.spacing[1],
              }}>
                <span>Best: {progress.bestScore}/10</span>
                <span>Avg: {progress.averageScore.toFixed(1)}/10</span>
              </div>
            </div>
          ))}
          
          {Object.keys(metrics.labProgress).length === 0 && (
            <p style={{ color: tokens.colors.neutral[500], fontStyle: 'italic' }}>
              Complete your first lab to see mastery progress
            </p>
          )}
        </div>

        {/* Learning Velocity */}
        {learningVelocity && learningVelocity.velocity !== 0 && (
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>🚀 Learning Velocity</h2>
            
            <div style={statStyle}>
              <span style={statLabelStyle}>Improvement Rate</span>
              <span style={{
                ...statValueStyle,
                color: learningVelocity.velocity > 0 ? tokens.colors.success[600] : tokens.colors.warning[600],
              }}>
                {learningVelocity.velocity > 0 ? '+' : ''}{learningVelocity.velocity} pts/attempt
              </span>
            </div>
            
            <div style={statStyle}>
              <span style={statLabelStyle}>Trend</span>
              <span style={{
                ...statValueStyle,
                color: learningVelocity.trend === 'accelerating' ? tokens.colors.success[600] :
                       learningVelocity.trend === 'slowing' ? tokens.colors.warning[600] :
                       tokens.colors.neutral[600],
              }}>
                {learningVelocity.trend === 'accelerating' ? '⚡ Accelerating' :
                 learningVelocity.trend === 'slowing' ? '🐌 Slowing' :
                 learningVelocity.trend === 'steady' ? '📈 Steady' :
                 '📊 Learning'}
              </span>
            </div>
            
            {learningVelocity.projection > 0 && (
              <div style={statStyle}>
                <span style={statLabelStyle}>5-Attempt Projection</span>
                <span style={statValueStyle}>{learningVelocity.projection}/10</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Achievements & Milestones */}
      {streakPrefs.showBadges && (
        <div style={{ marginBottom: tokens.spacing[8] }}>
          <h2 style={{
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.neutral[900],
            marginBottom: tokens.spacing[6],
          }}>
            🏆 Achievements
          </h2>
          
          <div style={gridStyle}>
            {progressData.milestones.map(milestone => (
              <UnlockableContent
                key={milestone.id}
                id={milestone.id}
                title={milestone.title}
                description={milestone.description}
                criteria={{
                  type: milestone.criteria.type as any,
                  threshold: milestone.criteria.threshold,
                }}
                isUnlocked={milestone.achieved}
                variant="achievement"
                onDismiss={() => dismissMilestone(milestone.id)}
                showCelebration={false} // We handle celebration separately
              >
                <div style={{
                  padding: tokens.spacing[4],
                  backgroundColor: milestone.achieved ? tokens.colors.success[50] : tokens.colors.neutral[100],
                  borderRadius: tokens.borderRadius.base,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: tokens.spacing[2] }}>
                    {milestone.achieved ? '🏆' : '🔒'}
                  </div>
                  <p style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: milestone.achieved ? tokens.colors.success[700] : tokens.colors.neutral[600],
                    margin: 0,
                  }}>
                    {milestone.achieved 
                      ? `Achieved ${milestone.achievedDate ? new Date(milestone.achievedDate).toLocaleDateString() : ''}`
                      : 'Keep practicing to unlock!'
                    }
                  </p>
                </div>
              </UnlockableContent>
            ))}
          </div>
        </div>
      )}

      {/* Unlockable Examples */}
      <div style={{ marginBottom: tokens.spacing[8] }}>
        <h2 style={{
          fontSize: tokens.typography.fontSize['2xl'],
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.neutral[900],
          marginBottom: tokens.spacing[6],
        }}>
          💡 Unlockable Examples
        </h2>
        
        <div style={gridStyle}>
          {unlockableExamples.map(example => (
            <UnlockableContent
              key={example.id}
              id={example.id}
              title={example.title}
              description={`${example.category} example prompt`}
              criteria={{
                type: 'score', // Simplified for display
                threshold: 1,
              }}
              isUnlocked={example.unlocked}
              variant="example"
              showCelebration={false}
            >
              <div style={{
                padding: tokens.spacing[4],
                backgroundColor: tokens.colors.neutral[50],
                borderRadius: tokens.borderRadius.base,
                border: `1px solid ${tokens.colors.neutral[200]}`,
              }}>
                <div style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.colors.neutral[500],
                  marginBottom: tokens.spacing[2],
                  textTransform: 'uppercase',
                  fontWeight: tokens.typography.fontWeight.medium,
                }}>
                  {example.category} Example
                </div>
                <p style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: tokens.colors.neutral[700],
                  fontFamily: tokens.typography.fontFamily.mono.join(', '),
                  backgroundColor: tokens.colors.neutral[100],
                  padding: tokens.spacing[3],
                  borderRadius: tokens.borderRadius.base,
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {example.prompt}
                </p>
                {example.unlocked && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(example.prompt);
                      // Could add toast notification here
                    }}
                    style={{
                      marginTop: tokens.spacing[3],
                      backgroundColor: tokens.colors.primary[500],
                      color: 'white',
                      border: 'none',
                      borderRadius: tokens.borderRadius.base,
                      padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                      fontSize: tokens.typography.fontSize.sm,
                      cursor: 'pointer',
                    }}
                  >
                    Copy to Clipboard
                  </button>
                )}
              </div>
            </UnlockableContent>
          ))}
        </div>
      </div>

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: tokens.spacing[8] }}>
          <h2 style={{
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.neutral[900],
            marginBottom: tokens.spacing[6],
          }}>
            🎯 Next Recommended
          </h2>
          
          <div style={gridStyle}>
            {recommendations.map((rec, index) => (
              <div key={index} style={{
                ...cardStyle,
                borderLeft: `4px solid ${
                  rec.priority === 'high' ? tokens.colors.warning[500] :
                  rec.priority === 'medium' ? tokens.colors.primary[500] :
                  tokens.colors.neutral[400]
                }`,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing[2],
                  marginBottom: tokens.spacing[3],
                }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {rec.type === 'guide' ? '📚' : rec.type === 'practice' ? '🧪' : '💡'}
                  </span>
                  <h3 style={{
                    fontSize: tokens.typography.fontSize.lg,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[900],
                    margin: 0,
                  }}>
                    {rec.title}
                  </h3>
                  <span style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: rec.priority === 'high' ? tokens.colors.warning[600] :
                           rec.priority === 'medium' ? tokens.colors.primary[600] :
                           tokens.colors.neutral[500],
                    backgroundColor: rec.priority === 'high' ? tokens.colors.warning[100] :
                                   rec.priority === 'medium' ? tokens.colors.primary[100] :
                                   tokens.colors.neutral[100],
                    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                    borderRadius: tokens.borderRadius.base,
                    textTransform: 'uppercase',
                    fontWeight: tokens.typography.fontWeight.medium,
                  }}>
                    {rec.priority}
                  </span>
                </div>
                
                <p style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: tokens.colors.neutral[700],
                  marginBottom: tokens.spacing[3],
                }}>
                  {rec.description}
                </p>
                
                <p style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.colors.neutral[500],
                  fontStyle: 'italic',
                  margin: 0,
                }}>
                  {rec.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attempt History */}
      <div style={{ marginBottom: tokens.spacing[8] }}>
        <h2 style={{
          fontSize: tokens.typography.fontSize['2xl'],
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.neutral[900],
          marginBottom: tokens.spacing[6],
        }}>
          📊 Attempt History
        </h2>
        
        <HistoryView
          pageSize={5}
          showComparison={true}
          onRevisit={(entry: HistoryEntry) => {
            // Navigate to the appropriate lab with the prompt prefilled
            const labUrl = `/labs/${entry.labId}?prefill=${encodeURIComponent(entry.userPrompt)}`;
            window.location.href = labUrl;
          }}
        />
      </div>

      {/* Settings */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>⚙️ Progress Settings</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[3] }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
            <input
              type="checkbox"
              checked={streakPrefs.showStreaks}
              onChange={(e) => saveStreakPreferences({
                ...streakPrefs,
                showStreaks: e.target.checked,
              })}
              style={{ marginRight: tokens.spacing[2] }}
            />
            <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
              Show streak counters
            </span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
            <input
              type="checkbox"
              checked={streakPrefs.showBadges}
              onChange={(e) => saveStreakPreferences({
                ...streakPrefs,
                showBadges: e.target.checked,
              })}
              style={{ marginRight: tokens.spacing[2] }}
            />
            <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
              Show achievement badges
            </span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
            <input
              type="checkbox"
              checked={streakPrefs.showCelebrations}
              onChange={(e) => saveStreakPreferences({
                ...streakPrefs,
                showCelebrations: e.target.checked,
              })}
              style={{ marginRight: tokens.spacing[2] }}
            />
            <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
              Show celebration animations
            </span>
          </label>
        </div>
      </div>

      <style jsx>{`
        @keyframes celebration-bounce {
          0% {
            transform: scale(0.3) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) rotate(2deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressPage;