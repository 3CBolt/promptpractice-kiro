/**
 * Pre-generated responses for read-only demo mode
 * Provides educational value when WebGPU models are unavailable
 */

import { ModelResult, ModelSource } from '@/types';

// Categories of demo responses for different types of prompts
interface DemoResponse {
  id: string;
  category: 'general' | 'creative' | 'analytical' | 'instructional' | 'conversational';
  prompt_keywords: string[];
  response: string;
  explanation: string;
}

const DEMO_RESPONSES: DemoResponse[] = [
  {
    id: 'general-1',
    category: 'general',
    prompt_keywords: ['explain', 'what', 'how', 'why', 'describe'],
    response: 'This is a comprehensive explanation that demonstrates how a well-crafted prompt can guide an AI model to provide structured, informative responses. The key elements include clear context, specific questions, and appropriate formatting requests.',
    explanation: 'General explanatory response showing structured thinking'
  },
  {
    id: 'creative-1',
    category: 'creative',
    prompt_keywords: ['write', 'create', 'story', 'poem', 'creative', 'imagine'],
    response: 'Here\'s a creative response that showcases how specific prompts can guide AI models to produce engaging, original content. The response demonstrates narrative structure, vivid descriptions, and creative language use that aligns with the prompt\'s creative intent.',
    explanation: 'Creative writing response showing imagination and structure'
  },
  {
    id: 'analytical-1',
    category: 'analytical',
    prompt_keywords: ['analyze', 'compare', 'evaluate', 'assess', 'pros', 'cons'],
    response: 'Analysis: This response demonstrates systematic thinking by breaking down the topic into key components. First, we examine the primary factors... Second, we consider the implications... Finally, we synthesize the findings to provide actionable insights.',
    explanation: 'Analytical response showing structured reasoning'
  },
  {
    id: 'instructional-1',
    category: 'instructional',
    prompt_keywords: ['steps', 'how to', 'guide', 'tutorial', 'process', 'method'],
    response: 'Step-by-step guide:\n\n1. Begin by clearly defining your objective\n2. Gather the necessary resources and information\n3. Follow the systematic approach outlined below\n4. Monitor progress and adjust as needed\n5. Evaluate results and document lessons learned\n\nThis structured approach ensures comprehensive coverage of the topic.',
    explanation: 'Instructional response with clear step-by-step format'
  },
  {
    id: 'conversational-1',
    category: 'conversational',
    prompt_keywords: ['chat', 'talk', 'discuss', 'conversation', 'opinion'],
    response: 'That\'s an interesting question! From my perspective, this topic has several fascinating aspects worth exploring. I\'d be happy to discuss this further and hear your thoughts on the matter. What specific aspects are you most curious about?',
    explanation: 'Conversational response encouraging dialogue'
  },
  {
    id: 'technical-1',
    category: 'analytical',
    prompt_keywords: ['code', 'programming', 'technical', 'algorithm', 'function'],
    response: 'Here\'s a technical explanation that demonstrates how clear prompts can elicit detailed, accurate responses about complex topics. The response includes relevant terminology, logical structure, and practical examples that make technical concepts accessible.',
    explanation: 'Technical response showing expertise and clarity'
  },
  {
    id: 'problem-solving-1',
    category: 'analytical',
    prompt_keywords: ['problem', 'solve', 'solution', 'fix', 'troubleshoot'],
    response: 'Problem-solving approach:\n\n• Identify the core issue and its symptoms\n• Analyze potential root causes\n• Develop multiple solution strategies\n• Evaluate each option\'s feasibility\n• Implement the most promising solution\n• Monitor results and iterate as needed\n\nThis systematic approach ensures thorough problem resolution.',
    explanation: 'Problem-solving response with structured methodology'
  },
  {
    id: 'educational-1',
    category: 'instructional',
    prompt_keywords: ['learn', 'teach', 'education', 'concept', 'understand'],
    response: 'Educational explanation: This concept can be understood through three key principles. First, we establish the foundational knowledge... Next, we build upon this with practical examples... Finally, we connect these ideas to real-world applications, making the learning both comprehensive and applicable.',
    explanation: 'Educational response with progressive learning structure'
  }
];

// Fallback response generator
export class FallbackResponseGenerator {
  private usedResponses: Set<string> = new Set();

  /**
   * Generates a contextually appropriate demo response
   */
  generateResponse(prompt: string, systemPrompt?: string): ModelResult {
    const startTime = Date.now();
    
    // Analyze prompt to determine best response category
    const category = this.categorizePrompt(prompt);
    const response = this.selectResponse(category, prompt);
    
    const latencyMs = Date.now() - startTime + Math.random() * 1000 + 500; // Simulate realistic latency
    const tokenCount = Math.round(response.length / 4); // Rough token estimation

    return {
      modelId: 'read-only-demo',
      response,
      latency: latencyMs,
      tokenCount,
      source: ModelSource.SAMPLE
    };
  }

  /**
   * Categorizes a prompt based on keywords and structure
   */
  private categorizePrompt(prompt: string): DemoResponse['category'] {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for creative writing indicators
    if (this.containsKeywords(lowerPrompt, ['write', 'create', 'story', 'poem', 'creative', 'imagine', 'fiction'])) {
      return 'creative';
    }
    
    // Check for analytical indicators
    if (this.containsKeywords(lowerPrompt, ['analyze', 'compare', 'evaluate', 'assess', 'pros', 'cons', 'advantages', 'disadvantages'])) {
      return 'analytical';
    }
    
    // Check for instructional indicators
    if (this.containsKeywords(lowerPrompt, ['steps', 'how to', 'guide', 'tutorial', 'process', 'method', 'instructions'])) {
      return 'instructional';
    }
    
    // Check for conversational indicators
    if (this.containsKeywords(lowerPrompt, ['chat', 'talk', 'discuss', 'conversation', 'opinion', 'think', 'feel'])) {
      return 'conversational';
    }
    
    // Default to general
    return 'general';
  }

  /**
   * Selects the most appropriate response for the given category and prompt
   */
  private selectResponse(category: DemoResponse['category'], prompt: string): string {
    const candidateResponses = DEMO_RESPONSES.filter(r => r.category === category);
    
    if (candidateResponses.length === 0) {
      // Fallback to general responses
      return this.selectFromGeneral(prompt);
    }
    
    // Find unused responses first
    const unusedResponses = candidateResponses.filter(r => !this.usedResponses.has(r.id));
    const responsesToConsider = unusedResponses.length > 0 ? unusedResponses : candidateResponses;
    
    // Find the best match based on keyword overlap
    let bestMatch = responsesToConsider[0];
    let bestScore = 0;
    
    for (const response of responsesToConsider) {
      const score = this.calculateKeywordScore(prompt.toLowerCase(), response.prompt_keywords);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = response;
      }
    }
    
    // If no keyword matches, use a random response to add variety
    if (bestScore === 0 && responsesToConsider.length > 1) {
      const randomIndex = Math.floor(Math.random() * responsesToConsider.length);
      bestMatch = responsesToConsider[randomIndex];
    }
    
    // Mark as used and return
    this.usedResponses.add(bestMatch.id);
    
    // Reset used responses if we've used them all
    if (this.usedResponses.size >= DEMO_RESPONSES.length) {
      this.usedResponses.clear();
    }
    
    return bestMatch.response;
  }

  /**
   * Selects from general responses when no category match is found
   */
  private selectFromGeneral(prompt: string): string {
    const generalResponses = DEMO_RESPONSES.filter(r => r.category === 'general');
    const randomIndex = Math.floor(Math.random() * generalResponses.length);
    return generalResponses[randomIndex]?.response || 
           'This is a demonstration response showing how the AI model would typically respond to your prompt with relevant, helpful information structured according to your request.';
  }

  /**
   * Checks if the prompt contains any of the specified keywords
   */
  private containsKeywords(prompt: string, keywords: string[]): boolean {
    return keywords.some(keyword => prompt.includes(keyword));
  }

  /**
   * Calculates a score based on keyword matches
   */
  private calculateKeywordScore(prompt: string, keywords: string[]): number {
    let score = 0;
    for (const keyword of keywords) {
      if (prompt.includes(keyword)) {
        score += 1;
      }
    }
    return score;
  }

  /**
   * Gets information about the demo mode for user education
   */
  getDemoModeInfo(): {
    title: string;
    description: string;
    limitations: string[];
    benefits: string[];
  } {
    return {
      title: 'Read-Only Demo Mode',
      description: 'You\'re using pre-generated responses that demonstrate how AI models typically respond to different types of prompts.',
      limitations: [
        'Responses are not generated in real-time',
        'Limited variety of response types',
        'Cannot adapt to highly specific prompts',
        'No actual model inference occurring'
      ],
      benefits: [
        'Learn prompt engineering concepts',
        'See examples of well-structured responses',
        'Practice without technical requirements',
        'Understand response patterns and formats'
      ]
    };
  }

  /**
   * Resets the used responses tracker
   */
  reset(): void {
    this.usedResponses.clear();
  }
}

// Singleton instance for consistent behavior
let fallbackGenerator: FallbackResponseGenerator | null = null;

export function getFallbackGenerator(): FallbackResponseGenerator {
  if (!fallbackGenerator) {
    fallbackGenerator = new FallbackResponseGenerator();
  }
  return fallbackGenerator;
}

// Utility function to check if we should use fallback mode
export function shouldUseFallbackMode(): boolean {
  // Check localStorage for user preference or previous failures
  const fallbackPreference = localStorage.getItem('prefer_demo_mode');
  const webgpuFailures = localStorage.getItem('webgpu_failure_count');
  
  if (fallbackPreference === 'true') {
    return true;
  }
  
  // If WebGPU has failed multiple times, suggest demo mode
  if (webgpuFailures && parseInt(webgpuFailures) >= 3) {
    return true;
  }
  
  return false;
}

// Utility to track WebGPU failures
export function trackWebGPUFailure(): void {
  const currentCount = parseInt(localStorage.getItem('webgpu_failure_count') || '0');
  localStorage.setItem('webgpu_failure_count', (currentCount + 1).toString());
}

// Utility to reset failure tracking on success
export function resetWebGPUFailures(): void {
  localStorage.removeItem('webgpu_failure_count');
}

// Utility to set demo mode preference
export function setDemoModePreference(prefer: boolean): void {
  localStorage.setItem('prefer_demo_mode', prefer.toString());
}