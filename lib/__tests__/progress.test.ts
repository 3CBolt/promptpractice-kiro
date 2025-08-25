/**
 * Tests for progress tracking functionality
 */

import {
  loadProgressData,
  saveProgressData,
  recordAttempt,
  calculateProgressMetrics,
  getPreviousScores,
  clearProgressData
} from '@/lib/progress';
import { Attempt, Evaluation, AttemptStatus } from '@/types';

import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('Progress Tracking', () => {
  const mockAttempt: Attempt = {
    attemptId: 'test-attempt-123',
    userId: 'test-user',
    labId: 'practice-basics',
    userPrompt: 'Test prompt',
    models: ['test-model'],
    timestamp: '2024-01-01T00:00:00Z',
    schemaVersion: '1.0',
    rubricVersion: '1.0'
  };

  const mockEvaluation: Evaluation = {
    attemptId: 'test-attempt-123',
    status: AttemptStatus.SUCCESS,
    results: [
      {
        modelId: 'test-model',
        response: 'Test response',
        latency: 100,
        source: 'sample' as any,
        scores: {
          clarity: 4,
          completeness: 3,
          total: 7
        }
      }
    ],
    rubricVersion: '1.0',
    timestamp: '2024-01-01T00:00:00Z',
    schemaVersion: '1.0'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('loadProgressData', () => {
    it('returns empty data when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = loadProgressData();
      
      expect(result.history).toEqual([]);
      expect(result.milestones).toHaveLength(6); // Default milestones
    });

    it('loads existing data from localStorage', () => {
      const mockData = {
        history: [{ attemptId: 'test', score: 7 }],
        milestones: [{ id: 'test-milestone', achieved: true }]
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = loadProgressData();
      
      expect(result.history).toEqual(mockData.history);
      expect(result.milestones).toEqual(mockData.milestones);
    });

    it('handles corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const result = loadProgressData();
      
      expect(result.history).toEqual([]);
      expect(result.milestones).toHaveLength(6);
    });
  });

  describe('recordAttempt', () => {
    it('records a successful attempt', () => {
      const historyEntry = recordAttempt(mockAttempt, mockEvaluation);
      
      expect(historyEntry).toEqual({
        attemptId: 'test-attempt-123',
        timestamp: '2024-01-01T00:00:00Z',
        labId: 'practice-basics',
        userPrompt: 'Test prompt',
        score: 7,
        maxScore: 10,
        breakdown: {
          clarity: 4,
          completeness: 3
        }
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('returns null for evaluation without results', () => {
      const emptyEvaluation: Evaluation = {
        ...mockEvaluation,
        results: []
      };
      
      const result = recordAttempt(mockAttempt, emptyEvaluation);
      
      expect(result).toBeNull();
    });

    it('returns null for evaluation without scores', () => {
      const noScoresEvaluation: Evaluation = {
        ...mockEvaluation,
        results: [
          {
            modelId: 'test-model',
            response: 'Test response',
            latency: 100,
            source: 'sample' as any
          }
        ]
      };
      
      const result = recordAttempt(mockAttempt, noScoresEvaluation);
      
      expect(result).toBeNull();
    });
  });

  describe('calculateProgressMetrics', () => {
    it('handles empty history', () => {
      const metrics = calculateProgressMetrics([]);
      
      expect(metrics).toEqual({
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        improvementTrend: 'insufficient_data',
        streakDays: 0,
        lastAttemptDate: '',
        labProgress: {}
      });
    });

    it('calculates metrics for single attempt', () => {
      const history = [{
        attemptId: 'test-1',
        timestamp: '2024-01-01T00:00:00Z',
        labId: 'practice-basics',
        userPrompt: 'Test',
        score: 7,
        maxScore: 10,
        breakdown: { clarity: 4, completeness: 3 }
      }];
      
      const metrics = calculateProgressMetrics(history);
      
      expect(metrics.totalAttempts).toBe(1);
      expect(metrics.averageScore).toBe(7);
      expect(metrics.bestScore).toBe(7);
      expect(metrics.improvementTrend).toBe('insufficient_data');
      expect(metrics.lastAttemptDate).toBe('2024-01-01T00:00:00Z');
    });

    it('calculates improvement trend for multiple attempts', () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        attemptId: `test-${i}`,
        timestamp: `2024-01-0${Math.floor(i/10) + 1}T00:00:00Z`,
        labId: 'practice-basics',
        userPrompt: 'Test',
        score: i < 5 ? 5 : 8, // Improvement from 5 to 8
        maxScore: 10,
        breakdown: { clarity: 3, completeness: 2 }
      }));
      
      const metrics = calculateProgressMetrics(history);
      
      expect(metrics.improvementTrend).toBe('improving');
    });
  });

  describe('getPreviousScores', () => {
    beforeEach(() => {
      const mockData = {
        history: [
          { attemptId: 'test-1', labId: 'practice-basics', score: 5 },
          { attemptId: 'test-2', labId: 'practice-basics', score: 6 },
          { attemptId: 'test-3', labId: 'compare-basics', score: 7 },
          { attemptId: 'test-4', labId: 'practice-basics', score: 8 }
        ]
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
    });

    it('returns previous scores for specific lab', () => {
      const scores = getPreviousScores('practice-basics', 5);
      
      expect(scores).toEqual([5, 6]); // Excludes the most recent (8)
    });

    it('returns all previous scores when no lab specified', () => {
      const scores = getPreviousScores(undefined, 5);
      
      expect(scores).toEqual([5, 6, 7]); // Excludes the most recent (8)
    });

    it('respects the limit parameter', () => {
      const scores = getPreviousScores('practice-basics', 1);
      
      expect(scores).toEqual([6]); // Only the second most recent
    });
  });

  describe('clearProgressData', () => {
    it('removes data from localStorage', () => {
      clearProgressData();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('prompt-practice-progress');
    });
  });
});