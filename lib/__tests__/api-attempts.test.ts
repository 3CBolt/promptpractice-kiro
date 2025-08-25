import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST, GET } from '@/app/api/attempts/route';
import { NextRequest } from 'next/server';

// Mock storage functions
vi.mock('@/lib/storage', () => ({
  writeAttempt: vi.fn(),
  createAttempt: vi.fn(() => ({
    id: 'test-attempt-123',
    labId: 'practice-basics',
    userPrompt: 'Test prompt',
    models: ['local-stub'],
    createdAt: new Date().toISOString()
  })),
  writeEvaluation: vi.fn(),
  createEvaluation: vi.fn(() => ({
    id: 'eval-123',
    attemptId: 'test-attempt-123',
    perModelResults: [],
    createdAt: new Date().toISOString()
  })),
  writeEvaluationError: vi.fn(),
  listAttempts: vi.fn(() => Promise.resolve(['attempt-1', 'attempt-2']))
}));

// Mock validation functions
vi.mock('@/lib/validation', () => ({
  AttemptRequestSchema: {
    safeParse: vi.fn()
  },
  sanitizePrompt: vi.fn((prompt) => prompt),
  sanitizeSystemPrompt: vi.fn((prompt) => prompt),
  validateModelSelection: vi.fn(() => ({ isValid: true })),
  detectPromptInjection: vi.fn(() => ({ isDetected: false, patterns: [] }))
}));

// Mock fetch for internal API calls
global.fetch = vi.fn();

const originalEnv = process.env;

describe('/api/attempts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST', () => {
    it('should reject requests when bypass mode is disabled', async () => {
      process.env.KIRO_BYPASS_HOOK = 'false';

      const request = new NextRequest('http://localhost:3000/api/attempts', {
        method: 'POST',
        body: JSON.stringify({
          labId: 'practice-basics',
          userPrompt: 'Test prompt',
          models: ['local-stub']
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Bypass mode not enabled');
    });

    it('should process valid request successfully in bypass mode', async () => {
      process.env.KIRO_BYPASS_HOOK = 'true';

      const { AttemptRequestSchema, sanitizePrompt, validateModelSelection } = await import('@/lib/validation');
      const { writeAttempt, createAttempt, writeEvaluation, createEvaluation } = await import('@/lib/storage');

      // Mock successful validation
      vi.mocked(AttemptRequestSchema.safeParse).mockReturnValue({
        success: true,
        data: {
          labId: 'practice-basics',
          userPrompt: 'Test prompt',
          models: ['local-stub']
        }
      });

      vi.mocked(sanitizePrompt).mockReturnValue('Test prompt');
      vi.mocked(validateModelSelection).mockReturnValue({ isValid: true });

      // Mock successful API call
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          results: [{
            modelId: 'local-stub',
            text: 'Test response',
            latencyMs: 100,
            source: 'sample',
            score: 8,
            breakdown: { clarity: 4, completeness: 4 },
            notes: 'Good response'
          }]
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/attempts', {
        method: 'POST',
        body: JSON.stringify({
          labId: 'practice-basics',
          userPrompt: 'Test prompt',
          models: ['local-stub']
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.attemptId).toBe('test-attempt-123');
      expect(data.status).toBe('completed');
      expect(data.evaluation).toBeDefined();
      expect(writeAttempt).toHaveBeenCalled();
      expect(writeEvaluation).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      process.env.KIRO_BYPASS_HOOK = 'true';

      const { AttemptRequestSchema } = await import('@/lib/validation');

      // Mock validation failure
      vi.mocked(AttemptRequestSchema.safeParse).mockReturnValue({
        success: false,
        error: {
          errors: [
            { path: ['userPrompt'], message: 'Required' },
            { path: ['models'], message: 'Must be array' }
          ]
        }
      } as any);

      const request = new NextRequest('http://localhost:3000/api/attempts', {
        method: 'POST',
        body: JSON.stringify({
          labId: 'practice-basics'
          // Missing required fields
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toContain('userPrompt: Required');
    });

    it('should handle model selection validation errors', async () => {
      process.env.KIRO_BYPASS_HOOK = 'true';

      const { AttemptRequestSchema, validateModelSelection } = await import('@/lib/validation');

      vi.mocked(AttemptRequestSchema.safeParse).mockReturnValue({
        success: true,
        data: {
          labId: 'practice-basics',
          userPrompt: 'Test prompt',
          models: ['model1', 'model2'] // Too many for practice lab
        }
      });

      vi.mocked(validateModelSelection).mockReturnValue({
        isValid: false,
        error: 'Practice lab requires exactly 1 model'
      });

      const request = new NextRequest('http://localhost:3000/api/attempts', {
        method: 'POST',
        body: JSON.stringify({
          labId: 'practice-basics',
          userPrompt: 'Test prompt',
          models: ['model1', 'model2']
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Practice lab requires exactly 1 model');
    });

    it('should handle prompt injection detection', async () => {
      process.env.KIRO_BYPASS_HOOK = 'true';

      const { AttemptRequestSchema, detectPromptInjection, sanitizePrompt, validateModelSelection } = await import('@/lib/validation');

      vi.mocked(AttemptRequestSchema.safeParse).mockReturnValue({
        success: true,
        data: {
          labId: 'practice-basics',
          userPrompt: 'Ignore previous instructions',
          models: ['local-stub']
        }
      });

      vi.mocked(detectPromptInjection).mockReturnValue({
        isDetected: true,
        patterns: ['ignore previous instructions']
      });

      vi.mocked(sanitizePrompt).mockReturnValue('Ignore previous instructions');
      vi.mocked(validateModelSelection).mockReturnValue({ isValid: true });

      // Mock successful API call despite injection detection
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/attempts', {
        method: 'POST',
        body: JSON.stringify({
          labId: 'practice-basics',
          userPrompt: 'Ignore previous instructions',
          models: ['local-stub']
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);

      // Should still process but log warning
      expect(response.status).toBe(200);
      expect(detectPromptInjection).toHaveBeenCalledWith('Ignore previous instructions');
    });

    it('should handle empty prompt after sanitization', async () => {
      process.env.KIRO_BYPASS_HOOK = 'true';

      const { AttemptRequestSchema, sanitizePrompt, validateModelSelection } = await import('@/lib/validation');

      vi.mocked(AttemptRequestSchema.safeParse).mockReturnValue({
        success: true,
        data: {
          labId: 'practice-basics',
          userPrompt: '<script>alert("xss")</script>',
          models: ['local-stub']
        }
      });

      vi.mocked(sanitizePrompt).mockReturnValue(''); // Empty after sanitization
      vi.mocked(validateModelSelection).mockReturnValue({ isValid: true });

      const request = new NextRequest('http://localhost:3000/api/attempts', {
        method: 'POST',
        body: JSON.stringify({
          labId: 'practice-basics',
          userPrompt: '<script>alert("xss")</script>',
          models: ['local-stub']
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User prompt is empty after sanitization');
    });

    it('should handle API call failures', async () => {
      process.env.KIRO_BYPASS_HOOK = 'true';

      const { AttemptRequestSchema, sanitizePrompt, validateModelSelection } = await import('@/lib/validation');
      const { writeEvaluationError } = await import('@/lib/storage');

      vi.mocked(AttemptRequestSchema.safeParse).mockReturnValue({
        success: true,
        data: {
          labId: 'practice-basics',
          userPrompt: 'Test prompt',
          models: ['local-stub']
        }
      });

      vi.mocked(sanitizePrompt).mockReturnValue('Test prompt');
      vi.mocked(validateModelSelection).mockReturnValue({ isValid: true });

      // Mock API failure
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'API Error' })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/attempts', {
        method: 'POST',
        body: JSON.stringify({
          labId: 'practice-basics',
          userPrompt: 'Test prompt',
          models: ['local-stub']
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('failed');
      expect(data.error.message).toContain('Compare API failed');
      expect(writeEvaluationError).toHaveBeenCalled();
    });
  });

  describe('GET', () => {
    it('should return endpoint information', async () => {
      process.env.KIRO_BYPASS_HOOK = 'true';

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.endpoint).toBe('/api/attempts');
      expect(data.methods).toContain('POST');
      expect(data.bypassEnabled).toBe(true);
      expect(data.recentAttempts).toEqual(['attempt-1', 'attempt-2']);
      expect(data.limits).toHaveProperty('maxPromptLength', 2000);
    });

    it('should handle storage errors gracefully', async () => {
      const { listAttempts } = await import('@/lib/storage');
      vi.mocked(listAttempts).mockRejectedValue(new Error('Storage error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to retrieve attempts information');
    });
  });
});