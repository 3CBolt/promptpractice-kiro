/**
 * Tests for attempt history management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadAttemptHistory,
  saveAttemptHistory,
  addToHistory,
  getHistoryPage,
  getLabHistory,
  getAttemptById,
  compareAttempts,
  getImprovementTrend,
  toggleFavorite,
  addNotes,
  calculateHistoryStats,
  clearHistory,
  type HistoryEntry
} from '../history';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('History Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('loadAttemptHistory', () => {
    it('returns empty array when localStorage is empty', () => {
      const history = loadAttemptHistory();
      expect(history).toEqual([]);
    });

    it('loads existing data from localStorage', () => {
      const mockData = [
        {
          attemptId: 'test-1',
          timestamp: '2024-01-01T00:00:00Z',
          labId: 'practice-basics',
          userPrompt: 'Test prompt',
          score: 8,
          maxScore: 10,
          breakdown: { clarity: 4, completeness: 4 }
        }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const history = loadAttemptHistory();
      expect(history).toEqual(mockData);
    });

    it('handles corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const history = loadAttemptHistory();
      expect(history).toEqual([]);
    });
  });

  describe('addToHistory', () => {
    it('adds new entry to empty history', () => {
      const entry = {
        attemptId: 'test-1',
        timestamp: '2024-01-01T00:00:00Z',
        labId: 'practice-basics',
        userPrompt: 'Test prompt',
        score: 8,
        maxScore: 10,
        breakdown: { clarity: 4, completeness: 4 }
      };

      addToHistory(entry);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'prompt-practice-history',
        JSON.stringify([entry])
      );
    });

    it('updates existing entry with same attemptId', () => {
      const existingEntry = {
        attemptId: 'test-1',
        timestamp: '2024-01-01T00:00:00Z',
        labId: 'practice-basics',
        userPrompt: 'Old prompt',
        score: 6,
        maxScore: 10,
        breakdown: { clarity: 3, completeness: 3 }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify([existingEntry]));

      const updatedEntry = {
        attemptId: 'test-1',
        timestamp: '2024-01-01T00:00:00Z',
        labId: 'practice-basics',
        userPrompt: 'Updated prompt',
        score: 8,
        maxScore: 10,
        breakdown: { clarity: 4, completeness: 4 }
      };

      addToHistory(updatedEntry);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'prompt-practice-history',
        JSON.stringify([updatedEntry])
      );
    });
  });

  describe('getHistoryPage', () => {
    it('returns paginated results', () => {
      const mockData = Array.from({ length: 25 }, (_, i) => ({
        attemptId: `test-${i}`,
        timestamp: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        labId: 'practice-basics',
        userPrompt: `Test prompt ${i}`,
        score: 8,
        maxScore: 10,
        breakdown: { clarity: 4, completeness: 4 }
      }));
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const page = getHistoryPage(0, 10);
      
      expect(page.entries).toHaveLength(10);
      expect(page.totalPages).toBe(3);
      expect(page.currentPage).toBe(0);
      expect(page.hasMore).toBe(true);
    });
  });

  describe('getLabHistory', () => {
    it('filters history by lab ID', () => {
      const mockData = [
        {
          attemptId: 'test-1',
          timestamp: '2024-01-01T00:00:00Z',
          labId: 'practice-basics',
          userPrompt: 'Test prompt 1',
          score: 8,
          maxScore: 10,
          breakdown: { clarity: 4, completeness: 4 }
        },
        {
          attemptId: 'test-2',
          timestamp: '2024-01-02T00:00:00Z',
          labId: 'compare-basics',
          userPrompt: 'Test prompt 2',
          score: 7,
          maxScore: 10,
          breakdown: { clarity: 3, completeness: 4 }
        }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const labHistory = getLabHistory('practice-basics');
      
      expect(labHistory).toHaveLength(1);
      expect(labHistory[0].labId).toBe('practice-basics');
    });
  });

  describe('compareAttempts', () => {
    it('compares two attempts and calculates improvement', () => {
      const mockData = [
        {
          attemptId: 'test-1',
          timestamp: '2024-01-01T00:00:00Z',
          labId: 'practice-basics',
          userPrompt: 'Test prompt 1',
          score: 6,
          maxScore: 10,
          breakdown: { clarity: 3, completeness: 3 }
        },
        {
          attemptId: 'test-2',
          timestamp: '2024-01-02T00:00:00Z',
          labId: 'practice-basics',
          userPrompt: 'Test prompt 2',
          score: 8,
          maxScore: 10,
          breakdown: { clarity: 4, completeness: 4 }
        }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const comparison = compareAttempts('test-2', 'test-1');
      
      expect(comparison).toBeDefined();
      expect(comparison!.improvement.score).toBe(2);
      expect(comparison!.improvement.clarity).toBe(1);
      expect(comparison!.improvement.completeness).toBe(1);
      expect(comparison!.trend).toBe('improved');
    });

    it('returns null when attempts not found', () => {
      const comparison = compareAttempts('nonexistent-1', 'nonexistent-2');
      expect(comparison).toBeNull();
    });
  });

  describe('calculateHistoryStats', () => {
    it('calculates statistics for history entries', () => {
      const entries = [
        {
          attemptId: 'test-1',
          timestamp: '2024-01-01T00:00:00Z',
          labId: 'practice-basics',
          userPrompt: 'Test prompt 1',
          score: 6,
          maxScore: 10,
          breakdown: { clarity: 3, completeness: 3 }
        },
        {
          attemptId: 'test-2',
          timestamp: '2024-01-02T00:00:00Z',
          labId: 'practice-basics',
          userPrompt: 'Test prompt 2',
          score: 8,
          maxScore: 10,
          breakdown: { clarity: 4, completeness: 4 }
        },
        {
          attemptId: 'test-3',
          timestamp: '2024-01-03T00:00:00Z',
          labId: 'compare-basics',
          userPrompt: 'Test prompt 3',
          score: 7,
          maxScore: 10,
          breakdown: { clarity: 3, completeness: 4 }
        }
      ];

      const stats = calculateHistoryStats(entries);
      
      expect(stats.totalAttempts).toBe(3);
      expect(stats.averageScore).toBe(7);
      expect(stats.bestScore).toBe(8);
      expect(stats.worstScore).toBe(6);
      expect(stats.labBreakdown).toEqual({
        'practice-basics': 2,
        'compare-basics': 1
      });
    });

    it('handles empty entries array', () => {
      const stats = calculateHistoryStats([]);
      
      expect(stats.totalAttempts).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(stats.bestScore).toBe(0);
      expect(stats.worstScore).toBe(0);
      expect(stats.improvementRate).toBe(0);
      expect(stats.labBreakdown).toEqual({});
    });
  });

  describe('toggleFavorite', () => {
    it('marks attempt as favorite', () => {
      const mockData = [
        {
          attemptId: 'test-1',
          timestamp: '2024-01-01T00:00:00Z',
          labId: 'practice-basics',
          userPrompt: 'Test prompt',
          score: 8,
          maxScore: 10,
          breakdown: { clarity: 4, completeness: 4 }
        }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const result = toggleFavorite('test-1');
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'prompt-practice-history',
        expect.stringContaining('"favorite":true')
      );
    });

    it('returns false for non-existent attempt', () => {
      const result = toggleFavorite('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('removes history from localStorage', () => {
      clearHistory();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('prompt-practice-history');
    });
  });
});