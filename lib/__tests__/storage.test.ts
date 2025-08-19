import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import {
  writeAttempt,
  readAttempt,
  listAttempts,
  writeEvaluation,
  readEvaluation,
  writeEvaluationError,
  hasEvaluation,
  hasEvaluationError,
  listEvaluations,
  createAttempt,
  createEvaluation
} from '../storage';
import { generateId } from '../utils';
import { Attempt, Evaluation } from '@/types';

// Set test environment
process.env.NODE_ENV = 'test';

const TEST_DATA_DIR = join(process.cwd(), 'data-test');
const TEST_ATTEMPTS_DIR = join(TEST_DATA_DIR, 'attempts');
const TEST_EVALUATIONS_DIR = join(TEST_DATA_DIR, 'evaluations');

beforeEach(async () => {
  // Clean up any existing test data
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
});

afterEach(async () => {
  // Clean up test directories
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
});

describe('Storage utilities', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    });
  });

  describe('createAttempt', () => {
    it('should create attempt with generated ID and timestamp', () => {
      const attempt = createAttempt('practice-basics', 'Test prompt', ['llama3.1-8b']);
      
      expect(attempt.id).toBeDefined();
      expect(attempt.labId).toBe('practice-basics');
      expect(attempt.userPrompt).toBe('Test prompt');
      expect(attempt.models).toEqual(['llama3.1-8b']);
      expect(attempt.createdAt).toBeDefined();
      expect(new Date(attempt.createdAt)).toBeInstanceOf(Date);
    });

    it('should include system prompt when provided', () => {
      const attempt = createAttempt('compare-basics', 'Test prompt', ['llama3.1-8b'], 'System prompt');
      
      expect(attempt.systemPrompt).toBe('System prompt');
    });
  });

  describe('Attempt storage', () => {
    it('should write and read attempts correctly', async () => {
      const attempt = createAttempt('practice-basics', 'Test prompt', ['llama3.1-8b']);
      
      await writeAttempt(attempt);
      const readAttemptResult = await readAttempt(attempt.id);
      
      expect(readAttemptResult).toEqual(attempt);
    });

    it('should return null for non-existent attempt', async () => {
      const result = await readAttempt('non-existent-id');
      expect(result).toBeNull();
    });

    it('should list attempts correctly', async () => {
      const attempt1 = createAttempt('practice-basics', 'Test 1', ['llama3.1-8b']);
      const attempt2 = createAttempt('compare-basics', 'Test 2', ['mistral-7b']);
      
      await writeAttempt(attempt1);
      await writeAttempt(attempt2);
      
      const attemptIds = await listAttempts();
      expect(attemptIds).toContain(attempt1.id);
      expect(attemptIds).toContain(attempt2.id);
      expect(attemptIds).toHaveLength(2);
    });
  });

  describe('Evaluation storage', () => {
    it('should write and read evaluations correctly', async () => {
      const evaluation = createEvaluation('test-attempt-id', [
        {
          modelId: 'llama3.1-8b',
          text: 'Test response',
          latencyMs: 1500,
          source: 'hosted',
          score: 8,
          breakdown: { clarity: 4, completeness: 4 },
          notes: 'Good response'
        }
      ]);
      
      await writeEvaluation(evaluation);
      const readEvaluationResult = await readEvaluation(evaluation.attemptId);
      
      expect(readEvaluationResult).toEqual(evaluation);
    });

    it('should return null for non-existent evaluation', async () => {
      const result = await readEvaluation('non-existent-id');
      expect(result).toBeNull();
    });

    it('should write evaluation errors correctly', async () => {
      const attemptId = 'test-attempt-id';
      const error = new Error('Test error message');
      
      await writeEvaluationError(attemptId, error);
      
      const hasError = await hasEvaluationError(attemptId);
      expect(hasError).toBe(true);
    });

    it('should check evaluation existence correctly', async () => {
      const evaluation = createEvaluation('test-attempt-id', []);
      
      expect(await hasEvaluation(evaluation.attemptId)).toBe(false);
      
      await writeEvaluation(evaluation);
      
      expect(await hasEvaluation(evaluation.attemptId)).toBe(true);
    });

    it('should list evaluations correctly', async () => {
      const eval1 = createEvaluation('attempt-1', []);
      const eval2 = createEvaluation('attempt-2', []);
      
      await writeEvaluation(eval1);
      await writeEvaluation(eval2);
      await writeEvaluationError('attempt-3', new Error('Test error'));
      
      const evaluationIds = await listEvaluations();
      expect(evaluationIds).toContain('attempt-1');
      expect(evaluationIds).toContain('attempt-2');
      expect(evaluationIds).not.toContain('attempt-3'); // Error files should not be included
      expect(evaluationIds).toHaveLength(2);
    });
  });

  describe('JSON formatting', () => {
    it('should write pretty-printed JSON with 2-space indentation', async () => {
      const attempt = createAttempt('practice-basics', 'Test prompt', ['llama3.1-8b']);
      await writeAttempt(attempt);
      
      const filePath = join(TEST_ATTEMPTS_DIR, `${attempt.id}.json`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      
      // Check that it's pretty-printed (contains newlines and proper indentation)
      expect(fileContent).toContain('\n');
      expect(fileContent).toContain('  "id":'); // 2-space indentation
      expect(fileContent).toContain('  "labId":');
      
      // Verify it's valid JSON
      const parsed = JSON.parse(fileContent);
      expect(parsed).toEqual(attempt);
    });
  });
});