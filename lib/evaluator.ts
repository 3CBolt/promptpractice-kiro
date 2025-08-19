import { readFileSync } from 'fs';
import { join } from 'path';
import { ModelResult } from '@/types';

export interface EvaluationResult {
  score: number;
  breakdown: {
    clarity: number;
    completeness: number;
  };
  notes: string;
}

export interface RubricCriteria {
  clarity: {
    description: string;
    scoreDescriptions: Record<number, string>;
  };
  completeness: {
    description: string;
    scoreDescriptions: Record<number, string>;
  };
}

/**
 * Parses the rubric from /docs/rubric.md
 * Returns null if file doesn't exist or can't be parsed
 */
export function parseRubric(): RubricCriteria | null {
  try {
    const rubricPath = join(process.cwd(), 'docs', 'rubric.md');
    const rubricContent = readFileSync(rubricPath, 'utf-8');
    
    // Simple parsing - look for the rubric structure
    if (rubricContent && rubricContent.includes('Clarity') && rubricContent.includes('Completeness')) {
      return {
        clarity: {
          description: 'Measures how clear, coherent, and well-structured the response is.',
          scoreDescriptions: {
            5: 'Excellent - Exceptionally clear and easy to understand',
            4: 'Good - Clear and mostly easy to understand',
            3: 'Satisfactory - Understandable but may require some effort',
            2: 'Needs Improvement - Somewhat unclear or confusing',
            1: 'Poor - Difficult to understand',
            0: 'Unacceptable - Incomprehensible'
          }
        },
        completeness: {
          description: 'Measures how well the response addresses the prompt and covers the requested information.',
          scoreDescriptions: {
            5: 'Excellent - Fully addresses all aspects of the prompt',
            4: 'Good - Addresses most aspects of the prompt well',
            3: 'Satisfactory - Addresses the basic requirements',
            2: 'Needs Improvement - Partially addresses the prompt',
            1: 'Poor - Barely addresses the prompt',
            0: 'Unacceptable - Fails to address the prompt'
          }
        }
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Could not parse rubric file:', error);
    return null;
  }
}

/**
 * Fallback heuristic evaluation when rubric is not available
 */
function evaluateWithHeuristics(userPrompt: string, response: string): EvaluationResult {
  // Basic heuristics for clarity
  let clarityScore = 3; // Start with satisfactory
  
  // Check for basic clarity indicators
  const hasGoodLength = response.length >= 50 && response.length <= 1000;
  const hasProperSentences = response.includes('.') || response.includes('!') || response.includes('?');
  const hasReasonableStructure = response.split('\n').length > 1 || response.split('. ').length > 2;
  
  if (hasGoodLength && hasProperSentences && hasReasonableStructure) {
    clarityScore = 4;
  } else if (!hasProperSentences || response.length < 20) {
    clarityScore = 2;
  }
  
  // Basic heuristics for completeness
  let completenessScore = 3; // Start with satisfactory
  
  // Check if response seems to address the prompt
  const promptWords = userPrompt.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  const responseWords = response.toLowerCase().split(/\s+/);
  const matchingWords = promptWords.filter(word => responseWords.some(rWord => rWord.includes(word)));
  
  const relevanceRatio = matchingWords.length / Math.max(promptWords.length, 1);
  
  if (relevanceRatio > 0.5 && response.length > 100) {
    completenessScore = 4;
  } else if (relevanceRatio < 0.2 || response.length < 30) {
    completenessScore = 2;
  }
  
  const totalScore = clarityScore + completenessScore;
  
  return {
    score: totalScore,
    breakdown: {
      clarity: clarityScore,
      completeness: completenessScore
    },
    notes: generateImprovementNotes(clarityScore, completenessScore, userPrompt, response)
  };
}

/**
 * Rubric-based evaluation using parsed criteria
 */
function evaluateWithRubric(userPrompt: string, response: string, rubric: RubricCriteria): EvaluationResult {
  // For MVP, we'll use the same heuristic logic but with rubric-informed scoring
  // In a real implementation, this would use more sophisticated NLP analysis
  
  const heuristicResult = evaluateWithHeuristics(userPrompt, response);
  
  // Apply rubric context to the notes
  const notes = generateRubricBasedNotes(heuristicResult.breakdown, rubric);
  
  return {
    ...heuristicResult,
    notes
  };
}

/**
 * Generates improvement notes based on scores
 */
function generateImprovementNotes(clarityScore: number, completenessScore: number, userPrompt: string, response: string): string {
  const notes: string[] = [];
  
  if (clarityScore <= 2) {
    notes.push('• Improve clarity by using shorter sentences and better organization');
    notes.push('• Check grammar and sentence structure');
  } else if (clarityScore === 3) {
    notes.push('• Consider improving sentence flow and organization');
  }
  
  if (completenessScore <= 2) {
    notes.push('• Address more aspects of the original prompt');
    notes.push('• Provide more detailed and relevant information');
  } else if (completenessScore === 3) {
    notes.push('• Consider adding more depth to fully address the prompt');
  }
  
  if (notes.length === 0) {
    notes.push('• Great response! Consider experimenting with different prompt techniques');
  }
  
  return notes.join('\n');
}

/**
 * Generates rubric-based improvement notes
 */
function generateRubricBasedNotes(breakdown: { clarity: number; completeness: number }, rubric: RubricCriteria): string {
  const notes: string[] = [];
  
  if (breakdown.clarity <= 3) {
    notes.push(`• Clarity (${breakdown.clarity}/5): ${rubric.clarity.scoreDescriptions[breakdown.clarity]}`);
    if (breakdown.clarity <= 2) {
      notes.push('  - Focus on sentence structure and organization');
    }
  }
  
  if (breakdown.completeness <= 3) {
    notes.push(`• Completeness (${breakdown.completeness}/5): ${rubric.completeness.scoreDescriptions[breakdown.completeness]}`);
    if (breakdown.completeness <= 2) {
      notes.push('  - Ensure you address all aspects of the prompt');
    }
  }
  
  if (notes.length === 0) {
    notes.push('• Excellent response! Both clarity and completeness are strong');
  }
  
  return notes.join('\n');
}

/**
 * Main evaluation function
 * Evaluates a model response against a user prompt
 */
export function evaluateResponse(userPrompt: string, modelResult: ModelResult): EvaluationResult {
  // Try to use rubric-based evaluation first
  const rubric = parseRubric();
  
  if (rubric) {
    return evaluateWithRubric(userPrompt, modelResult.text, rubric);
  } else {
    // Fallback to heuristic evaluation
    return evaluateWithHeuristics(userPrompt, modelResult.text);
  }
}

/**
 * Evaluates multiple model results
 */
export function evaluateMultipleResponses(userPrompt: string, modelResults: ModelResult[]): EvaluationResult[] {
  return modelResults.map(result => evaluateResponse(userPrompt, result));
}

/**
 * Formats evaluation results for display
 */
export function formatEvaluationResult(evaluation: EvaluationResult): {
  scoreDisplay: string;
  breakdownDisplay: string;
  notesDisplay: string;
} {
  return {
    scoreDisplay: `${evaluation.score}/10`,
    breakdownDisplay: `Clarity: ${evaluation.breakdown.clarity}/5, Completeness: ${evaluation.breakdown.completeness}/5`,
    notesDisplay: evaluation.notes
  };
}