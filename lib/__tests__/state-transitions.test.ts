/**
 * State Transition Tests for Attempt Processing
 * 
 * Tests all six status states (queued, running, success, partial, error, timeout)
 * and error scenarios, focusing on the core state machine logic.
 */

import { AttemptStatus, ErrorContract } from '@/types/contracts';

describe('Status State Transitions', () => {
  describe('Status Enum Values', () => {
    test('contains all expected status values', () => {
      const expectedStatuses = ['queued', 'running', 'success', 'partial', 'error', 'timeout'];
      const actualStatuses = Object.values(AttemptStatus);
      
      expect(actualStatuses.sort()).toEqual(expectedStatuses.sort());
    });

    test('status values are strings', () => {
      Object.values(AttemptStatus).forEach(status => {
        expect(typeof status).toBe('string');
      });
    });
  });

  describe('State Machine Logic', () => {
    test('validates terminal states', () => {
      const terminalStates = [AttemptStatus.SUCCESS];
      const nonTerminalStates = [
        AttemptStatus.QUEUED,
        AttemptStatus.RUNNING,
        AttemptStatus.PARTIAL,
        AttemptStatus.ERROR,
        AttemptStatus.TIMEOUT
      ];

      terminalStates.forEach(status => {
        expect(isTerminalState(status)).toBe(true);
      });

      nonTerminalStates.forEach(status => {
        expect(isTerminalState(status)).toBe(false);
      });
    });

    test('validates retryable states', () => {
      const retryableStates = [AttemptStatus.ERROR, AttemptStatus.TIMEOUT];
      const nonRetryableStates = [
        AttemptStatus.QUEUED,
        AttemptStatus.RUNNING,
        AttemptStatus.SUCCESS,
        AttemptStatus.PARTIAL
      ];

      retryableStates.forEach(status => {
        expect(isRetryableState(status)).toBe(true);
      });

      nonRetryableStates.forEach(status => {
        expect(isRetryableState(status)).toBe(false);
      });
    });

    test('validates allowed transitions', () => {
      const validTransitions = [
        [AttemptStatus.QUEUED, AttemptStatus.RUNNING],
        [AttemptStatus.QUEUED, AttemptStatus.ERROR],
        [AttemptStatus.RUNNING, AttemptStatus.SUCCESS],
        [AttemptStatus.RUNNING, AttemptStatus.PARTIAL],
        [AttemptStatus.RUNNING, AttemptStatus.ERROR],
        [AttemptStatus.RUNNING, AttemptStatus.TIMEOUT],
        [AttemptStatus.PARTIAL, AttemptStatus.SUCCESS],
        [AttemptStatus.PARTIAL, AttemptStatus.ERROR],
        [AttemptStatus.PARTIAL, AttemptStatus.TIMEOUT],
        [AttemptStatus.ERROR, AttemptStatus.QUEUED], // Retry
        [AttemptStatus.TIMEOUT, AttemptStatus.QUEUED] // Retry
      ];

      validTransitions.forEach(([from, to]) => {
        expect(() => validateTransition(from, to)).not.toThrow();
      });
    });

    test('rejects invalid transitions', () => {
      const invalidTransitions = [
        [AttemptStatus.SUCCESS, AttemptStatus.RUNNING],
        [AttemptStatus.SUCCESS, AttemptStatus.QUEUED],
        [AttemptStatus.RUNNING, AttemptStatus.QUEUED],
        [AttemptStatus.PARTIAL, AttemptStatus.QUEUED],
        [AttemptStatus.SUCCESS, AttemptStatus.ERROR]
      ];

      invalidTransitions.forEach(([from, to]) => {
        expect(() => validateTransition(from, to)).toThrow();
      });
    });
  });

  describe('Status Progression Scenarios', () => {
    test('successful completion flow', () => {
      const flow = [
        AttemptStatus.QUEUED,
        AttemptStatus.RUNNING,
        AttemptStatus.SUCCESS
      ];

      for (let i = 0; i < flow.length - 1; i++) {
        expect(() => validateTransition(flow[i], flow[i + 1])).not.toThrow();
      }
    });

    test('partial completion flow', () => {
      const flow = [
        AttemptStatus.QUEUED,
        AttemptStatus.RUNNING,
        AttemptStatus.PARTIAL,
        AttemptStatus.SUCCESS
      ];

      for (let i = 0; i < flow.length - 1; i++) {
        expect(() => validateTransition(flow[i], flow[i + 1])).not.toThrow();
      }
    });

    test('error and retry flow', () => {
      const flow = [
        AttemptStatus.QUEUED,
        AttemptStatus.RUNNING,
        AttemptStatus.ERROR,
        AttemptStatus.QUEUED, // Retry
        AttemptStatus.RUNNING,
        AttemptStatus.SUCCESS
      ];

      for (let i = 0; i < flow.length - 1; i++) {
        expect(() => validateTransition(flow[i], flow[i + 1])).not.toThrow();
      }
    });

    test('timeout and retry flow', () => {
      const flow = [
        AttemptStatus.QUEUED,
        AttemptStatus.RUNNING,
        AttemptStatus.TIMEOUT,
        AttemptStatus.QUEUED, // Retry
        AttemptStatus.RUNNING,
        AttemptStatus.SUCCESS
      ];

      for (let i = 0; i < flow.length - 1; i++) {
        expect(() => validateTransition(flow[i], flow[i + 1])).not.toThrow();
      }
    });
  });
});

describe('Error Contract Validation', () => {
  test('creates valid error contracts for different scenarios', () => {
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
      },
      {
        stage: 'storage',
        code: 'WRITE_FAILED',
        message: 'Failed to save evaluation results',
        help: 'Check disk space and permissions',
        retryable: true
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

  test('error contracts have consistent structure', () => {
    const errorContract: ErrorContract = {
      stage: 'model-call',
      code: 'TIMEOUT',
      message: 'Model request timed out after 30 seconds',
      help: 'Try again with a shorter prompt or different model',
      retryable: true,
      timestamp: new Date().toISOString()
    };

    // Verify all required fields are present
    expect(errorContract.stage).toBeDefined();
    expect(errorContract.code).toBeDefined();
    expect(errorContract.message).toBeDefined();
    expect(errorContract.help).toBeDefined();
    expect(errorContract.retryable).toBeDefined();
    expect(errorContract.timestamp).toBeDefined();

    // Verify types
    expect(typeof errorContract.stage).toBe('string');
    expect(typeof errorContract.code).toBe('string');
    expect(typeof errorContract.message).toBe('string');
    expect(typeof errorContract.help).toBe('string');
    expect(typeof errorContract.retryable).toBe('boolean');
    expect(typeof errorContract.timestamp).toBe('string');
  });
});

describe('Status Transition Utilities', () => {
  test('getNextValidStates returns correct options', () => {
    expect(getNextValidStates(AttemptStatus.QUEUED)).toEqual([
      AttemptStatus.RUNNING,
      AttemptStatus.ERROR
    ]);

    expect(getNextValidStates(AttemptStatus.RUNNING)).toEqual([
      AttemptStatus.SUCCESS,
      AttemptStatus.PARTIAL,
      AttemptStatus.ERROR,
      AttemptStatus.TIMEOUT
    ]);

    expect(getNextValidStates(AttemptStatus.SUCCESS)).toEqual([]);

    expect(getNextValidStates(AttemptStatus.ERROR)).toEqual([
      AttemptStatus.QUEUED
    ]);
  });

  test('canTransition validates transitions correctly', () => {
    expect(canTransition(AttemptStatus.QUEUED, AttemptStatus.RUNNING)).toBe(true);
    expect(canTransition(AttemptStatus.RUNNING, AttemptStatus.SUCCESS)).toBe(true);
    expect(canTransition(AttemptStatus.ERROR, AttemptStatus.QUEUED)).toBe(true);
    
    expect(canTransition(AttemptStatus.SUCCESS, AttemptStatus.RUNNING)).toBe(false);
    expect(canTransition(AttemptStatus.RUNNING, AttemptStatus.QUEUED)).toBe(false);
  });

  test('getStatusCategory categorizes statuses correctly', () => {
    expect(getStatusCategory(AttemptStatus.QUEUED)).toBe('pending');
    expect(getStatusCategory(AttemptStatus.RUNNING)).toBe('processing');
    expect(getStatusCategory(AttemptStatus.SUCCESS)).toBe('completed');
    expect(getStatusCategory(AttemptStatus.PARTIAL)).toBe('processing');
    expect(getStatusCategory(AttemptStatus.ERROR)).toBe('failed');
    expect(getStatusCategory(AttemptStatus.TIMEOUT)).toBe('failed');
  });
});

// Helper functions for state machine validation
function validateTransition(fromStatus: AttemptStatus, toStatus: AttemptStatus): void {
  const validTransitions = {
    [AttemptStatus.QUEUED]: [AttemptStatus.RUNNING, AttemptStatus.ERROR],
    [AttemptStatus.RUNNING]: [AttemptStatus.SUCCESS, AttemptStatus.PARTIAL, AttemptStatus.ERROR, AttemptStatus.TIMEOUT],
    [AttemptStatus.SUCCESS]: [],
    [AttemptStatus.PARTIAL]: [AttemptStatus.SUCCESS, AttemptStatus.ERROR, AttemptStatus.TIMEOUT],
    [AttemptStatus.ERROR]: [AttemptStatus.QUEUED],
    [AttemptStatus.TIMEOUT]: [AttemptStatus.QUEUED]
  };

  const allowedTransitions = validTransitions[fromStatus] || [];
  if (!allowedTransitions.includes(toStatus)) {
    throw new Error(`Cannot transition from ${fromStatus} to ${toStatus}`);
  }
}

function isTerminalState(status: AttemptStatus): boolean {
  return status === AttemptStatus.SUCCESS;
}

function isRetryableState(status: AttemptStatus): boolean {
  return status === AttemptStatus.ERROR || status === AttemptStatus.TIMEOUT;
}

function getNextValidStates(status: AttemptStatus): AttemptStatus[] {
  const validTransitions = {
    [AttemptStatus.QUEUED]: [AttemptStatus.RUNNING, AttemptStatus.ERROR],
    [AttemptStatus.RUNNING]: [AttemptStatus.SUCCESS, AttemptStatus.PARTIAL, AttemptStatus.ERROR, AttemptStatus.TIMEOUT],
    [AttemptStatus.SUCCESS]: [],
    [AttemptStatus.PARTIAL]: [AttemptStatus.SUCCESS, AttemptStatus.ERROR, AttemptStatus.TIMEOUT],
    [AttemptStatus.ERROR]: [AttemptStatus.QUEUED],
    [AttemptStatus.TIMEOUT]: [AttemptStatus.QUEUED]
  };

  return validTransitions[status] || [];
}

function canTransition(fromStatus: AttemptStatus, toStatus: AttemptStatus): boolean {
  try {
    validateTransition(fromStatus, toStatus);
    return true;
  } catch {
    return false;
  }
}

function getStatusCategory(status: AttemptStatus): string {
  switch (status) {
    case AttemptStatus.QUEUED:
      return 'pending';
    case AttemptStatus.RUNNING:
    case AttemptStatus.PARTIAL:
      return 'processing';
    case AttemptStatus.SUCCESS:
      return 'completed';
    case AttemptStatus.ERROR:
    case AttemptStatus.TIMEOUT:
      return 'failed';
    default:
      return 'unknown';
  }
}