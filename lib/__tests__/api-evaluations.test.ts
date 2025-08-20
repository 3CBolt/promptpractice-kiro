import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/evaluations/[attemptId]/route';
import { NextRequest } from 'next/server';
import { existsSync } from 'fs';

// Mock filesystem functions
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn()
  };
});

// Mock storage functions
vi.mock('@/lib/storage', () => ({
  readEvaluation: vi.fn(),
  readAttempt: vi.fn()
}));

// Mock validation
vi.mock('@/lib/validation', () => ({
  validateFilePath: vi.fn(() => true)
}));

describe('/api/evaluations/[attemptId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 400 for missing attemptId', async () => {
      const request = new NextRequest('http://localhost:3000/api/evaluations/');
      
      const response = await GET(request, { params: { attemptId: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('attemptId is required');
    });

    it('should return 400 for invalid attemptId format', async () => {
      const request = new NextRequest('http://localhost:3000/api/evaluations/invalid-id');
      
      const response = await GET(request, { params: { attemptId: '../../../etc/passwd' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid attemptId format');
    });

    it('should return 400 for path traversal attempts', async () => {
      const { validateFilePath } = await import('@/lib/validation');
      vi.mocked(validateFilePath).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/evaluations/test-id');
      
      const response = await GET(request, { params: { attemptId: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid file path detected');
    });

    it('should return completed evaluation when evaluation file exists', async () => {
      const { readEvaluation } = await import('@/lib/storage');
      
      vi.mocked(existsSync).mockImplementation((path) => {
        return path.toString().includes('evaluations/test-123.json');
      });

      const mockEvaluation = {
        id: 'eval-123',
        attemptId: 'test-123',
        perModelResults: [{
          modelId: 'local-stub',
          text: 'Test response',
          latencyMs: 100,
          source: 'sample',
          score: 8,
          breakdown: { clarity: 4, completeness: 4 },
          notes: 'Good response'
        }],
        createdAt: '2024-01-15T10:30:00.000Z'
      };

      vi.mocked(readEvaluation).mockResolvedValue(mockEvaluation);

      const request = new NextRequest('http://localhost:3000/api/evaluations/test-123');
      
      const response = await GET(request, { params: { attemptId: 'test-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('completed');
      expect(data.evaluation).toEqual(mockEvaluation);
      expect(data.timestamp).toBeDefined();
    });

    it('should return failed status when error file exists', async () => {
      const fs = require('fs');
      
      vi.mocked(existsSync).mockImplementation((path) => {
        return path.toString().includes('evaluations/test-123.error.json');
      });

      const mockErrorData = {
        error: 'API call failed',
        code: 'API_ERROR',
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockErrorData));

      const request = new NextRequest('http://localhost:3000/api/evaluations/test-123');
      
      const response = await GET(request, { params: { attemptId: 'test-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('failed');
      expect(data.error.message).toBe('API call failed');
      expect(data.error.code).toBe('API_ERROR');
      expect(data.error.timestamp).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should handle corrupted error file gracefully', async () => {
      const fs = require('fs');
      
      vi.mocked(existsSync).mockImplementation((path) => {
        return path.toString().includes('evaluations/test-123.error.json');
      });

      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File corrupted');
      });

      const request = new NextRequest('http://localhost:3000/api/evaluations/test-123');
      
      const response = await GET(request, { params: { attemptId: 'test-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('failed');
      expect(data.error.message).toBe('Evaluation failed with unknown error');
      expect(data.error.code).toBe('UNKNOWN_ERROR');
    });

    it('should return 404 when attempt does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/evaluations/non-existent');
      
      const response = await GET(request, { params: { attemptId: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Attempt not found');
    });

    it('should return processing status when attempt exists but no evaluation', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path.toString().includes('attempts/test-123.json');
      });

      const request = new NextRequest('http://localhost:3000/api/evaluations/test-123');
      
      const response = await GET(request, { params: { attemptId: 'test-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('processing');
      expect(data.timestamp).toBeDefined();
      expect(data.evaluation).toBeUndefined();
    });

    it('should handle evaluation read errors', async () => {
      const { readEvaluation } = await import('@/lib/storage');
      
      vi.mocked(existsSync).mockImplementation((path) => {
        return path.toString().includes('evaluations/test-123.json');
      });

      vi.mocked(readEvaluation).mockRejectedValue(new Error('Read failed'));

      const request = new NextRequest('http://localhost:3000/api/evaluations/test-123');
      
      const response = await GET(request, { params: { attemptId: 'test-123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to read evaluation results');
    });

    it('should validate attemptId format correctly', async () => {
      const validIds = ['test-123', 'attempt_456', 'eval-abc-def', 'simple123'];
      const invalidIds = ['../hack', 'test/path', 'id with spaces', 'id@email.com'];

      for (const validId of validIds) {
        vi.mocked(existsSync).mockReturnValue(false);
        
        const request = new NextRequest(`http://localhost:3000/api/evaluations/${validId}`);
        const response = await GET(request, { params: { attemptId: validId } });
        
        expect(response.status).not.toBe(400);
      }

      for (const invalidId of invalidIds) {
        const request = new NextRequest(`http://localhost:3000/api/evaluations/${invalidId}`);
        const response = await GET(request, { params: { attemptId: invalidId } });
        const data = await response.json();
        
        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid attemptId format');
      }
    });
  });
});