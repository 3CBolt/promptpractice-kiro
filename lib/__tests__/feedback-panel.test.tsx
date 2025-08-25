/**
 * Tests for FeedbackPanel component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { FeedbackPanel } from '@/components/FeedbackPanel';
import { Evaluation, Attempt, AttemptStatus } from '@/types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

describe('FeedbackPanel', () => {
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
        },
        feedback: {
          criterionId: 'clarity',
          explanation: 'Good clarity overall',
          exampleFix: 'Try being more specific',
          relatedGuide: 'fundamentals'
        }
      }
    ],
    rubricVersion: '1.0',
    timestamp: '2024-01-01T00:00:00Z',
    schemaVersion: '1.0'
  };

  const mockOnResubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders feedback panel with evaluation results', () => {
    render(
      <FeedbackPanel
        evaluation={mockEvaluation}
        attempt={mockAttempt}
        onResubmit={mockOnResubmit}
      />
    );

    expect(screen.getByText('📝 Feedback & Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Overall Score: 7/10')).toBeInTheDocument();
    expect(screen.getByText('Detailed Feedback')).toBeInTheDocument();
  });

  it('shows criterion feedback for clarity and completeness', () => {
    render(
      <FeedbackPanel
        evaluation={mockEvaluation}
        attempt={mockAttempt}
        onResubmit={mockOnResubmit}
      />
    );

    // Check for criterion headings (should be in h4 elements)
    const clarityHeadings = screen.getAllByRole('heading', { level: 4 }).filter(h => h.textContent === 'clarity');
    const completenessHeadings = screen.getAllByRole('heading', { level: 4 }).filter(h => h.textContent === 'completeness');
    expect(clarityHeadings).toHaveLength(1);
    expect(completenessHeadings).toHaveLength(1);
    expect(screen.getByText('4/5')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('displays what went well section', () => {
    render(
      <FeedbackPanel
        evaluation={mockEvaluation}
        attempt={mockAttempt}
        onResubmit={mockOnResubmit}
      />
    );

    expect(screen.getByText('What Went Well')).toBeInTheDocument();
  });

  it('shows resubmit button and calls onResubmit when clicked', () => {
    render(
      <FeedbackPanel
        evaluation={mockEvaluation}
        attempt={mockAttempt}
        onResubmit={mockOnResubmit}
      />
    );

    const resubmitButton = screen.getByText('🔄 Try Again with New Prompt');
    expect(resubmitButton).toBeInTheDocument();

    fireEvent.click(resubmitButton);
    expect(mockOnResubmit).toHaveBeenCalledTimes(1);
    expect(mockOnResubmit).toHaveBeenCalledWith(expect.any(String));
  });

  it('handles guide links correctly', () => {
    render(
      <FeedbackPanel
        evaluation={mockEvaluation}
        attempt={mockAttempt}
        onResubmit={mockOnResubmit}
      />
    );

    const guideLink = screen.getByText(/Learn more about clarity/);
    expect(guideLink).toBeInTheDocument();

    fireEvent.click(guideLink);
    expect(window.location.href).toBe('/guides/fundamentals');
  });

  it('shows no feedback message when no results available', () => {
    const emptyEvaluation: Evaluation = {
      ...mockEvaluation,
      results: []
    };

    render(
      <FeedbackPanel
        evaluation={emptyEvaluation}
        attempt={mockAttempt}
        onResubmit={mockOnResubmit}
      />
    );

    expect(screen.getByText('No feedback available yet. Please try submitting your prompt.')).toBeInTheDocument();
  });

  it('displays general improvement tips', () => {
    render(
      <FeedbackPanel
        evaluation={mockEvaluation}
        attempt={mockAttempt}
        onResubmit={mockOnResubmit}
      />
    );

    expect(screen.getByText('💡 General Tips')).toBeInTheDocument();
    expect(screen.getByText('Be specific about what you want the AI to do')).toBeInTheDocument();
    expect(screen.getByText('Provide context and examples when helpful')).toBeInTheDocument();
  });

  it('uses encouraging colors for scores', () => {
    const highScoreEvaluation: Evaluation = {
      ...mockEvaluation,
      results: [
        {
          ...mockEvaluation.results![0],
          scores: {
            clarity: 5,
            completeness: 5,
            total: 10
          }
        }
      ]
    };

    render(
      <FeedbackPanel
        evaluation={highScoreEvaluation}
        attempt={mockAttempt}
        onResubmit={mockOnResubmit}
      />
    );

    expect(screen.getByText('Overall Score: 10/10')).toBeInTheDocument();
  });
});