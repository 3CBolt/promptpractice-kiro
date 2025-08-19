import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/compare/route';
import { NextRequest } from 'next/server';

// Mock the model providers
vi.mock('@/lib/models/providers', () => ({
  callModel: vi.fn(),
  MODEL_REGISTRY: [
    { id: 'local-stub', name: 'Local Stub', source: 'sample', maxTokens: 512 },
    { id: 'llama3.1-8b', name: 'Llama 3.1 8B', source: 'hosted', maxTokens: 512 }
  ],
  areHostedModelsAvailable: vi.fn(() => true),
  getRateLimitStatus: vi.fn(() => ({
    isLimited: false,
    requestCount: 0,
    maxRequests: 1000,
    resetTime: undefined
  }))
}));

// Mock the evaluator
vi.mock('@/lib/evaluator', () => ({
  evaluateResponse: vi.fn(() => ({
    score: 8,
    breakdown: { clarity: 4, completeness: 4 },
    notes: 'Good response with clear structure and complete information.'
  }))
}));

describe('/api/compare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should process a valid request successfully', async () => {
      const { callModel } = await import('@/lib/models/providers');
      
      // Mock successful model call
      vi.mocked(callModel).mockResolvedValue({
        modelId: 'local-stub',
        text: 'This is a test response from the local stub model.',
        latencyMs: 150,
        source: 'sample'
      });

      const request = new NextRequest('http://localhost:3000/api/compare', {
        method: 'POST',
        body: JSON.stringify({
          userPrompt: 'What is artificial intelligence?',
          models: ['local-stub']
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0]).toMatchObject({
        modelId: 'local-stub',
        text: 'This is a test response from the local stub model.',
        latencyMs: 150,
        source: 'sample',
        score: 8,
        breakdown: { clarity: 4, completeness: 4 }
      });
      expect(data.metadata).toHaveProperty('totalLatencyMs');
      expect(data.metadata).toHaveProperty('processedAt');
      expect(data.metadata).toHaveProperty('fallbacksUsed');
    });

    it('should handle multiple models', async () => {
      const { callModel } = await import('@/lib/models/providers');
      
      // Mock multiple model calls
      vi.mocked(callModel)
        .mockResolvedValueOnce({
          modelId: 'local-stub',
          text: 'Response from local stub',
          latencyMs: 100,
          source: 'sample'
        })
        .mockResolvedValueOnce({
          modelId: 'llama3.1-8b',
          text: 'Response from Llama',
          latencyMs: 200,
          source: 'hosted'
        });

      const request = new NextRequest('http://localhost:3000/api/compare', {
        method: 'POST',
        body: JSON.stringify({
          userPrompt: 'Explain machine learning',
          models: ['local-stub', 'llama3.1-8b']
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(2);
      expect(callModel).toHaveBeenCalledTimes(2);
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/compare', {
        method: 'POST',
        body: JSON.stringify({
          models: ['local-stub']
          // Missing userPrompt
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('userPrompt is required');
    });

    it('should validate prompt length limits', async () => {
      const longPrompt = 'a'.repeat(2001); // Exceeds 2000 character limit

      const request = new NextRequest('http://localhost:3000/api/compare', {
        method: 'POST',
        body: JSON.stringify({
          userPrompt: longPrompt,
          models: ['local-stub']
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('exceeds maximum length');
    });

    it('should validate model count limits', async () => {
      const request = new NextRequest('http://localhost:3000/api/compare', {
        method: 'POST',
        body: JSON.stringify({
          userPrompt: 'Test prompt',
          models: ['model1', 'model2', 'model3', 'model4'] // Exceeds 3 model limit
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Maximum of 3 models allowed');
    });

    it('should handle model errors gracefully', async () => {
      const { callModel } = await import('@/lib/models/providers');
      
      // Mock model call failure
      vi.mocked(callModel).mockRejectedValue(new Error('Model API failed'));

      const request = new NextRequest('http://localhost:3000/api/compare', {
        method: 'POST',
        body: JSON.stringify({
          userPrompt: 'Test prompt',
          models: ['local-stub']
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200); // Should still return 200 with error result
      expect(data.results).toHaveLength(1);
      expect(data.results[0].text).toContain('Error: Failed to process request');
      expect(data.results[0].score).toBe(0);
    });
  });

  describe('GET', () => {
    it('should return API information', async () => {
      const request = new NextRequest('http://localhost:3000/api/compare', {
        method: 'GET'
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('endpoint', '/api/compare');
      expect(data).toHaveProperty('methods');
      expect(data).toHaveProperty('availableModels');
      expect(data).toHaveProperty('limits');
      expect(data.limits).toMatchObject({
        maxPromptLength: 2000,
        maxModelsPerRequest: 3,
        maxTokensPerModel: 512
      });
    });
  });
});