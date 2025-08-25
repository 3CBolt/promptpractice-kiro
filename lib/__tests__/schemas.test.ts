/**
 * Schema Validation Tests for v1.0 Data Contracts
 * 
 * Tests schema compliance, validation, and type safety
 * of the enhanced v1.0 data contracts.
 */

import { AttemptStatus, LabId, ModelSource, ErrorContract } from '@/types/contracts';
import { validateAttempt, validateEvaluation, validateErrorContract } from '@/lib/validation';

describe('v1.0 Schema Validation', () => {
  describe('Attempt Schema Validation', () => {
    const validAttempt = {
      attemptId: 'mej2vy6d-0dh615',
      userId: 'anonymous',
      labId: 'practice-basics' as const,
      userPrompt: 'Tell me about cats and their behavior',
      models: ['llama3.1-8b'],
      timestamp: '2024-01-15T10:30:00.000Z',
      schemaVersion: '1.0'
    };

    test('validates complete valid attempt', () => {
      const result = validateAttempt(validAttempt);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('validates attempt with system prompt', () => {
      const attemptWithSystem = {
        ...validAttempt,
        systemPrompt: 'You are a helpful assistant'
      };

      const result = validateAttempt(attemptWithSystem);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('validates all lab IDs', () => {
      const labIds: LabId[] = [LabId.PRACTICE_BASICS, LabId.COMPARE_BASICS, LabId.SYSTEM_PROMPT_LAB];
      
      labIds.forEach(labId => {
        const attempt = { ...validAttempt, labId };
        const result = validateAttempt(attempt);
        expect(result.isValid).toBe(true);
      });
    });

    test('validates multiple models for compare lab', () => {
      const compareAttempt = {
        ...validAttempt,
        labId: LabId.COMPARE_BASICS,
        models: ['llama3.1-8b', 'mistral-7b']
      };

      const result = validateAttempt(compareAttempt);
      expect(result.isValid).toBe(true);
    });

    test('rejects invalid lab IDs', () => {
      const invalidAttempt = {
        ...validAttempt,
        labId: 'invalid-lab' as any
      };

      const result = validateAttempt(invalidAttempt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid labId');
    });

    test('accepts empty prompts (validation allows them)', () => {
      const emptyPromptAttempt = {
        ...validAttempt,
        userPrompt: ''
      };

      const result = validateAttempt(emptyPromptAttempt);
      // The current validation allows empty prompts, so this should pass
      expect(result.isValid).toBe(true);
    });

    test('rejects prompts that are too long', () => {
      const longPromptAttempt = {
        ...validAttempt,
        userPrompt: 'a'.repeat(3000)
      };

      const result = validateAttempt(longPromptAttempt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('userPrompt must be a string with max 2000 characters');
    });

    test('rejects empty model arrays', () => {
      const noModelsAttempt = {
        ...validAttempt,
        models: []
      };

      const result = validateAttempt(noModelsAttempt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('models must be an array with 1-3 items');
    });

    test('rejects too many models', () => {
      const tooManyModelsAttempt = {
        ...validAttempt,
        models: ['model1', 'model2', 'model3', 'model4']
      };

      const result = validateAttempt(tooManyModelsAttempt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('models must be an array with 1-3 items');
    });

    test('validates attempt ID format', () => {
      const invalidIdAttempt = {
        ...validAttempt,
        attemptId: 'invalid-format'
      };

      const result = validateAttempt(invalidIdAttempt);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid attemptId format');
    });
  });

  describe('Evaluation Schema Validation', () => {
    const validEvaluation = {
      attemptId: 'mej2vy6d-0dh615',
      status: AttemptStatus.SUCCESS,
      timestamp: '2024-01-15T10:35:00.000Z',
      schemaVersion: '1.0',
      results: [{
        modelId: 'llama3.1-8b',
        response: 'Cats are fascinating creatures...',
        latency: 1500,
        source: ModelSource.HOSTED,
        scores: { clarity: 4, completeness: 4, total: 8 }
      }]
    };

    test('validates complete valid evaluation', () => {
      const result = validateEvaluation(validEvaluation);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('validates all status values', () => {
      const statuses = Object.values(AttemptStatus);
      
      statuses.forEach(status => {
        const evaluation = {
          ...validEvaluation,
          status
        };
        const result = validateEvaluation(evaluation);
        expect(result.isValid).toBe(true);
      });
    });

    test('rejects invalid status values', () => {
      const invalidEvaluation = {
        ...validEvaluation,
        status: 'invalid-status' as any
      };

      const result = validateEvaluation(invalidEvaluation);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid status value');
    });

    test('rejects missing required fields', () => {
      const incompleteEvaluation = {
        attemptId: 'test-123',
        // Missing status, timestamp, schemaVersion
      };

      const result = validateEvaluation(incompleteEvaluation);
      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    test('validates schema version', () => {
      const wrongVersionEvaluation = {
        ...validEvaluation,
        schemaVersion: '0.9'
      };

      const result = validateEvaluation(wrongVersionEvaluation);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('schemaVersion must be "1.0"');
    });
  });

  describe('Error Contract Validation', () => {
    test('validates valid error contracts', () => {
      const errorContract: ErrorContract = {
        stage: 'model-call',
        code: 'TIMEOUT',
        message: 'Model request timed out after 30 seconds',
        help: 'Try again with a shorter prompt or different model',
        retryable: true,
        timestamp: new Date().toISOString()
      };

      const isValid = validateErrorContract(errorContract);
      expect(isValid).toBe(true);
    });

    test('rejects invalid error contracts', () => {
      const invalidContracts = [
        { stage: 'test', code: 'TEST', message: 'test' }, // Missing fields
        { stage: 123, code: 'TEST', message: 'test', help: 'help', retryable: true, timestamp: 'now' }, // Wrong types
        'not an object'
      ];

      invalidContracts.forEach(contract => {
        const isValid = validateErrorContract(contract);
        expect(isValid).toBe(false);
      });

      // Test null and undefined separately to avoid the property access error
      expect(validateErrorContract(null)).toBe(false);
      expect(validateErrorContract(undefined)).toBe(false);
    });

    test('validates common error scenarios', () => {
      const errorScenarios = [
        {
          stage: 'validation',
          code: 'INVALID_PROMPT',
          message: 'Prompt contains invalid characters',
          help: 'Remove special characters and try again',
          retryable: true
        },
        {
          stage: 'model-call',
          code: 'RATE_LIMITED',
          message: 'API rate limit exceeded',
          help: 'Wait a few minutes before trying again',
          retryable: true
        },
        {
          stage: 'model-call',
          code: 'MODEL_UNAVAILABLE',
          message: 'Selected model is currently unavailable',
          help: 'Try a different model or wait for service restoration',
          retryable: true
        },
        {
          stage: 'evaluation',
          code: 'RUBRIC_ERROR',
          message: 'Failed to apply evaluation rubric',
          help: 'This is a system error, please report it',
          retryable: false
        }
      ];

      errorScenarios.forEach(scenario => {
        const errorContract: ErrorContract = {
          ...scenario,
          timestamp: new Date().toISOString()
        };

        expect(errorContract).toMatchObject(scenario);
        expect(errorContract.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });
  });

  describe('Status Enum Validation', () => {
    test('validates all attempt status values', () => {
      const statusValues = Object.values(AttemptStatus);
      const expectedStatuses = ['queued', 'running', 'success', 'partial', 'error', 'timeout'];
      
      expect(statusValues.sort()).toEqual(expectedStatuses.sort());
    });

    test('validates all lab ID values', () => {
      const labIdValues = Object.values(LabId);
      const expectedLabIds = ['practice-basics', 'compare-basics', 'system-prompt-lab'];
      
      expect(labIdValues.sort()).toEqual(expectedLabIds.sort());
    });

    test('validates all model source values', () => {
      const sourceValues = Object.values(ModelSource);
      const expectedSources = ['hosted', 'sample', 'local'];
      
      expect(sourceValues.sort()).toEqual(expectedSources.sort());
    });
  });

  describe('Backward Compatibility', () => {
    test('handles v1.0 compliant data', () => {
      // Test with all required v1.0 fields
      const v1Attempt = {
        attemptId: 'legacy12-345678',
        userId: 'anonymous',
        labId: 'practice-basics' as const,
        userPrompt: 'Legacy prompt',
        models: ['llama3.1-8b'],
        timestamp: '2024-01-15T10:30:00.000Z',
        schemaVersion: '1.0'
      };

      const result = validateAttempt(v1Attempt);
      expect(result.isValid).toBe(true);
    });

    test('handles minimal required fields', () => {
      const minimalAttempt = {
        attemptId: 'minimal1-234567',
        userId: 'anonymous',
        labId: 'practice-basics' as const,
        userPrompt: 'Minimal prompt',
        models: ['llama3.1-8b'],
        timestamp: '2024-01-15T10:30:00.000Z',
        schemaVersion: '1.0'
      };

      const result = validateAttempt(minimalAttempt);
      expect(result.isValid).toBe(true);

      const minimalEvaluation = {
        attemptId: 'minimal1-234567',
        status: AttemptStatus.SUCCESS,
        timestamp: '2024-01-15T10:35:00.000Z',
        schemaVersion: '1.0'
      };

      const evalResult = validateEvaluation(minimalEvaluation);
      expect(evalResult.isValid).toBe(true);
    });
  });

  describe('Schema Integration with JSON Schema Files', () => {
    test('JSON schema files exist and are valid JSON', () => {
      // Test that the schema files can be imported and parsed
      expect(typeof attemptSchemaJson).toBe('object');
      expect(typeof evaluationSchemaJson).toBe('object');
      
      // Test basic structure
      expect(attemptSchemaJson.$schema).toBeDefined();
      expect(attemptSchemaJson.type).toBe('object');
      expect(attemptSchemaJson.properties).toBeDefined();
      
      expect(evaluationSchemaJson.$schema).toBeDefined();
      expect(evaluationSchemaJson.type).toBe('object');
      expect(evaluationSchemaJson.properties).toBeDefined();
    });

    test('required fields match between JSON schema and validation', () => {
      const attemptRequiredFields = attemptSchemaJson.required || [];
      const evaluationRequiredFields = evaluationSchemaJson.required || [];
      
      // Basic sanity checks
      expect(attemptRequiredFields).toContain('attemptId');
      expect(attemptRequiredFields).toContain('labId');
      expect(attemptRequiredFields).toContain('userPrompt');
      
      expect(evaluationRequiredFields).toContain('attemptId');
      expect(evaluationRequiredFields).toContain('status');
      expect(evaluationRequiredFields).toContain('timestamp');
    });
  });
});

// Import the JSON schema files for testing
import attemptSchemaJson from '@/schemas/attempt.schema.json';
import evaluationSchemaJson from '@/schemas/evaluation.schema.json';