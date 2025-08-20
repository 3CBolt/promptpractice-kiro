import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  callModel,
  getModelById,
  getAvailableModels,
  areHostedModelsAvailable,
  getRateLimitStatus,
  getSourceBadge,
  MODEL_REGISTRY
} from '../models/providers';
import { getLocalModelResult } from '../models/localModel';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  // Reset environment
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

// Mock fetch for Hugging Face API tests
global.fetch = vi.fn();

describe('Model Providers', () => {
  describe('MODEL_REGISTRY', () => {
    it('should contain expected models', () => {
      expect(MODEL_REGISTRY).toHaveLength(5);
      
      const modelIds = MODEL_REGISTRY.map(m => m.id);
      expect(modelIds).toContain('llama3.1-8b');
      expect(modelIds).toContain('mistral-7b');
      expect(modelIds).toContain('local-stub');
      expect(modelIds).toContain('local-creative');
      expect(modelIds).toContain('local-analytical');
    });

    it('should have proper model structure', () => {
      MODEL_REGISTRY.forEach(model => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('source');
        expect(model).toHaveProperty('maxTokens');
        expect(['hosted', 'sample', 'local']).toContain(model.source);
        expect(typeof model.maxTokens).toBe('number');
        expect(model.maxTokens).toBeGreaterThan(0);
      });
    });
  });

  describe('getModelById', () => {
    it('should return correct model for valid ID', () => {
      const model = getModelById('llama3.1-8b');
      expect(model).toBeDefined();
      expect(model?.id).toBe('llama3.1-8b');
      expect(model?.name).toBe('Llama 3.1 8B');
      expect(model?.source).toBe('hosted');
    });

    it('should return undefined for invalid ID', () => {
      const model = getModelById('non-existent-model');
      expect(model).toBeUndefined();
    });
  });

  describe('getAvailableModels', () => {
    it('should return all models when no filter', () => {
      const models = getAvailableModels();
      expect(models).toHaveLength(5);
    });

    it('should filter by source correctly', () => {
      const hostedModels = getAvailableModels('hosted');
      expect(hostedModels).toHaveLength(2);
      expect(hostedModels.every(m => m.source === 'hosted')).toBe(true);

      const sampleModels = getAvailableModels('sample');
      expect(sampleModels).toHaveLength(3);
      expect(sampleModels.every(m => m.source === 'sample')).toBe(true);
    });
  });

  describe('areHostedModelsAvailable', () => {
    it('should return false when no API key', () => {
      delete process.env.HUGGINGFACE_API_KEY;
      expect(areHostedModelsAvailable()).toBe(false);
    });

    it('should return true when API key is present', () => {
      process.env.HUGGINGFACE_API_KEY = 'test-key';
      expect(areHostedModelsAvailable()).toBe(true);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return rate limit status', () => {
      const status = getRateLimitStatus();
      expect(status).toHaveProperty('isLimited');
      expect(status).toHaveProperty('requestCount');
      expect(status).toHaveProperty('maxRequests');
      expect(typeof status.isLimited).toBe('boolean');
      expect(typeof status.requestCount).toBe('number');
      expect(status.maxRequests).toBe(1000);
    });
  });

  describe('getSourceBadge', () => {
    it('should return correct badges for different sources', () => {
      expect(getSourceBadge({ modelId: 'test', text: '', latencyMs: 0, source: 'hosted' }))
        .toBe('✨ Hosted');
      expect(getSourceBadge({ modelId: 'test', text: '', latencyMs: 0, source: 'sample' }))
        .toBe('📦 Sample');
      expect(getSourceBadge({ modelId: 'test', text: '', latencyMs: 0, source: 'local' }))
        .toBe('💻 Local');
      expect(getSourceBadge({ modelId: 'test', text: '', latencyMs: 0, source: 'unknown' as any }))
        .toBe('❓ Unknown');
    });
  });

  describe('callModel - Local Models', () => {
    it('should call local models directly', async () => {
      const result = await callModel('local-stub', 'Test prompt');
      
      expect(result.modelId).toBe('local-stub');
      expect(result.source).toBe('sample');
      expect(result.text).toBeDefined();
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.usageTokens).toBeGreaterThan(0);
    });

    it('should handle system prompts for local models', async () => {
      const result = await callModel('local-stub', 'Test prompt', 'You are helpful');
      
      expect(result.text).toContain('Following the system guidance');
    });

    it('should return different responses for different local models', async () => {
      const stubResult = await callModel('local-stub', 'Test prompt');
      const creativeResult = await callModel('local-creative', 'Test prompt');
      const analyticalResult = await callModel('local-analytical', 'Test prompt');
      
      expect(stubResult.text).not.toBe(creativeResult.text);
      expect(stubResult.text).not.toBe(analyticalResult.text);
      expect(creativeResult.text).not.toBe(analyticalResult.text);
    });
  });

  describe('callModel - Hosted Models with Fallback', () => {
    beforeEach(() => {
      process.env.HUGGINGFACE_API_KEY = 'test-key';
    });

    it('should call Hugging Face API successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{
          generated_text: 'This is a response from Hugging Face API'
        }]),
        headers: new Map()
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);
      
      const result = await callModel('llama3.1-8b', 'Test prompt');
      
      expect(result.modelId).toBe('llama3.1-8b');
      expect(result.source).toBe('hosted');
      expect(result.text).toBe('This is a response from Hugging Face API');
      expect(result.latencyMs).toBeGreaterThan(0);
    });

    it('should fallback to local model on API failure', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);
      
      const result = await callModel('llama3.1-8b', 'Test prompt');
      
      expect(result.modelId).toBe('llama3.1-8b'); // Keeps original model ID
      expect(result.source).toBe('sample'); // But marks as sample to indicate fallback
      expect(result.text).toBeDefined();
    });

    it('should fallback to local model on rate limit', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['retry-after', '3600']])
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);
      
      const result = await callModel('llama3.1-8b', 'Test prompt');
      
      expect(result.modelId).toBe('llama3.1-8b');
      expect(result.source).toBe('sample');
    });

    it('should fallback to local model on network error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));
      
      const result = await callModel('llama3.1-8b', 'Test prompt');
      
      expect(result.modelId).toBe('llama3.1-8b');
      expect(result.source).toBe('sample');
    });

    it('should handle different HF API response formats', async () => {
      // Test array format
      const arrayResponse = {
        ok: true,
        json: () => Promise.resolve([{ generated_text: 'Array format response' }]),
        headers: new Map()
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(arrayResponse as any);
      
      const result1 = await callModel('llama3.1-8b', 'Test prompt');
      expect(result1.text).toBe('Array format response');
      
      // Test object format
      const objectResponse = {
        ok: true,
        json: () => Promise.resolve({ generated_text: 'Object format response' }),
        headers: new Map()
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(objectResponse as any);
      
      const result2 = await callModel('llama3.1-8b', 'Test prompt 2');
      expect(result2.text).toBe('Object format response');
    });

    it('should include system prompt in API call', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ generated_text: 'Response with system prompt' }]),
        headers: new Map()
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);
      
      await callModel('llama3.1-8b', 'User prompt', 'System prompt');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('meta-llama/Llama-3.1-8B-Instruct'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('System: System prompt\\n\\nUser: User prompt')
        })
      );
    });
  });

  describe('callModel - Error Handling', () => {
    it('should throw error for unknown model', async () => {
      await expect(callModel('unknown-model', 'Test prompt'))
        .rejects.toThrow('Unknown model: unknown-model');
    });

    it('should handle missing API key gracefully', async () => {
      delete process.env.HUGGINGFACE_API_KEY;
      
      // Should fallback to local model instead of throwing
      const result = await callModel('llama3.1-8b', 'Test prompt');
      expect(result.source).toBe('sample');
    });
  });

  describe('Rate Limiting Simulation', () => {
    beforeEach(() => {
      process.env.HUGGINGFACE_API_KEY = 'test-key';
    });

    it('should track rate limit state correctly', async () => {
      // Simulate rate limit response
      const rateLimitResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['retry-after', '3600']])
      };
      
      vi.mocked(fetch).mockResolvedValue(rateLimitResponse as any);
      
      // Make a call that triggers rate limiting
      await callModel('llama3.1-8b', 'Test prompt');
      
      // Check that subsequent calls use fallback
      const status = getRateLimitStatus();
      expect(status.isLimited).toBe(true);
      expect(status.resetTime).toBeDefined();
    });
  });
});

describe('Local Model', () => {
  describe('getLocalModelResult', () => {
    it('should return deterministic responses', async () => {
      const result1 = await getLocalModelResult('local-stub', 'What is AI?');
      const result2 = await getLocalModelResult('local-stub', 'What is AI?');
      
      // Should be deterministic for same input
      expect(result1.text).toBe(result2.text);
      expect(result1.modelId).toBe('local-stub');
      expect(result1.source).toBe('sample');
    });

    it('should vary responses based on prompt type', async () => {
      const questionResult = await getLocalModelResult('local-stub', 'What is machine learning?');
      const creativeResult = await getLocalModelResult('local-stub', 'Write a creative story');
      const analyticalResult = await getLocalModelResult('local-stub', 'Analyze this data');
      
      expect(questionResult.text).not.toBe(creativeResult.text);
      expect(questionResult.text).not.toBe(analyticalResult.text);
      expect(creativeResult.text).not.toBe(analyticalResult.text);
    });

    it('should simulate realistic latency', async () => {
      const shortPrompt = 'Hi';
      const longPrompt = 'This is a much longer prompt that should take more time to process because it contains more content and complexity';
      
      const shortResult = await getLocalModelResult('local-stub', shortPrompt);
      const longResult = await getLocalModelResult('local-stub', longPrompt);
      
      expect(shortResult.latencyMs).toBeGreaterThan(0);
      expect(longResult.latencyMs).toBeGreaterThan(shortResult.latencyMs);
    });

    it('should estimate token usage correctly', async () => {
      const result = await getLocalModelResult('local-stub', 'Test prompt');
      
      expect(result.usageTokens).toBeGreaterThan(0);
      expect(result.usageTokens).toBe(Math.round(result.text.length / 4));
    });

    it('should handle system prompts', async () => {
      const withoutSystem = await getLocalModelResult('local-stub', 'Test prompt');
      const withSystem = await getLocalModelResult('local-stub', 'Test prompt', 'You are helpful');
      
      expect(withSystem.text).toContain('Following the system guidance');
      expect(withSystem.text).not.toBe(withoutSystem.text);
    });

    it('should provide different responses for different model variants', async () => {
      const stubResult = await getLocalModelResult('local-stub', 'Test prompt');
      const creativeResult = await getLocalModelResult('local-creative', 'Test prompt');
      const analyticalResult = await getLocalModelResult('local-analytical', 'Test prompt');
      
      expect(stubResult.text).not.toBe(creativeResult.text);
      expect(stubResult.text).not.toBe(analyticalResult.text);
      expect(creativeResult.text).toContain('creative and imaginative');
      expect(analyticalResult.text).toContain('logical analysis');
    });
  });
});