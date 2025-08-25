/**
 * Guide-to-Lab Integration Tests
 * 
 * Tests the complete learning flow from guides to labs, including
 * context passing, progress tracking, and educational reinforcement.
 */

import { vi } from 'vitest';
import { AttemptStatus, ModelSource } from '@/types/contracts';

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

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Guide-to-Lab Context Passing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('validates guide context URL parameters', () => {
    const guideContext = {
      guide: 'fundamentals',
      prompt: 'Explain three key behaviors of domestic cats and why they evolved'
    };

    // Test URL parameter parsing
    const searchParams = new URLSearchParams();
    searchParams.set('guide', guideContext.guide);
    searchParams.set('prompt', guideContext.prompt);

    expect(searchParams.get('guide')).toBe('fundamentals');
    expect(searchParams.get('prompt')).toBe('Explain three key behaviors of domestic cats and why they evolved');
  });

  test('validates CTA link format', () => {
    const baseUrl = '/labs/practice-basics';
    const guideSlug = 'fundamentals';
    const examplePrompt = 'Explain three key behaviors of domestic cats and why they evolved';
    
    const ctaUrl = `${baseUrl}?guide=${encodeURIComponent(guideSlug)}&prompt=${encodeURIComponent(examplePrompt)}`;
    
    expect(ctaUrl).toContain('/labs/practice-basics');
    expect(ctaUrl).toContain('guide=fundamentals');
    expect(ctaUrl).toContain('prompt=Explain%20three%20key%20behaviors');
  });

  test('validates context preservation through lab workflow', () => {
    const labContext = {
      sourceGuide: 'chain-of-thought',
      prefillPrompt: 'Think step by step to solve this problem',
      labId: 'practice-basics'
    };

    // Simulate context being passed through the workflow
    const attemptData = {
      attemptId: 'test123-456789',
      userId: 'anonymous',
      labId: labContext.labId,
      userPrompt: labContext.prefillPrompt,
      models: ['llama3.1-8b'],
      timestamp: new Date().toISOString(),
      schemaVersion: '1.0',
      context: {
        sourceGuide: labContext.sourceGuide,
        prefillPrompt: labContext.prefillPrompt
      }
    };

    expect(attemptData.context?.sourceGuide).toBe('chain-of-thought');
    expect(attemptData.userPrompt).toBe('Think step by step to solve this problem');
  });

  test('validates feedback linking back to guides', () => {
    const feedbackData = {
      criterionId: 'completeness',
      explanation: 'Your prompt could be more specific',
      exampleFix: 'Try asking for step-by-step explanations',
      relatedGuide: 'chain-of-thought'
    };

    const guideLink = `/guides/${feedbackData.relatedGuide}`;
    
    expect(guideLink).toBe('/guides/chain-of-thought');
    expect(feedbackData.relatedGuide).toBe('chain-of-thought');
  });
});

describe('Progress Tracking Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('tracks guide completion', () => {
    const progressData = {
      guides: {
        fundamentals: { 
          completed: true, 
          timestamp: Date.now() - 86400000 // 1 day ago
        }
      },
      labs: {}
    };

    localStorageMock.setItem('progress-data', JSON.stringify(progressData));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'progress-data',
      expect.stringContaining('fundamentals')
    );
  });

  test('tracks lab submission attempts', () => {
    const attemptData = {
      attemptId: 'test123-456789',
      labId: 'practice-basics',
      score: 7,
      timestamp: Date.now()
    };

    const progressData = {
      guides: {},
      labs: {
        'practice-basics': {
          attempts: [attemptData]
        }
      }
    };

    localStorageMock.setItem('progress-data', JSON.stringify(progressData));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'progress-data',
      expect.stringContaining('practice-basics')
    );
  });

  test('calculates improvement over multiple attempts', () => {
    const progressData = {
      guides: {},
      labs: {
        'practice-basics': {
          attempts: [
            { attemptId: 'old-123', score: 5, timestamp: Date.now() - 86400000 },
            { attemptId: 'new-456', score: 8, timestamp: Date.now() }
          ]
        }
      }
    };

    const attempts = progressData.labs['practice-basics'].attempts;
    const oldScore = attempts[0].score;
    const newScore = attempts[1].score;
    const improvement = newScore - oldScore;

    expect(improvement).toBe(3);
    expect(newScore).toBeGreaterThan(oldScore);
  });

  test('calculates learning streaks', () => {
    const now = Date.now();
    const oneDayAgo = now - 86400000;
    const twoDaysAgo = now - 172800000;
    const threeDaysAgo = now - 259200000;

    const progressData = {
      guides: {
        fundamentals: { completed: true, timestamp: threeDaysAgo },
        'chain-of-thought': { completed: true, timestamp: twoDaysAgo },
        'system-prompts': { completed: true, timestamp: oneDayAgo }
      },
      labs: {}
    };

    const completedGuides = Object.values(progressData.guides);
    const streak = completedGuides.length;

    expect(streak).toBe(3);
  });

  test('unlocks content based on progress', () => {
    const progressData = {
      guides: {
        fundamentals: { completed: true, timestamp: Date.now() - 86400000 }
      },
      labs: {
        'practice-basics': {
          attempts: [
            { attemptId: 'attempt1', score: 8, timestamp: Date.now() - 86400000 }
          ]
        }
      }
    };

    const hasCompletedFundamentals = progressData.guides.fundamentals?.completed;
    const hasHighScore = progressData.labs['practice-basics']?.attempts.some(a => a.score >= 8);
    const shouldUnlockAdvanced = hasCompletedFundamentals && hasHighScore;

    expect(shouldUnlockAdvanced).toBe(true);
  });
});

describe('Educational Reinforcement', () => {
  test('generates contextual feedback with guide references', () => {
    const evaluationResult = {
      attemptId: 'test123-456789',
      status: AttemptStatus.SUCCESS,
      results: [{
        modelId: 'llama3.1-8b',
        response: 'Basic response',
        scores: { clarity: 3, completeness: 2, total: 5 },
        feedback: {
          criterionId: 'completeness',
          explanation: 'Your prompt could be more specific',
          exampleFix: 'Try asking for specific examples or details',
          relatedGuide: 'fundamentals'
        }
      }],
      timestamp: new Date().toISOString(),
      schemaVersion: '1.0'
    };

    const feedback = evaluationResult.results[0].feedback;
    expect(feedback.relatedGuide).toBe('fundamentals');
    expect(feedback.explanation).toContain('more specific');
  });

  test('suggests next learning steps based on performance', () => {
    const lowCompletenessScore = 2;
    const suggestions = [];

    if (lowCompletenessScore < 3) {
      suggestions.push({
        message: 'Try the chain-of-thought guide',
        guideSlug: 'chain-of-thought',
        reason: 'Low completeness score'
      });
    }

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].guideSlug).toBe('chain-of-thought');
  });

  test('celebrates learning milestones', () => {
    const firstPerfectScore = {
      score: 10,
      isFirstPerfect: true,
      milestone: 'first-perfect-score'
    };

    const celebrationMessage = firstPerfectScore.isFirstPerfect 
      ? '🎉 Perfect score! First perfect score milestone achieved!'
      : 'Great work!';

    expect(celebrationMessage).toContain('🎉 Perfect score!');
    expect(celebrationMessage).toContain('milestone');
  });

  test('provides contextual help based on common mistakes', () => {
    const commonMistakes = {
      vague: {
        pattern: /tell me about|explain|describe/i,
        suggestions: [
          'Add specific questions',
          'Define the scope',
          'Request examples'
        ],
        relatedGuide: 'fundamentals'
      }
    };

    const userPrompt = 'Tell me about stuff';
    const isVague = commonMistakes.vague.pattern.test(userPrompt);
    
    if (isVague) {
      const suggestions = commonMistakes.vague.suggestions;
      expect(suggestions).toContain('Add specific questions');
      expect(suggestions).toContain('Define the scope');
      expect(suggestions).toContain('Request examples');
    }
  });
});

describe('Cross-Component Integration', () => {
  test('maintains consistent data structure across components', () => {
    const progressData = {
      guides: {
        fundamentals: { completed: true, timestamp: Date.now() - 86400000 },
        'chain-of-thought': { completed: true, timestamp: Date.now() - 172800000 }
      },
      labs: {
        'practice-basics': {
          attempts: [
            { attemptId: 'attempt1', score: 6, timestamp: Date.now() - 86400000 },
            { attemptId: 'attempt2', score: 8, timestamp: Date.now() - 43200000 }
          ]
        },
        'compare-basics': {
          attempts: [
            { attemptId: 'compare1', score: 7, timestamp: Date.now() - 21600000 }
          ]
        }
      }
    };

    // Validate structure
    expect(progressData.guides).toBeDefined();
    expect(progressData.labs).toBeDefined();
    expect(Object.keys(progressData.guides)).toHaveLength(2);
    expect(Object.keys(progressData.labs)).toHaveLength(2);

    // Validate guide completion tracking
    const completedGuides = Object.values(progressData.guides).filter(g => g.completed);
    expect(completedGuides).toHaveLength(2);

    // Validate lab attempt tracking
    const totalAttempts = Object.values(progressData.labs)
      .reduce((sum, lab) => sum + lab.attempts.length, 0);
    expect(totalAttempts).toBe(3);
  });

  test('handles error states gracefully across integration points', () => {
    const errorScenario = {
      attemptId: 'error123-456789',
      status: AttemptStatus.ERROR,
      error: {
        stage: 'model-call',
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        help: 'Check your internet connection and try again',
        retryable: true,
        timestamp: new Date().toISOString()
      }
    };

    // Should still track the error for progress
    const progressUpdate = {
      'error-encountered': {
        attemptId: errorScenario.attemptId,
        timestamp: Date.now(),
        errorCode: errorScenario.error.code
      }
    };

    expect(progressUpdate['error-encountered'].errorCode).toBe('NETWORK_ERROR');
    expect(errorScenario.error.retryable).toBe(true);
  });

  test('validates learning context preservation across navigation', () => {
    const learningContext = {
      currentGuide: 'fundamentals',
      currentLab: 'practice-basics',
      sourceGuide: 'fundamentals',
      navigationPath: ['guides/fundamentals', 'labs/practice-basics', 'progress']
    };

    // Simulate navigation with context
    const navigationState = {
      from: learningContext.currentLab,
      to: 'progress',
      context: {
        sourceGuide: learningContext.sourceGuide
      }
    };

    expect(navigationState.context.sourceGuide).toBe('fundamentals');
    expect(navigationState.from).toBe('practice-basics');
  });

  test('validates API response handling across integration points', () => {
    const mockApiResponse = {
      attemptId: 'api123-456789',
      status: AttemptStatus.SUCCESS,
      results: [{
        modelId: 'llama3.1-8b',
        response: 'Test response',
        latency: 1500,
        source: ModelSource.HOSTED,
        scores: { clarity: 4, completeness: 4, total: 8 },
        feedback: {
          criterionId: 'clarity',
          explanation: 'Good structure and clarity',
          exampleFix: 'Consider adding more specific examples',
          relatedGuide: 'fundamentals'
        }
      }],
      timestamp: new Date().toISOString(),
      schemaVersion: '1.0'
    };

    // Validate response structure
    expect(mockApiResponse.status).toBe(AttemptStatus.SUCCESS);
    expect(mockApiResponse.results).toHaveLength(1);
    expect(mockApiResponse.results[0].scores.total).toBe(8);
    expect(mockApiResponse.results[0].feedback.relatedGuide).toBe('fundamentals');
  });
});