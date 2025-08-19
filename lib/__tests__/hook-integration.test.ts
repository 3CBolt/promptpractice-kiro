import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { processAttemptFile, processAttemptDirect } from '../../.kiro/hooks/onAttemptCreated';
import { writeAttempt, createAttempt, readEvaluation, hasEvaluation, hasEvaluationError } from '@/lib/storage';

// Test data directory
const TEST_DATA_DIR = join(process.cwd(), 'data-test');

describe('Hook Integration Tests', () => {
  beforeEach(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Clean up test directory
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
    
    // Create test directories
    await fs.mkdir(join(TEST_DATA_DIR, 'attempts'), { recursive: true });
    await fs.mkdir(join(TEST_DATA_DIR, 'evaluations'), { recursive: true });
    
    // Small delay to ensure directories are created
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should validate attempt schema correctly', async () => {
    const validAttempt = createAttempt(
      'practice-basics',
      'Test prompt',
      ['local-stub']
    );

    await writeAttempt(validAttempt);
    
    // This should not throw
    await expect(processAttemptDirect(validAttempt.id)).resolves.not.toThrow();
  });

  it('should handle invalid attempt schema', async () => {
    const invalidAttempt = {
      id: 'test-invalid',
      labId: 'practice-basics',
      userPrompt: '', // Invalid - empty prompt
      models: [],     // Invalid - empty models array
      createdAt: new Date().toISOString()
    };

    // Write invalid attempt directly to file
    const filePath = join(TEST_DATA_DIR, 'attempts', `${invalidAttempt.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(invalidAttempt, null, 2));

    // Process should handle the error gracefully
    await processAttemptDirect(invalidAttempt.id);
    
    // Should have created an error file
    expect(await hasEvaluationError(invalidAttempt.id)).toBe(true);
  });

  it('should implement idempotency correctly', async () => {
    const attempt = createAttempt(
      'practice-basics',
      'Test prompt for idempotency',
      ['local-stub']
    );

    await writeAttempt(attempt);
    
    // Process first time
    await processAttemptDirect(attempt.id);
    expect(await hasEvaluation(attempt.id)).toBe(true);
    
    const firstEvaluation = await readEvaluation(attempt.id);
    
    // Process second time - should skip
    await processAttemptDirect(attempt.id);
    
    const secondEvaluation = await readEvaluation(attempt.id);
    
    // Should be the same evaluation (not reprocessed)
    expect(firstEvaluation?.createdAt).toBe(secondEvaluation?.createdAt);
  });

  it('should handle path traversal attacks', async () => {
    const maliciousAttempt = {
      id: '../../../etc/passwd', // Path traversal attempt
      labId: 'practice-basics',
      userPrompt: 'Test prompt',
      models: ['local-stub'],
      createdAt: new Date().toISOString()
    };

    // Write malicious attempt
    const safeId = 'malicious-test';
    const filePath = join(TEST_DATA_DIR, 'attempts', `${safeId}.json`);
    await fs.writeFile(filePath, JSON.stringify(maliciousAttempt, null, 2));

    // Process should handle the security error
    await processAttemptDirect(safeId);
    
    // Should have created an error file due to invalid characters
    expect(await hasEvaluationError(safeId)).toBe(true);
  });

  it('should validate prompt length limits', async () => {
    const longPrompt = 'a'.repeat(2001); // Exceeds 2000 character limit
    
    const attempt = createAttempt(
      'practice-basics',
      longPrompt,
      ['local-stub']
    );

    await writeAttempt(attempt);
    
    // Process should handle the validation error
    await processAttemptDirect(attempt.id);
    
    // Should have created an error file
    expect(await hasEvaluationError(attempt.id)).toBe(true);
  });

  it('should validate model limits', async () => {
    const attempt = createAttempt(
      'compare-basics',
      'Test prompt',
      ['model1', 'model2', 'model3', 'model4'] // Exceeds 3 model limit
    );

    await writeAttempt(attempt);
    
    // Process should handle the validation error
    await processAttemptDirect(attempt.id);
    
    // Should have created an error file
    expect(await hasEvaluationError(attempt.id)).toBe(true);
  });

  it('should process valid attempt successfully', async () => {
    const attempt = createAttempt(
      'practice-basics',
      'What is the capital of France?',
      ['local-stub']
    );

    await writeAttempt(attempt);
    
    // Process the attempt
    await processAttemptDirect(attempt.id);
    
    // Should have created evaluation
    expect(await hasEvaluation(attempt.id)).toBe(true);
    
    const evaluation = await readEvaluation(attempt.id);
    expect(evaluation).toBeTruthy();
    expect(evaluation?.attemptId).toBe(attempt.id);
    expect(evaluation?.perModelResults).toHaveLength(1);
    expect(evaluation?.perModelResults[0].modelId).toBe('local-stub');
  });
});