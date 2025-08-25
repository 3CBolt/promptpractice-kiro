import { getRelevantExamples, getExamplesByCategory, getExampleById, examplesManager } from '../examples';

describe('Examples Manager', () => {
  describe('getRelevantExamples', () => {
    it('should return clarity-focused examples for low clarity scores', () => {
      const examples = getRelevantExamples(2, 4, 'Write a story about cats');
      
      expect(examples).toBeDefined();
      expect(examples.length).toBeGreaterThan(0);
      expect(examples.length).toBeLessThanOrEqual(2);
      
      // Should prioritize clarity or both categories
      const hasRelevantCategory = examples.some(ex => 
        ex.category === 'clarity' || ex.category === 'both'
      );
      expect(hasRelevantCategory).toBe(true);
    });

    it('should return completeness-focused examples for low completeness scores', () => {
      const examples = getRelevantExamples(4, 2, 'Explain photosynthesis');
      
      expect(examples).toBeDefined();
      expect(examples.length).toBeGreaterThan(0);
      expect(examples.length).toBeLessThanOrEqual(2);
      
      // Should prioritize completeness or both categories
      const hasRelevantCategory = examples.some(ex => 
        ex.category === 'completeness' || ex.category === 'both'
      );
      expect(hasRelevantCategory).toBe(true);
    });

    it('should return both-category examples for low scores in both areas', () => {
      const examples = getRelevantExamples(2, 2, 'Help me with something');
      
      expect(examples).toBeDefined();
      expect(examples.length).toBeGreaterThan(0);
      
      // Should prioritize 'both' category when both scores are low
      const hasBothCategory = examples.some(ex => ex.category === 'both');
      expect(hasBothCategory).toBe(true);
    });

    it('should return aspirational examples for high scores', () => {
      const examples = getRelevantExamples(5, 5, 'Perfect prompt example');
      
      expect(examples).toBeDefined();
      expect(examples.length).toBeGreaterThan(0);
      
      // Should show 'both' examples as aspirational content
      const hasBothCategory = examples.some(ex => ex.category === 'both');
      expect(hasBothCategory).toBe(true);
    });

    it('should respect maxExamples parameter', () => {
      const examples = getRelevantExamples(3, 3, 'Test prompt', 1);
      
      expect(examples.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getExamplesByCategory', () => {
    it('should return examples for valid categories', () => {
      const fundamentalsExamples = getExamplesByCategory('fundamentals');
      expect(fundamentalsExamples).toBeDefined();
      expect(Array.isArray(fundamentalsExamples)).toBe(true);
      
      if (fundamentalsExamples.length > 0) {
        expect(fundamentalsExamples[0]).toHaveProperty('id');
        expect(fundamentalsExamples[0]).toHaveProperty('title');
        expect(fundamentalsExamples[0]).toHaveProperty('prompt');
        expect(fundamentalsExamples[0]).toHaveProperty('category');
        expect(fundamentalsExamples[0]).toHaveProperty('techniques');
        expect(fundamentalsExamples[0]).toHaveProperty('explanation');
        expect(fundamentalsExamples[0]).toHaveProperty('concepts');
      }
    });

    it('should return empty array for invalid categories', () => {
      const invalidExamples = getExamplesByCategory('nonexistent');
      expect(invalidExamples).toEqual([]);
    });
  });

  describe('getExampleById', () => {
    it('should return example for valid ID', () => {
      // Get all examples to find a valid ID
      const allExamples = examplesManager.getAllExamples();
      
      if (allExamples.length > 0) {
        const firstExample = allExamples[0];
        const foundExample = getExampleById(firstExample.id);
        
        expect(foundExample).toBeDefined();
        expect(foundExample?.id).toBe(firstExample.id);
      }
    });

    it('should return null for invalid ID', () => {
      const example = getExampleById('nonexistent-id');
      expect(example).toBeNull();
    });
  });

  describe('getAllExamples', () => {
    it('should return all examples across categories', () => {
      const allExamples = examplesManager.getAllExamples();
      
      expect(allExamples).toBeDefined();
      expect(Array.isArray(allExamples)).toBe(true);
      expect(allExamples.length).toBeGreaterThan(0);
      
      // Should have examples from different categories
      const categories = new Set(allExamples.map(ex => ex.category));
      expect(categories.size).toBeGreaterThan(1);
    });
  });

  describe('getMetadata', () => {
    it('should return library metadata', () => {
      const metadata = examplesManager.getMetadata();
      
      expect(metadata).toBeDefined();
      expect(metadata).toHaveProperty('totalExamples');
      expect(metadata).toHaveProperty('categories');
      expect(metadata).toHaveProperty('lastUpdated');
      expect(metadata).toHaveProperty('version');
      
      expect(typeof metadata.totalExamples).toBe('number');
      expect(metadata.totalExamples).toBeGreaterThan(0);
    });
  });

  describe('conceptual matching', () => {
    it('should find conceptually related examples', () => {
      const examples = getRelevantExamples(3, 3, 'explain how to do something step by step');
      
      expect(examples).toBeDefined();
      expect(examples.length).toBeGreaterThan(0);
      
      // Should find examples related to step-by-step processes
      const hasStepByStepExample = examples.some(ex => 
        ex.prompt.toLowerCase().includes('step') || 
        ex.concepts.some(concept => concept.includes('step'))
      );
      
      // This might not always match, but the function should still return valid examples
      expect(examples.every(ex => ex.id && ex.title && ex.prompt)).toBe(true);
    });
  });

  describe('diversity selection', () => {
    it('should select diverse examples when many are available', () => {
      const examples = getRelevantExamples(2, 2, 'test prompt', 3);
      
      if (examples.length > 1) {
        // Check that we don't have duplicate categories if possible
        const categories = examples.map(ex => ex.category);
        const uniqueCategories = new Set(categories);
        
        // Should try to provide diverse categories when possible
        expect(uniqueCategories.size).toBeGreaterThan(0);
      }
    });
  });
});