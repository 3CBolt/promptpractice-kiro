/**
 * Progress tracking utilities for the Prompt Practice App
 * Handles learning progress, attempt history, and improvement metrics
 */

import { Attempt, Evaluation } from '@/types';

export interface AttemptHistory {
  attemptId: string;
  timestamp: string;
  labId: string;
  userPrompt: string;
  score: number;
  maxScore: number;
  breakdown: {
    clarity: number;
    completeness: number;
  };
}

export interface ProgressMetrics {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  improvementTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  streakDays: number;
  lastAttemptDate: string;
  labProgress: Record<string, {
    attempts: number;
    bestScore: number;
    averageScore: number;
  }>;
}

export interface LearningMilestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  achievedDate?: string;
  criteria: {
    type: 'score' | 'attempts' | 'streak' | 'improvement';
    threshold: number;
    labId?: string;
  };
}

const STORAGE_KEY = 'prompt-practice-progress';
const MAX_HISTORY_SIZE = 100; // Limit stored attempts to prevent localStorage bloat

/**
 * Load progress data from localStorage
 */
export function loadProgressData(): {
  history: AttemptHistory[];
  milestones: LearningMilestone[];
} {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        history: [],
        milestones: getDefaultMilestones()
      };
    }

    const data = JSON.parse(stored);
    return {
      history: data.history || [],
      milestones: data.milestones || getDefaultMilestones()
    };
  } catch (error) {
    console.warn('Failed to load progress data:', error);
    return {
      history: [],
      milestones: getDefaultMilestones()
    };
  }
}

/**
 * Save progress data to localStorage
 */
export function saveProgressData(history: AttemptHistory[], milestones: LearningMilestone[]): void {
  try {
    // Limit history size to prevent localStorage bloat
    const limitedHistory = history.slice(-MAX_HISTORY_SIZE);
    
    const data = {
      history: limitedHistory,
      milestones,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save progress data:', error);
  }
}

/**
 * Add a new attempt to the progress history
 */
export function recordAttempt(attempt: Attempt, evaluation: Evaluation): AttemptHistory | null {
  if (!evaluation.results || evaluation.results.length === 0) {
    return null;
  }

  // Get the best result for scoring
  const bestResult = evaluation.results.reduce((best, current) => 
    (current.scores?.total || 0) > (best.scores?.total || 0) ? current : best
  );

  if (!bestResult.scores) {
    return null;
  }

  const historyEntry: AttemptHistory = {
    attemptId: attempt.attemptId,
    timestamp: attempt.timestamp,
    labId: attempt.labId,
    userPrompt: attempt.userPrompt.slice(0, 200), // Truncate for storage
    score: bestResult.scores.total,
    maxScore: 10,
    breakdown: {
      clarity: bestResult.scores.clarity,
      completeness: bestResult.scores.completeness
    }
  };

  // Load existing data
  const { history, milestones } = loadProgressData();
  
  // Add new entry
  const updatedHistory = [...history, historyEntry];
  
  // Check for milestone achievements
  const updatedMilestones = checkMilestoneAchievements(updatedHistory, milestones);
  
  // Save updated data
  saveProgressData(updatedHistory, updatedMilestones);

  // Also add to the separate history system for detailed tracking
  try {
    // Dynamic import to avoid circular dependencies
    import('./history').then(({ addToHistory }) => {
      addToHistory(historyEntry);
    }).catch(error => {
      console.warn('Failed to sync with history system:', error);
    });
  } catch (error) {
    console.warn('Failed to sync with history system:', error);
  }

  return historyEntry;
}

/**
 * Calculate progress metrics from attempt history
 */
export function calculateProgressMetrics(history: AttemptHistory[]): ProgressMetrics {
  if (history.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      improvementTrend: 'insufficient_data',
      streakDays: 0,
      lastAttemptDate: '',
      labProgress: {}
    };
  }

  const totalAttempts = history.length;
  const scores = history.map(h => h.score);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const bestScore = Math.max(...scores);
  const lastAttemptDate = history[history.length - 1].timestamp;

  // Calculate improvement trend (last 5 vs previous 5)
  let improvementTrend: ProgressMetrics['improvementTrend'] = 'insufficient_data';
  if (history.length >= 6) {
    const recent5 = history.slice(-5).map(h => h.score);
    const previous5 = history.slice(-10, -5).map(h => h.score);
    
    const recentAvg = recent5.reduce((sum, score) => sum + score, 0) / recent5.length;
    const previousAvg = previous5.reduce((sum, score) => sum + score, 0) / previous5.length;
    
    const improvement = recentAvg - previousAvg;
    if (improvement > 0.5) {
      improvementTrend = 'improving';
    } else if (improvement < -0.5) {
      improvementTrend = 'declining';
    } else {
      improvementTrend = 'stable';
    }
  }

  // Calculate streak days
  const streakDays = calculateStreakDays(history);

  // Calculate lab-specific progress
  const labProgress: Record<string, any> = {};
  history.forEach(attempt => {
    if (!labProgress[attempt.labId]) {
      labProgress[attempt.labId] = {
        attempts: 0,
        scores: []
      };
    }
    labProgress[attempt.labId].attempts++;
    labProgress[attempt.labId].scores.push(attempt.score);
  });

  // Process lab progress
  Object.keys(labProgress).forEach(labId => {
    const lab = labProgress[labId];
    lab.bestScore = Math.max(...lab.scores);
    lab.averageScore = lab.scores.reduce((sum: number, score: number) => sum + score, 0) / lab.scores.length;
    delete lab.scores; // Remove raw scores to save space
  });

  return {
    totalAttempts,
    averageScore: Math.round(averageScore * 100) / 100,
    bestScore,
    improvementTrend,
    streakDays,
    lastAttemptDate,
    labProgress
  };
}

/**
 * Calculate consecutive days with attempts
 */
function calculateStreakDays(history: AttemptHistory[]): number {
  if (history.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get unique days with attempts
  const uniqueDays = new Set(history.map(h => {
    const date = new Date(h.timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }));
  const attemptDays = Array.from(uniqueDays).sort((a, b) => b - a); // Sort descending (most recent first)

  let streak = 0;
  let currentDay = today.getTime();

  for (const attemptDay of attemptDays) {
    if (attemptDay === currentDay) {
      streak++;
      currentDay -= 24 * 60 * 60 * 1000; // Go back one day
    } else if (attemptDay === currentDay + 24 * 60 * 60 * 1000) {
      // Yesterday counts if today has no attempts
      streak++;
      currentDay = attemptDay - 24 * 60 * 60 * 1000;
    } else {
      break; // Streak broken
    }
  }

  return streak;
}

/**
 * Get default learning milestones
 */
function getDefaultMilestones(): LearningMilestone[] {
  return [
    {
      id: 'first-attempt',
      title: 'First Steps',
      description: 'Complete your first prompt attempt',
      achieved: false,
      criteria: {
        type: 'attempts',
        threshold: 1
      }
    },
    {
      id: 'good-score',
      title: 'Getting Good',
      description: 'Achieve a score of 7 or higher',
      achieved: false,
      criteria: {
        type: 'score',
        threshold: 7
      }
    },
    {
      id: 'excellent-score',
      title: 'Excellent Work',
      description: 'Achieve a perfect score of 10',
      achieved: false,
      criteria: {
        type: 'score',
        threshold: 10
      }
    },
    {
      id: 'consistent-practice',
      title: 'Consistent Learner',
      description: 'Complete 10 attempts',
      achieved: false,
      criteria: {
        type: 'attempts',
        threshold: 10
      }
    },
    {
      id: 'week-streak',
      title: 'Week Warrior',
      description: 'Practice for 7 consecutive days',
      achieved: false,
      criteria: {
        type: 'streak',
        threshold: 7
      }
    },
    {
      id: 'improvement-master',
      title: 'Improvement Master',
      description: 'Show consistent improvement over 10 attempts',
      achieved: false,
      criteria: {
        type: 'improvement',
        threshold: 10
      }
    }
  ];
}

/**
 * Check and update milestone achievements
 */
function checkMilestoneAchievements(
  history: AttemptHistory[], 
  milestones: LearningMilestone[]
): LearningMilestone[] {
  const metrics = calculateProgressMetrics(history);
  const now = new Date().toISOString();

  return milestones.map(milestone => {
    if (milestone.achieved) return milestone;

    let shouldAchieve = false;

    switch (milestone.criteria.type) {
      case 'attempts':
        shouldAchieve = metrics.totalAttempts >= milestone.criteria.threshold;
        break;
      
      case 'score':
        shouldAchieve = metrics.bestScore >= milestone.criteria.threshold;
        break;
      
      case 'streak':
        shouldAchieve = metrics.streakDays >= milestone.criteria.threshold;
        break;
      
      case 'improvement':
        shouldAchieve = metrics.totalAttempts >= milestone.criteria.threshold && 
                       metrics.improvementTrend === 'improving';
        break;
    }

    if (shouldAchieve) {
      return {
        ...milestone,
        achieved: true,
        achievedDate: now
      };
    }

    return milestone;
  });
}

/**
 * Get recent attempt history for a specific lab
 */
export function getLabHistory(labId: string, limit: number = 10): AttemptHistory[] {
  const { history } = loadProgressData();
  return history
    .filter(attempt => attempt.labId === labId)
    .slice(-limit);
}

/**
 * Get previous scores for progress comparison
 */
export function getPreviousScores(labId?: string, limit: number = 5): number[] {
  const { history } = loadProgressData();
  
  const relevantHistory = labId 
    ? history.filter(attempt => attempt.labId === labId)
    : history;
    
  return relevantHistory
    .slice(-limit - 1, -1) // Exclude the most recent attempt
    .map(attempt => attempt.score);
}

/**
 * Clear all progress data (for testing or reset)
 */
export function clearProgressData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear progress data:', error);
  }
}

/**
 * Export progress data for backup
 */
export function exportProgressData(): string {
  const { history, milestones } = loadProgressData();
  return JSON.stringify({
    history,
    milestones,
    exportDate: new Date().toISOString(),
    version: '1.0'
  }, null, 2);
}

/**
 * Import progress data from backup
 */
export function importProgressData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.history && Array.isArray(data.history) && 
        data.milestones && Array.isArray(data.milestones)) {
      saveProgressData(data.history, data.milestones);
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Failed to import progress data:', error);
    return false;
  }
}

/**
 * Track guide reading progress
 */
export function trackGuideProgress(guideId: string, timeSpent: number, completed: boolean = false): void {
  try {
    const existing = localStorage.getItem(`guide-progress-${guideId}`);
    const data = existing ? JSON.parse(existing) : { timeSpent: 0, completed: false };
    
    data.timeSpent += timeSpent;
    data.completed = completed || data.completed;
    data.lastVisited = new Date().toISOString();
    
    localStorage.setItem(`guide-progress-${guideId}`, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to track guide progress:', error);
  }
}

/**
 * Get unlockable example prompts based on progress
 */
export function getUnlockableExamples(): Array<{
  id: string;
  title: string;
  prompt: string;
  category: string;
  unlocked: boolean;
  criteria: string;
}> {
  const { history } = loadProgressData();
  const metrics = calculateProgressMetrics(history);
  
  const examples = [
    {
      id: 'clarity-master',
      title: 'Crystal Clear Instructions',
      prompt: 'Write a step-by-step guide for making coffee. Include specific measurements, timing, and equipment needed. Format your response with numbered steps and highlight key tips.',
      category: 'Clarity',
      criteria: 'Achieve average clarity score of 4+',
      unlocked: false,
    },
    {
      id: 'completeness-expert',
      title: 'Comprehensive Analysis',
      prompt: 'Analyze the pros and cons of remote work. Cover at least 5 advantages and 5 disadvantages. Include perspectives from both employees and employers. Conclude with actionable recommendations.',
      category: 'Completeness',
      criteria: 'Achieve average completeness score of 4+',
      unlocked: false,
    },
    {
      id: 'consistent-learner',
      title: 'Advanced Chain of Thought',
      prompt: 'Solve this math problem step by step: "A store offers a 20% discount on items over $50, and an additional 10% off for members. If a member buys a $75 item, what is the final price?" Show your reasoning at each step.',
      category: 'Reasoning',
      criteria: 'Complete 10+ attempts',
      unlocked: false,
    },
    {
      id: 'streak-warrior',
      title: 'Creative Storytelling',
      prompt: 'Write a short story (200-300 words) that includes these elements: a mysterious package, a rainy Tuesday, and an unexpected friendship. Use vivid descriptions and dialogue.',
      category: 'Creativity',
      criteria: 'Maintain 7+ day streak',
      unlocked: false,
    },
    {
      id: 'high-achiever',
      title: 'Expert System Prompt',
      prompt: 'You are a professional code reviewer with 10+ years of experience. Review this Python function for best practices, performance, and readability. Provide specific suggestions with examples: [function code would go here]',
      category: 'System Prompts',
      criteria: 'Achieve score of 9+',
      unlocked: false,
    },
  ];
  
  // Calculate average scores by criterion
  const clarityScores = history.map(h => h.breakdown.clarity).filter(s => s > 0);
  const completenessScores = history.map(h => h.breakdown.completeness).filter(s => s > 0);
  const avgClarity = clarityScores.length > 0 ? clarityScores.reduce((a, b) => a + b, 0) / clarityScores.length : 0;
  const avgCompleteness = completenessScores.length > 0 ? completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length : 0;
  
  // Check unlock criteria
  examples[0].unlocked = avgClarity >= 4;
  examples[1].unlocked = avgCompleteness >= 4;
  examples[2].unlocked = metrics.totalAttempts >= 10;
  examples[3].unlocked = metrics.streakDays >= 7;
  examples[4].unlocked = metrics.bestScore >= 9;
  
  return examples;
}

/**
 * Calculate learning velocity (improvement rate)
 */
export function calculateLearningVelocity(history: AttemptHistory[]): {
  velocity: number; // points per attempt
  trend: 'accelerating' | 'steady' | 'slowing' | 'insufficient_data';
  projection: number; // projected score in 5 attempts
} {
  if (history.length < 3) {
    return {
      velocity: 0,
      trend: 'insufficient_data',
      projection: 0,
    };
  }
  
  // Calculate velocity using linear regression on recent attempts
  const recentHistory = history.slice(-10); // Last 10 attempts
  const n = recentHistory.length;
  
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  recentHistory.forEach((attempt, index) => {
    const x = index + 1; // Attempt number
    const y = attempt.score; // Score
    
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });
  
  const velocity = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - velocity * sumX) / n;
  
  // Determine trend by comparing recent velocity to earlier velocity
  let trend: 'accelerating' | 'steady' | 'slowing' | 'insufficient_data' = 'steady';
  
  if (history.length >= 6) {
    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    const secondHalf = history.slice(Math.floor(history.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, h) => sum + h.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, h) => sum + h.score, 0) / secondHalf.length;
    
    const improvement = secondAvg - firstAvg;
    
    if (improvement > 1) trend = 'accelerating';
    else if (improvement < -1) trend = 'slowing';
  }
  
  const projection = Math.max(0, Math.min(10, intercept + velocity * (n + 5)));
  
  return {
    velocity: Math.round(velocity * 100) / 100,
    trend,
    projection: Math.round(projection * 100) / 100,
  };
}

/**
 * Get personalized learning recommendations
 */
export function getPersonalizedRecommendations(history: AttemptHistory[]): Array<{
  type: 'guide' | 'practice' | 'technique';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}> {
  const metrics = calculateProgressMetrics(history);
  const recommendations: Array<{
    type: 'guide' | 'practice' | 'technique';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }> = [];
  
  // Analyze recent performance
  const recentAttempts = history.slice(-5);
  const clarityIssues = recentAttempts.filter(h => h.breakdown.clarity < 3).length;
  const completenessIssues = recentAttempts.filter(h => h.breakdown.completeness < 3).length;
  
  // Clarity recommendations
  if (clarityIssues >= 2) {
    recommendations.push({
      type: 'guide',
      title: 'Review Fundamentals Guide',
      description: 'Focus on writing clear, specific prompts with concrete examples',
      priority: 'high',
      reason: 'Recent attempts show clarity issues',
    });
  }
  
  // Completeness recommendations
  if (completenessIssues >= 2) {
    recommendations.push({
      type: 'technique',
      title: 'Use Multi-Part Questions',
      description: 'Break complex requests into numbered sub-questions',
      priority: 'high',
      reason: 'Responses are often incomplete',
    });
  }
  
  // Practice frequency recommendations
  if (metrics.streakDays === 0 && metrics.totalAttempts > 0) {
    recommendations.push({
      type: 'practice',
      title: 'Daily Practice',
      description: 'Try to practice at least once per day for better retention',
      priority: 'medium',
      reason: 'Consistent practice improves learning outcomes',
    });
  }
  
  // Advanced technique recommendations
  if (metrics.averageScore >= 7 && metrics.totalAttempts >= 5) {
    recommendations.push({
      type: 'guide',
      title: 'Explore Chain of Thought',
      description: 'Learn advanced reasoning techniques for complex problems',
      priority: 'medium',
      reason: 'You\'re ready for advanced techniques',
    });
  }
  
  return recommendations;
}