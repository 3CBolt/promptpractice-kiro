/**
 * Attempt history storage and management utilities
 * Provides lightweight history tracking with localStorage and size limits
 */

import { AttemptHistory, ProgressMetrics } from './progress';

export interface HistoryEntry extends AttemptHistory {
  /** Additional metadata for history view */
  notes?: string;
  /** Whether this attempt was marked as favorite */
  favorite?: boolean;
}

export interface HistoryComparison {
  current: HistoryEntry;
  previous: HistoryEntry;
  improvement: {
    score: number;
    clarity: number;
    completeness: number;
  };
  trend: 'improved' | 'declined' | 'same';
}

const HISTORY_STORAGE_KEY = 'prompt-practice-history';
const MAX_HISTORY_ENTRIES = 50; // Limit to prevent localStorage bloat

/**
 * Load attempt history from localStorage
 */
export function loadAttemptHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Failed to load attempt history:', error);
    return [];
  }
}

/**
 * Save attempt history to localStorage with size management
 */
export function saveAttemptHistory(history: HistoryEntry[]): void {
  try {
    // Limit history size and sort by timestamp (newest first)
    const limitedHistory = history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, MAX_HISTORY_ENTRIES);
    
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.warn('Failed to save attempt history:', error);
  }
}

/**
 * Add a new attempt to history
 */
export function addToHistory(entry: AttemptHistory): void {
  const history = loadAttemptHistory();
  
  // Check if entry already exists (prevent duplicates)
  const existingIndex = history.findIndex(h => h.attemptId === entry.attemptId);
  
  if (existingIndex >= 0) {
    // Update existing entry
    history[existingIndex] = { ...history[existingIndex], ...entry };
  } else {
    // Add new entry
    history.push(entry);
  }
  
  saveAttemptHistory(history);
}

/**
 * Get paginated history entries
 */
export function getHistoryPage(page: number = 0, pageSize: number = 10): {
  entries: HistoryEntry[];
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
} {
  const history = loadAttemptHistory();
  const totalPages = Math.ceil(history.length / pageSize);
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    entries: history.slice(startIndex, endIndex),
    totalPages,
    currentPage: page,
    hasMore: page < totalPages - 1
  };
}

/**
 * Get history entries for a specific lab
 */
export function getLabHistory(labId: string, limit?: number): HistoryEntry[] {
  const history = loadAttemptHistory();
  const labEntries = history.filter(entry => entry.labId === labId);
  
  return limit ? labEntries.slice(0, limit) : labEntries;
}

/**
 * Get a specific attempt by ID
 */
export function getAttemptById(attemptId: string): HistoryEntry | null {
  const history = loadAttemptHistory();
  return history.find(entry => entry.attemptId === attemptId) || null;
}

/**
 * Compare two attempts and calculate improvement
 */
export function compareAttempts(currentId: string, previousId: string): HistoryComparison | null {
  const current = getAttemptById(currentId);
  const previous = getAttemptById(previousId);
  
  if (!current || !previous) return null;
  
  const improvement = {
    score: current.score - previous.score,
    clarity: current.breakdown.clarity - previous.breakdown.clarity,
    completeness: current.breakdown.completeness - previous.breakdown.completeness
  };
  
  const totalImprovement = improvement.score;
  const trend: 'improved' | 'declined' | 'same' = 
    totalImprovement > 0 ? 'improved' :
    totalImprovement < 0 ? 'declined' : 'same';
  
  return {
    current,
    previous,
    improvement,
    trend
  };
}

/**
 * Get improvement over time for visualization
 */
export function getImprovementTrend(labId?: string, limit: number = 20): Array<{
  timestamp: string;
  score: number;
  clarity: number;
  completeness: number;
  attemptNumber: number;
}> {
  const history = loadAttemptHistory();
  const relevantHistory = labId 
    ? history.filter(entry => entry.labId === labId)
    : history;
  
  return relevantHistory
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-limit)
    .map((entry, index) => ({
      timestamp: entry.timestamp,
      score: entry.score,
      clarity: entry.breakdown.clarity,
      completeness: entry.breakdown.completeness,
      attemptNumber: index + 1
    }));
}

/**
 * Mark an attempt as favorite
 */
export function toggleFavorite(attemptId: string): boolean {
  const history = loadAttemptHistory();
  const entryIndex = history.findIndex(entry => entry.attemptId === attemptId);
  
  if (entryIndex === -1) return false;
  
  history[entryIndex].favorite = !history[entryIndex].favorite;
  saveAttemptHistory(history);
  
  return history[entryIndex].favorite || false;
}

/**
 * Add notes to an attempt
 */
export function addNotes(attemptId: string, notes: string): boolean {
  const history = loadAttemptHistory();
  const entryIndex = history.findIndex(entry => entry.attemptId === attemptId);
  
  if (entryIndex === -1) return false;
  
  history[entryIndex].notes = notes;
  saveAttemptHistory(history);
  
  return true;
}

/**
 * Get favorite attempts
 */
export function getFavoriteAttempts(): HistoryEntry[] {
  const history = loadAttemptHistory();
  return history.filter(entry => entry.favorite);
}

/**
 * Get recent attempts (last N days)
 */
export function getRecentAttempts(days: number = 7): HistoryEntry[] {
  const history = loadAttemptHistory();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return history.filter(entry => 
    new Date(entry.timestamp) >= cutoffDate
  );
}

/**
 * Calculate statistics for history view
 */
export function calculateHistoryStats(entries: HistoryEntry[]): {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  improvementRate: number;
  labBreakdown: Record<string, number>;
} {
  if (entries.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      worstScore: 0,
      improvementRate: 0,
      labBreakdown: {}
    };
  }
  
  const scores = entries.map(e => e.score);
  const totalAttempts = entries.length;
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAttempts;
  const bestScore = Math.max(...scores);
  const worstScore = Math.min(...scores);
  
  // Calculate improvement rate (first half vs second half)
  let improvementRate = 0;
  if (totalAttempts >= 4) {
    const midpoint = Math.floor(totalAttempts / 2);
    const firstHalf = entries.slice(0, midpoint);
    const secondHalf = entries.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, e) => sum + e.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.score, 0) / secondHalf.length;
    
    improvementRate = secondAvg - firstAvg;
  }
  
  // Lab breakdown
  const labBreakdown: Record<string, number> = {};
  entries.forEach(entry => {
    labBreakdown[entry.labId] = (labBreakdown[entry.labId] || 0) + 1;
  });
  
  return {
    totalAttempts,
    averageScore: Math.round(averageScore * 100) / 100,
    bestScore,
    worstScore,
    improvementRate: Math.round(improvementRate * 100) / 100,
    labBreakdown
  };
}

/**
 * Export history data for backup
 */
export function exportHistory(): string {
  const history = loadAttemptHistory();
  return JSON.stringify({
    history,
    exportDate: new Date().toISOString(),
    version: '1.0'
  }, null, 2);
}

/**
 * Import history data from backup
 */
export function importHistory(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.history && Array.isArray(data.history)) {
      saveAttemptHistory(data.history);
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Failed to import history data:', error);
    return false;
  }
}

/**
 * Clear all history data
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear history data:', error);
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): {
  entriesCount: number;
  storageSize: number;
  maxEntries: number;
  usagePercentage: number;
} {
  const history = loadAttemptHistory();
  const storageSize = new Blob([JSON.stringify(history)]).size;
  
  return {
    entriesCount: history.length,
    storageSize,
    maxEntries: MAX_HISTORY_ENTRIES,
    usagePercentage: (history.length / MAX_HISTORY_ENTRIES) * 100
  };
}