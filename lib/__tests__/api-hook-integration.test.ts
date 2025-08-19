import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { NextRequest } from 'next/server';
import { POST as createAttempt, GET as getAttempts } from '@/app/api/attempts/route';
import { GET as getEvaluation } from '@/app/api/evaluations/[attemptId]/route';

// Test data directory
const TEST_DATA_DIR = join(process.cwd(), 'data-test');

describe('API Hook Integration Tests', () => {
  beforeEach(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.KIRO_BYPASS_HOOK = 'true';
    
    // Clean up test directory
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
    
    // Create test directories
    await fs.mkdir(join(TEST_DATA_DIR, 'attempts'), { recursive: true });
    await fs.mkdir(join(TEST_DATA_DIR, 'evaluations'), { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Reset environment
    delete process.env.KIRO_BYPASS_HOOK;
  });

  it('should create attempt and process it in bypass mode', async () => {
    const requestBody = {
      labId: 'practice-basics',
      userPrompt: 'What is the capital of France?',
      models: ['local-stub']
    };

    const request = new NextRequest('http://localhost:3000/api/attempts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await createAttempt(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.bypassMode).toBe(true);
    expect(data.attempt.id).toBeTruthy();
    expect(data.attempt.labId).toBe('practice-basics');
  });

  it('should get evaluation status for completed attempt', async () => {
    // First create an attempt
    const requestBody = {
      labId: 'practice-basics',
      userPrompt: 'Test prompt',
      models: ['local-stub']
    };

    const createRequest = new NextRequest('http://localhost:3000/api/attempts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const createResponse = await createAttempt(createRequest);
    const createData = await createResponse.json();
    const attemptId = createData.attempt.id;

    // Then check evaluation status
    const evalRequest = new NextRequest(`http://localhost:3000/api/evaluations/${attemptId}`);
    const evalResponse = await getEvaluation(evalRequest, { params: { attemptId } });
    const evalData = await evalResponse.json();

    expect(evalResponse.status).toBe(200);
    expect(evalData.status).toBe('completed');
    expect(evalData.evaluation).toBeTruthy();
    expect(evalData.evaluation.attemptId).toBe(attemptId);
    expect(evalData.evaluation.perModelResults).toHaveLength(1);
  });

  it('should handle invalid attempt creation', async () => {
    const requestBody = {
      labId: 'practice-basics',
      userPrompt: '', // Invalid - empty prompt
      models: ['local-stub']
    };

    const request = new NextRequest('http://localhost:3000/api/attempts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await createAttempt(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('userPrompt is required');
  });

  it('should handle evaluation status for non-existent attempt', async () => {
    const attemptId = 'non-existent-attempt';
    
    const request = new NextRequest(`http://localhost:3000/api/evaluations/${attemptId}`);
    const response = await getEvaluation(request, { params: { attemptId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('processing');
  });

  it('should validate attemptId format in evaluation endpoint', async () => {
    const maliciousAttemptId = '../../../etc/passwd';
    
    const request = new NextRequest(`http://localhost:3000/api/evaluations/${maliciousAttemptId}`);
    const response = await getEvaluation(request, { params: { attemptId: maliciousAttemptId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid attemptId format');
  });

  it('should return API information for GET requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/attempts');
    const response = await getAttempts();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.endpoint).toBe('/api/attempts');
    expect(data.methods).toContain('POST');
    expect(data.bypassMode).toBe(true);
  });
});