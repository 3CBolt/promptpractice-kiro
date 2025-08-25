import strongPromptsData from '../data/examples/strong-prompts.json';

export interface StrongPromptExample {
  id: string;
  title: string;
  prompt: string;
  category: 'clarity' | 'completeness' | 'both';
  techniques: string[];
  explanation: string;
  concepts: string[];
}

export interface ExampleLibrary {
  schemaVersion: string;
  examples: {
    [category: string]: StrongPromptExample[];
  };
  metadata: {
    totalExamples: number;
    categories: Record<string, number>;
    lastUpdated: string;
    version: string;
  };
}

class ExamplesManager {
  private library: ExampleLibrary;

  constructor() {
    this.library = strongPromptsData as ExampleLibrary;
  }

  /**
   * Get relevant examples based on feedback criteria and user context
   */
  getRelevantExamples(
    clarityScore: number,
    completenessScore: number,
    userPrompt?: string,
    maxExamples: number = 2
  ): StrongPromptExample[] {
    const needsClarity = clarityScore < 3;
    const needsCompleteness = completenessScore < 3;
    
    let targetCategory: 'clarity' | 'completeness' | 'both';
    
    if (needsClarity && needsCompleteness) {
      targetCategory = 'both';
    } else if (needsClarity) {
      targetCategory = 'clarity';
    } else if (needsCompleteness) {
      targetCategory = 'completeness';
    } else {
      // For good scores, show 'both' examples as aspirational
      targetCategory = 'both';
    }

    // Get examples from all categories, prioritizing the target category
    const allExamples = this.getAllExamples();
    const targetExamples = allExamples.filter(ex => ex.category === targetCategory);
    const otherExamples = allExamples.filter(ex => ex.category !== targetCategory);
    
    // If we have user prompt, try to find conceptually related examples
    let relevantExamples: StrongPromptExample[] = [];
    
    if (userPrompt) {
      relevantExamples = this.findConceptuallyRelated(userPrompt, [...targetExamples, ...otherExamples]);
    }
    
    // Fall back to category-based selection if no conceptual matches
    if (relevantExamples.length === 0) {
      relevantExamples = [...targetExamples, ...otherExamples];
    }
    
    // Return a diverse set of examples
    return this.selectDiverseExamples(relevantExamples, maxExamples);
  }

  /**
   * Get examples by specific category
   */
  getExamplesByCategory(category: string): StrongPromptExample[] {
    return this.library.examples[category] || [];
  }

  /**
   * Get a specific example by ID
   */
  getExampleById(id: string): StrongPromptExample | null {
    const allExamples = this.getAllExamples();
    return allExamples.find(ex => ex.id === id) || null;
  }

  /**
   * Get all examples across all categories
   */
  getAllExamples(): StrongPromptExample[] {
    return Object.values(this.library.examples).flat();
  }

  /**
   * Find examples that are conceptually related to the user's prompt
   */
  private findConceptuallyRelated(userPrompt: string, examples: StrongPromptExample[]): StrongPromptExample[] {
    const promptLower = userPrompt.toLowerCase();
    
    // Simple keyword matching for conceptual relevance
    const keywordMatches = examples.filter(example => {
      const exampleText = (example.prompt + ' ' + example.concepts.join(' ')).toLowerCase();
      
      // Check for common prompt engineering patterns
      const patterns = [
        'explain', 'compare', 'analyze', 'write', 'create', 'list', 'describe',
        'step', 'process', 'how to', 'what is', 'why', 'when', 'where'
      ];
      
      return patterns.some(pattern => 
        promptLower.includes(pattern) && exampleText.includes(pattern)
      );
    });
    
    if (keywordMatches.length > 0) {
      return keywordMatches;
    }
    
    // Fall back to concept matching
    return examples.filter(example => 
      example.concepts.some(concept => 
        promptLower.includes(concept.replace('-', ' '))
      )
    );
  }

  /**
   * Select diverse examples to avoid repetition
   */
  private selectDiverseExamples(examples: StrongPromptExample[], maxCount: number): StrongPromptExample[] {
    if (examples.length <= maxCount) {
      return examples;
    }
    
    const selected: StrongPromptExample[] = [];
    const usedCategories = new Set<string>();
    const usedConcepts = new Set<string>();
    
    // First pass: select examples with unique categories
    for (const example of examples) {
      if (selected.length >= maxCount) break;
      
      if (!usedCategories.has(example.category)) {
        selected.push(example);
        usedCategories.add(example.category);
        example.concepts.forEach(concept => usedConcepts.add(concept));
      }
    }
    
    // Second pass: fill remaining slots with diverse concepts
    for (const example of examples) {
      if (selected.length >= maxCount) break;
      
      if (!selected.includes(example)) {
        const hasNewConcept = example.concepts.some(concept => !usedConcepts.has(concept));
        if (hasNewConcept) {
          selected.push(example);
          example.concepts.forEach(concept => usedConcepts.add(concept));
        }
      }
    }
    
    // Third pass: fill any remaining slots
    for (const example of examples) {
      if (selected.length >= maxCount) break;
      
      if (!selected.includes(example)) {
        selected.push(example);
      }
    }
    
    return selected.slice(0, maxCount);
  }

  /**
   * Get library metadata
   */
  getMetadata() {
    return this.library.metadata;
  }
}

// Export singleton instance
export const examplesManager = new ExamplesManager();

// Export utility functions
export function getRelevantExamples(
  clarityScore: number,
  completenessScore: number,
  userPrompt?: string,
  maxExamples: number = 2
): StrongPromptExample[] {
  return examplesManager.getRelevantExamples(clarityScore, completenessScore, userPrompt, maxExamples);
}

export function getExamplesByCategory(category: string): StrongPromptExample[] {
  return examplesManager.getExamplesByCategory(category);
}

export function getExampleById(id: string): StrongPromptExample | null {
  return examplesManager.getExampleById(id);
}