import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import {
  generateId,
  formatTimestamp,
  getGuides,
  getLabs
} from '../utils';

// Mock fs for guide reading tests
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readdirSync: vi.fn(),
    readFileSync: vi.fn()
  };
});

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('should generate IDs with expected format', () => {
      const id = generateId();
      
      // Should contain timestamp and random part separated by dash
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
      
      const parts = id.split('-');
      expect(parts).toHaveLength(2);
      expect(parseInt(parts[0])).toBeGreaterThan(0);
      expect(parts[1]).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate IDs with increasing timestamps', async () => {
      const id1 = generateId();
      
      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const id2 = generateId();
      
      const timestamp1 = parseInt(id1.split('-')[0]);
      const timestamp2 = parseInt(id2.split('-')[0]);
      
      expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);
    });

    it('should generate many unique IDs', () => {
      const ids = new Set();
      const count = 1000;
      
      for (let i = 0; i < count; i++) {
        ids.add(generateId());
      }
      
      expect(ids.size).toBe(count);
    });
  });

  describe('formatTimestamp', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const formatted = formatTimestamp(date);
      
      expect(formatted).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should handle current date', () => {
      const now = new Date();
      const formatted = formatTimestamp(now);
      
      expect(formatted).toBe(now.toISOString());
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should be consistent for same date', () => {
      const date = new Date('2024-06-15T14:22:33.123Z');
      const formatted1 = formatTimestamp(date);
      const formatted2 = formatTimestamp(date);
      
      expect(formatted1).toBe(formatted2);
    });
  });

  describe('getGuides', () => {
    const mockFs = vi.mocked(fs);

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should read guides from filesystem correctly', () => {
      // Mock filesystem responses
      mockFs.readdirSync.mockReturnValue([
        'fundamentals.md',
        'chain-of-thought.md',
        'system-prompts.md',
        'not-a-guide.txt' // Should be ignored
      ] as any);

      mockFs.readFileSync
        .mockReturnValueOnce('# Fundamentals\n\nThis is the fundamentals guide content.')
        .mockReturnValueOnce('# Chain of Thought\n\nThis explains chain of thought prompting.')
        .mockReturnValueOnce('# System Prompts\n\nLearn about system prompts here.');

      const guides = getGuides();

      expect(guides).toHaveLength(3);
      
      expect(guides[0]).toEqual({
        id: 'fundamentals',
        title: 'Fundamentals',
        body: '# Fundamentals\n\nThis is the fundamentals guide content.'
      });

      expect(guides[1]).toEqual({
        id: 'chain-of-thought',
        title: 'Chain of Thought',
        body: '# Chain of Thought\n\nThis explains chain of thought prompting.'
      });

      expect(guides[2]).toEqual({
        id: 'system-prompts',
        title: 'System Prompts',
        body: '# System Prompts\n\nLearn about system prompts here.'
      });
    });

    it('should handle guides without title headers', () => {
      mockFs.readdirSync.mockReturnValue(['no-title.md'] as any);
      mockFs.readFileSync.mockReturnValue('This guide has no title header.\n\nJust content.');

      const guides = getGuides();

      expect(guides).toHaveLength(1);
      expect(guides[0]).toEqual({
        id: 'no-title',
        title: 'no-title', // Falls back to filename
        body: 'This guide has no title header.\n\nJust content.'
      });
    });

    it('should handle filesystem errors gracefully', () => {
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Directory not found');
      });

      const guides = getGuides();

      expect(guides).toEqual([]);
    });

    it('should ignore non-markdown files', () => {
      mockFs.readdirSync.mockReturnValue([
        'guide1.md',
        'readme.txt',
        'image.png',
        'guide2.md'
      ] as any);

      mockFs.readFileSync
        .mockReturnValueOnce('# Guide 1\n\nContent 1')
        .mockReturnValueOnce('# Guide 2\n\nContent 2');

      const guides = getGuides();

      expect(guides).toHaveLength(2);
      expect(guides.map(g => g.id)).toEqual(['guide1', 'guide2']);
    });

    it('should extract titles from different header formats', () => {
      mockFs.readdirSync.mockReturnValue([
        'test1.md',
        'test2.md',
        'test3.md'
      ] as any);

      mockFs.readFileSync
        .mockReturnValueOnce('# Simple Title\n\nContent')
        .mockReturnValueOnce('Some content\n# Title in Middle\n\nMore content')
        .mockReturnValueOnce('## Not H1 Title\n\nContent'); // Should fall back to filename

      const guides = getGuides();

      expect(guides[0].title).toBe('Simple Title');
      expect(guides[1].title).toBe('Title in Middle');
      expect(guides[2].title).toBe('test3'); // Fallback to filename
    });
  });

  describe('getLabs', () => {
    it('should return predefined lab configurations', () => {
      const labs = getLabs();

      expect(labs).toHaveLength(3);
      
      // Practice Lab
      expect(labs[0]).toEqual({
        id: 'practice-basics',
        type: 'practice',
        title: 'Practice Lab',
        instructions: 'Test your prompts against a single model and receive detailed feedback.',
        linkedGuideSlug: 'fundamentals'
      });

      // Compare Lab
      expect(labs[1]).toEqual({
        id: 'compare-basics',
        type: 'compare',
        title: 'Compare Lab',
        instructions: 'Compare your prompts across multiple models side-by-side.',
        linkedGuideSlug: 'fundamentals'
      });

      // System Prompt Lab (placeholder)
      expect(labs[2]).toEqual({
        id: 'system-prompt-lab',
        type: 'system',
        title: 'System Prompt Lab',
        instructions: 'Experiment with system prompts to guide model behavior.',
        linkedGuideSlug: 'system-prompts',
        isPlaceholder: true
      });
    });

    it('should return consistent results', () => {
      const labs1 = getLabs();
      const labs2 = getLabs();

      expect(labs1).toEqual(labs2);
    });

    it('should have proper lab types', () => {
      const labs = getLabs();

      const types = labs.map(lab => lab.type);
      expect(types).toContain('practice');
      expect(types).toContain('compare');
      expect(types).toContain('system');
    });

    it('should have linked guide slugs', () => {
      const labs = getLabs();

      labs.forEach(lab => {
        expect(lab.linkedGuideSlug).toBeDefined();
        expect(typeof lab.linkedGuideSlug).toBe('string');
        expect(lab.linkedGuideSlug!.length).toBeGreaterThan(0);
      });
    });

    it('should mark system prompt lab as placeholder', () => {
      const labs = getLabs();
      const systemLab = labs.find(lab => lab.type === 'system');

      expect(systemLab).toBeDefined();
      expect(systemLab!.isPlaceholder).toBe(true);

      // Other labs should not be placeholders
      const otherLabs = labs.filter(lab => lab.type !== 'system');
      otherLabs.forEach(lab => {
        expect(lab.isPlaceholder).toBeUndefined();
      });
    });
  });
});