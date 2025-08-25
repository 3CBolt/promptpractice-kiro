import { readFileSync } from 'fs';
import { join } from 'path';
import { ModelResult, EvaluationScores, EvaluationFeedback } from '../types';

export interface EvaluationResult {
  score: number;
  breakdown: {
    clarity: number;
    completeness: number;
  };
  notes: string;
}

export interface RubricCriteria {
  version: string;
  clarity: {
    description: string;
    scoreDescriptions: Record<number, string>;
  };
  completeness: {
    description: string;
    scoreDescriptions: Record<number, string>;
  };
}

// Current rubric version - update this when rubric changes
export const CURRENT_RUBRIC_VERSION = '1.0';

/**
 * Parses the rubric from /docs/rubric.md with version support
 * Returns null if file doesn't exist or can't be parsed
 */
export function parseRubric(version?: string): RubricCriteria | null {
  try {
    const rubricPath = join(process.cwd(), 'docs', 'rubric.md');
    const rubricContent = readFileSync(rubricPath, 'utf-8');
    
    // Extract version from rubric content
    const versionMatch = rubricContent.match(/\*\*Rubric Version\*\*:\s*([^\n]+)/);
    const rubricVersion = versionMatch ? versionMatch[1].trim() : '1.0';
    
    // If a specific version is requested and doesn't match, return null
    if (version && version !== rubricVersion) {
      console.warn(`Requested rubric version ${version} but found ${rubricVersion}`);
      return null;
    }
    
    // Parse the v1.0 rubric structure
    if (rubricContent && rubricContent.includes('Clarity Metric') && rubricContent.includes('Completeness Metric')) {
      return {
        version: rubricVersion,
        clarity: {
          description: 'Evaluates how clear, coherent, and well-structured the model\'s response is.',
          scoreDescriptions: {
            5: 'Excellent - Response is exceptionally clear, well-organized, and easy to understand',
            4: 'Good - Response is clear and well-structured with minor areas for improvement',
            3: 'Satisfactory - Response is generally clear but may have some organizational issues',
            2: 'Needs improvement - Response has clarity issues that impact understanding',
            1: 'Poor - Response is difficult to understand or poorly structured',
            0: 'Unacceptable - Response is incomprehensible or completely unclear'
          }
        },
        completeness: {
          description: 'Evaluates how thoroughly the model addresses the user\'s prompt and requirements.',
          scoreDescriptions: {
            5: 'Excellent - Fully addresses all aspects of the prompt with comprehensive coverage',
            4: 'Good - Addresses most aspects well with minor gaps',
            3: 'Satisfactory - Covers the main points but may miss some details',
            2: 'Needs improvement - Partially addresses the prompt with notable omissions',
            1: 'Poor - Minimally addresses the prompt with significant gaps',
            0: 'Unacceptable - Fails to address the prompt or provides irrelevant content'
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
 * Gets the current rubric version
 */
export function getCurrentRubricVersion(): string {
  const rubric = parseRubric();
  return rubric?.version || CURRENT_RUBRIC_VERSION;
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
 * Rubric-based evaluation using parsed criteria with version support
 */
function evaluateWithRubric(userPrompt: string, response: string, rubric: RubricCriteria): EvaluationResult {
  // For MVP, we'll use enhanced heuristic logic informed by the v1.0 rubric
  // In a real implementation, this would use more sophisticated NLP analysis
  
  const heuristicResult = evaluateWithHeuristics(userPrompt, response);
  
  // Apply v1.0 rubric context to generate constructive notes
  const notes = generateConstructiveFeedback(heuristicResult.breakdown, userPrompt, response, rubric);
  
  return {
    ...heuristicResult,
    notes
  };
}

/**
 * Generates constructive feedback following v1.0 rubric guidelines
 */
function generateConstructiveFeedback(
  breakdown: { clarity: number; completeness: number },
  userPrompt: string,
  response: string,
  rubric: RubricCriteria
): string {
  const clarityFeedback = generateCriterionFeedback('clarity', breakdown.clarity, userPrompt, response, rubric);
  const completenessFeedback = generateCriterionFeedback('completeness', breakdown.completeness, userPrompt, response, rubric);
  
  const notes: string[] = [];
  
  // Start with positive observations when scores are good
  if (breakdown.clarity >= 4 && breakdown.completeness >= 4) {
    notes.push('🎉 Excellent work! Your prompt produced a high-quality response.');
    if (breakdown.clarity === 5) notes.push('✨ Outstanding clarity - the response is exceptionally well-organized.');
    if (breakdown.completeness === 5) notes.push('✨ Comprehensive coverage - all aspects thoroughly addressed.');
    notes.push('');
    notes.push('💡 ' + (breakdown.clarity >= breakdown.completeness ? clarityFeedback.exampleFix : completenessFeedback.exampleFix));
    return notes.join('\n');
  }
  
  // Mixed or lower scores - provide constructive guidance
  const hasPositives = [...clarityFeedback.positiveAspects, ...completenessFeedback.positiveAspects].length > 0;
  
  if (hasPositives) {
    notes.push('👍 What worked well:');
    [...clarityFeedback.positiveAspects, ...completenessFeedback.positiveAspects].forEach(aspect => {
      notes.push(`  • ${aspect}`);
    });
    notes.push('');
  }
  
  // Areas for improvement
  if (breakdown.clarity <= 3 || breakdown.completeness <= 3) {
    notes.push('🔧 Areas to improve:');
    
    if (breakdown.clarity <= 3) {
      notes.push(`  • Clarity (${breakdown.clarity}/5): ${clarityFeedback.explanation}`);
    }
    
    if (breakdown.completeness <= 3) {
      notes.push(`  • Completeness (${breakdown.completeness}/5): ${completenessFeedback.explanation}`);
    }
    
    notes.push('');
  }
  
  // Actionable suggestions
  const allSuggestions = [...clarityFeedback.improvementSuggestions, ...completenessFeedback.improvementSuggestions];
  if (allSuggestions.length > 0) {
    notes.push('💡 Try this:');
    // Limit to top 3 suggestions to avoid overwhelming beginners
    allSuggestions.slice(0, 3).forEach(suggestion => {
      notes.push(`  • ${suggestion}`);
    });
    notes.push('');
  }
  
  // Example fix
  const primaryIssue = breakdown.clarity <= breakdown.completeness ? 'clarity' : 'completeness';
  const exampleFix = primaryIssue === 'clarity' ? clarityFeedback.exampleFix : completenessFeedback.exampleFix;
  notes.push('📝 Example: ' + exampleFix);
  
  return notes.join('\n');
}

/**
 * Generates constructive feedback for each criterion using v1.0 rubric guidelines
 */
function generateCriterionFeedback(
  criterion: 'clarity' | 'completeness',
  score: number,
  userPrompt: string,
  response: string,
  rubric?: RubricCriteria
): { explanation: string; exampleFix: string; improvementSuggestions: string[]; positiveAspects: string[] } {
  
  if (criterion === 'clarity') {
    const positiveAspects: string[] = [];
    const improvementSuggestions: string[] = [];
    let explanation = '';
    let exampleFix = '';

    if (score >= 4) {
      explanation = 'Your prompt produced a clear, well-structured response that\'s easy to understand.';
      positiveAspects.push('Response has excellent structure and flow');
      positiveAspects.push('Language is clear and accessible');
      if (score === 5) {
        positiveAspects.push('Exceptional organization and formatting');
        exampleFix = 'Outstanding work! This prompt demonstrates excellent clarity techniques. Consider sharing this approach with others learning prompt engineering.';
      } else {
        exampleFix = 'Great work! Try experimenting with different formatting requests (like bullet points or numbered steps) to see how they affect clarity.';
      }
    } else if (score === 3) {
      explanation = 'The response is generally clear but could benefit from better organization or structure.';
      positiveAspects.push('Basic clarity is maintained');
      improvementSuggestions.push('Ask for numbered lists or bullet points');
      improvementSuggestions.push('Request step-by-step explanations');
      improvementSuggestions.push('Be more specific about the format you want');
      exampleFix = 'Try: "Please explain this in 3 clear steps with examples for each step."';
    } else if (score >= 1) {
      explanation = 'The response could be much clearer with better prompt structure and specificity.';
      improvementSuggestions.push('Be more specific about the format you want');
      improvementSuggestions.push('Ask for examples or concrete details');
      improvementSuggestions.push('Break complex requests into smaller parts');
      improvementSuggestions.push('Request organized information with headings');
      exampleFix = 'Instead of "Tell me about X", try "Explain X in simple terms with 2-3 specific examples, organized with clear headings."';
    } else {
      explanation = 'The model didn\'t provide a clear response. This often happens with unclear prompts or technical issues.';
      improvementSuggestions.push('Try rephrasing your prompt more clearly');
      improvementSuggestions.push('Check for technical issues or try a different model');
      improvementSuggestions.push('Start with a simpler, more direct question');
      exampleFix = 'Try a clear, direct prompt like: "Please explain [topic] in simple terms."';
    }

    return { explanation, exampleFix, improvementSuggestions, positiveAspects };
  }

  // Completeness feedback
  const positiveAspects: string[] = [];
  const improvementSuggestions: string[] = [];
  let explanation = '';
  let exampleFix = '';

  if (score >= 4) {
    explanation = 'Your prompt successfully guided the model to address all the important aspects thoroughly.';
    positiveAspects.push('Response covers all key points comprehensively');
    positiveAspects.push('Good depth of information provided');
    if (score === 5) {
      positiveAspects.push('Goes beyond requirements with valuable insights');
      exampleFix = 'Exceptional completeness! This prompt demonstrates how to get comprehensive responses. Consider using this approach as a template for similar questions.';
    } else {
      exampleFix = 'Excellent coverage! Consider asking follow-up questions to explore specific aspects in even more detail.';
    }
  } else if (score === 3) {
    explanation = 'The response covers the main points but might be missing some important details or context.';
    positiveAspects.push('Addresses the primary request adequately');
    improvementSuggestions.push('Specify exactly what information you need');
    improvementSuggestions.push('Ask for comprehensive coverage of the topic');
    improvementSuggestions.push('List all aspects you want covered');
    exampleFix = 'Try adding: "Please make sure to cover all aspects including [specific areas you want covered]."';
  } else if (score >= 1) {
    explanation = 'The response only partially addresses your prompt. More specific guidance would help.';
    improvementSuggestions.push('List all the specific points you want covered');
    improvementSuggestions.push('Provide context about why you need this information');
    improvementSuggestions.push('Ask for comprehensive explanations');
    improvementSuggestions.push('Break complex questions into smaller parts');
    exampleFix = 'Try: "Please provide a complete explanation covering: 1) [point A], 2) [point B], 3) [point C]."';
  } else {
    explanation = 'The model didn\'t address your prompt. This might be due to an unclear request or technical issues.';
    improvementSuggestions.push('Try rephrasing your prompt or checking for technical issues');
    improvementSuggestions.push('Be more specific about what you want');
    improvementSuggestions.push('Start with a simpler, more focused question');
    exampleFix = 'Try a direct approach: "Please explain [specific topic] and include [specific details you need]."';
  }

  return { explanation, exampleFix, improvementSuggestions, positiveAspects };
}

/**
 * Generates improvement notes based on scores (legacy function for backward compatibility)
 */
function generateImprovementNotes(clarityScore: number, completenessScore: number, userPrompt: string, response: string): string {
  const rubric = parseRubric();
  const clarityFeedback = generateCriterionFeedback('clarity', clarityScore, userPrompt, response, rubric || undefined);
  const completenessFeedback = generateCriterionFeedback('completeness', completenessScore, userPrompt, response, rubric || undefined);
  
  // Use the new constructive feedback format
  return generateConstructiveFeedback(
    { clarity: clarityScore, completeness: completenessScore },
    userPrompt,
    response,
    rubric || {
      version: CURRENT_RUBRIC_VERSION,
      clarity: { description: '', scoreDescriptions: {} },
      completeness: { description: '', scoreDescriptions: {} }
    }
  );
}

/**
 * Generates rubric-based improvement notes (legacy - replaced by generateConstructiveFeedback)
 */
function generateRubricBasedNotes(breakdown: { clarity: number; completeness: number }, rubric: RubricCriteria): string {
  // Use the new constructive feedback approach
  return generateConstructiveFeedback(breakdown, '', '', rubric);
}

/**
 * Validates rubric version compatibility
 */
export function isRubricVersionSupported(version: string): boolean {
  const supportedVersions = ['1.0'];
  return supportedVersions.includes(version);
}

/**
 * Gets rubric metadata
 */
export function getRubricMetadata(): { version: string; supportedVersions: string[] } {
  return {
    version: getCurrentRubricVersion(),
    supportedVersions: ['1.0']
  };
}

/**
 * Enhanced evaluation result with detailed feedback
 */
export interface EnhancedEvaluationResult extends EvaluationResult {
  clarityFeedback: {
    explanation: string;
    exampleFix: string;
    improvementSuggestions: string[];
    positiveAspects: string[];
  };
  completenessFeedback: {
    explanation: string;
    exampleFix: string;
    improvementSuggestions: string[];
    positiveAspects: string[];
  };
}

/**
 * Main evaluation function with rubric version support
 * Evaluates a model response against a user prompt using specified rubric version
 */
export function evaluateResponse(userPrompt: string, modelResult: ModelResult, rubricVersion?: string): EvaluationResult {
  // Try to use rubric-based evaluation with version support
  const rubric = parseRubric(rubricVersion);
  
  if (rubric) {
    return evaluateWithRubric(userPrompt, modelResult.response, rubric);
  } else {
    // Fallback to heuristic evaluation
    console.warn(`Rubric version ${rubricVersion || 'current'} not found, using heuristic evaluation`);
    return evaluateWithHeuristics(userPrompt, modelResult.response);
  }
}

/**
 * Enhanced evaluation function with detailed feedback and version support
 */
export function evaluateResponseEnhanced(userPrompt: string, modelResult: ModelResult, rubricVersion?: string): EnhancedEvaluationResult {
  const basicResult = evaluateResponse(userPrompt, modelResult, rubricVersion);
  const responseText = modelResult.response;
  const rubric = parseRubric(rubricVersion);
  
  const clarityFeedback = generateCriterionFeedback('clarity', basicResult.breakdown.clarity, userPrompt, responseText, rubric ?? undefined);
  const completenessFeedback = generateCriterionFeedback('completeness', basicResult.breakdown.completeness, userPrompt, responseText, rubric ?? undefined);
  
  return {
    ...basicResult,
    clarityFeedback,
    completenessFeedback
  };
}

/**
 * Evaluates multiple model results with version support
 */
export function evaluateMultipleResponses(userPrompt: string, modelResults: ModelResult[], rubricVersion?: string): EvaluationResult[] {
  return modelResults.map(result => evaluateResponse(userPrompt, result, rubricVersion));
}

/**
 * Creates evaluation scores and feedback in v1.0 format
 */
export function createEvaluationScoresAndFeedback(userPrompt: string, modelResult: ModelResult, rubricVersion?: string): {
  scores: EvaluationScores;
  feedback: EvaluationFeedback;
} {
  const enhancedResult = evaluateResponseEnhanced(userPrompt, modelResult, rubricVersion);
  
  return {
    scores: {
      clarity: enhancedResult.breakdown.clarity,
      completeness: enhancedResult.breakdown.completeness,
      total: enhancedResult.score
    },
    feedback: {
      criterionId: 'overall',
      explanation: enhancedResult.notes,
      improvementSuggestions: [
        ...enhancedResult.clarityFeedback.improvementSuggestions,
        ...enhancedResult.completenessFeedback.improvementSuggestions
      ].slice(0, 3), // Limit to top 3 suggestions
      positiveAspects: [
        ...enhancedResult.clarityFeedback.positiveAspects,
        ...enhancedResult.completenessFeedback.positiveAspects
      ],
      exampleFix: enhancedResult.clarityFeedback.exampleFix || enhancedResult.completenessFeedback.exampleFix
    }
  };
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