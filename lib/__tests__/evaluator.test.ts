import { describe, it, expect } from 'vitest';
import { 
  evaluateResponse, 
  evaluateMultipleResponses, 
  formatEvaluationResult,
  type EvaluationResult 
} from '../evaluator';
import { ModelResult } from '@/types';

describe('Evaluator', () => {
  const mockModelResult: ModelResult = {
    modelId: 'test-model',
    text: '',
    latencyMs: 100,
    source: 'sample'
  };

  describe('evaluateResponse', () => {
    it('should evaluate a good quality response with high scores', () => {
      const userPrompt = 'Explain the concept of machine learning in simple terms';
      const goodResponse: ModelResult = {
        ...mockModelResult,
        text: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed. It works by finding patterns in large datasets and using these patterns to make predictions or classifications on new, unseen data. Common applications include recommendation systems, image recognition, and natural language processing.'
      };

      const result = evaluateResponse(userPrompt, goodResponse);

      expect(result.score).toBeGreaterThanOrEqual(6);
      expect(result.breakdown.clarity).toBeGreaterThanOrEqual(3);
      expect(result.breakdown.completeness).toBeGreaterThanOrEqual(3);
      expect(result.notes).toBeDefined();
      expect(typeof result.notes).toBe('string');
    });

    it('should evaluate a poor quality response with low scores', () => {
      const userPrompt = 'Explain the concept of machine learning in simple terms';
      const poorResponse: ModelResult = {
        ...mockModelResult,
        text: 'ML is thing'
      };

      const result = evaluateResponse(userPrompt, poorResponse);

      expect(result.score).toBeLessThanOrEqual(4);
      expect(result.breakdown.clarity).toBeLessThanOrEqual(2);
      expect(result.breakdown.completeness).toBeLessThanOrEqual(2);
      expect(result.notes).toContain('Clarity');
    });

    it('should evaluate a medium quality response with moderate scores', () => {
      const userPrompt = 'What is the weather like today?';
      const mediumResponse: ModelResult = {
        ...mockModelResult,
        text: 'The weather today is sunny and warm. It is a nice day to go outside and enjoy the sunshine.'
      };

      const result = evaluateResponse(userPrompt, mediumResponse);

      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.score).toBeLessThanOrEqual(8);
      expect(result.breakdown.clarity).toBeGreaterThanOrEqual(2);
      expect(result.breakdown.completeness).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty responses', () => {
      const userPrompt = 'Tell me about cats';
      const emptyResponse: ModelResult = {
        ...mockModelResult,
        text: ''
      };

      const result = evaluateResponse(userPrompt, emptyResponse);

      expect(result.score).toBeLessThanOrEqual(4);
      expect(result.breakdown.clarity).toBeLessThanOrEqual(2);
      expect(result.breakdown.completeness).toBeLessThanOrEqual(2);
    });

    it('should be deterministic for the same input', () => {
      const userPrompt = 'Explain photosynthesis';
      const response: ModelResult = {
        ...mockModelResult,
        text: 'Photosynthesis is the process by which plants convert sunlight into energy. It involves chlorophyll capturing light energy and converting carbon dioxide and water into glucose and oxygen.'
      };

      const result1 = evaluateResponse(userPrompt, response);
      const result2 = evaluateResponse(userPrompt, response);

      expect(result1.score).toBe(result2.score);
      expect(result1.breakdown.clarity).toBe(result2.breakdown.clarity);
      expect(result1.breakdown.completeness).toBe(result2.breakdown.completeness);
      expect(result1.notes).toBe(result2.notes);
    });
  });

  describe('evaluateMultipleResponses', () => {
    it('should evaluate multiple responses and return array of results', () => {
      const userPrompt = 'What is JavaScript?';
      const responses: ModelResult[] = [
        {
          ...mockModelResult,
          modelId: 'model-1',
          text: 'JavaScript is a programming language used for web development. It runs in browsers and enables interactive websites.'
        },
        {
          ...mockModelResult,
          modelId: 'model-2',
          text: 'JS is code'
        }
      ];

      const results = evaluateMultipleResponses(userPrompt, responses);

      expect(results).toHaveLength(2);
      expect(results[0].score).toBeGreaterThan(results[1].score);
      expect(results[0].breakdown.clarity).toBeGreaterThan(results[1].breakdown.clarity);
    });

    it('should handle empty array', () => {
      const userPrompt = 'Test prompt';
      const responses: ModelResult[] = [];

      const results = evaluateMultipleResponses(userPrompt, responses);

      expect(results).toHaveLength(0);
    });
  });

  describe('formatEvaluationResult', () => {
    it('should format evaluation result correctly', () => {
      const evaluation: EvaluationResult = {
        score: 7,
        breakdown: {
          clarity: 4,
          completeness: 3
        },
        notes: 'Good response with room for improvement'
      };

      const formatted = formatEvaluationResult(evaluation);

      expect(formatted.scoreDisplay).toBe('7/10');
      expect(formatted.breakdownDisplay).toBe('Clarity: 4/5, Completeness: 3/5');
      expect(formatted.notesDisplay).toBe('Good response with room for improvement');
    });

    it('should handle perfect scores', () => {
      const evaluation: EvaluationResult = {
        score: 10,
        breakdown: {
          clarity: 5,
          completeness: 5
        },
        notes: 'Excellent response!'
      };

      const formatted = formatEvaluationResult(evaluation);

      expect(formatted.scoreDisplay).toBe('10/10');
      expect(formatted.breakdownDisplay).toBe('Clarity: 5/5, Completeness: 5/5');
    });

    it('should handle zero scores', () => {
      const evaluation: EvaluationResult = {
        score: 0,
        breakdown: {
          clarity: 0,
          completeness: 0
        },
        notes: 'Response needs significant improvement'
      };

      const formatted = formatEvaluationResult(evaluation);

      expect(formatted.scoreDisplay).toBe('0/10');
      expect(formatted.breakdownDisplay).toBe('Clarity: 0/5, Completeness: 0/5');
    });
  });

  describe('Score boundaries and edge cases', () => {
    it('should never exceed maximum scores', () => {
      const userPrompt = 'Test prompt';
      const response: ModelResult = {
        ...mockModelResult,
        text: 'This is an exceptionally well-written, comprehensive, and detailed response that addresses every aspect of the prompt with perfect clarity, excellent grammar, logical structure, and provides valuable insights beyond the basic requirements. It demonstrates deep understanding and expertise in the subject matter.'
      };

      const result = evaluateResponse(userPrompt, response);

      expect(result.score).toBeLessThanOrEqual(10);
      expect(result.breakdown.clarity).toBeLessThanOrEqual(5);
      expect(result.breakdown.completeness).toBeLessThanOrEqual(5);
    });

    it('should never go below minimum scores', () => {
      const userPrompt = 'Test prompt';
      const response: ModelResult = {
        ...mockModelResult,
        text: '!@#$%^&*()'
      };

      const result = evaluateResponse(userPrompt, response);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.clarity).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.completeness).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long responses appropriately', () => {
      const userPrompt = 'Explain AI';
      const longText = 'AI is artificial intelligence. '.repeat(200);
      const response: ModelResult = {
        ...mockModelResult,
        text: longText
      };

      const result = evaluateResponse(userPrompt, response);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(10);
      expect(result.notes).toBeDefined();
    });
  });
});