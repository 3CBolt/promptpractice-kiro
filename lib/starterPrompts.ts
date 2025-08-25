/**
 * Starter prompt scaffolds for different concepts and skill levels
 */

export interface StarterPrompt {
  id: string;
  title: string;
  prompt: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  concept: string;
  description: string;
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  // Fundamentals - Clarity and Specificity
  {
    id: 'fundamentals-beginner-1',
    title: 'Simple Explanation',
    prompt: 'Explain the water cycle in simple terms for a 10-year-old, using an analogy they can relate to.',
    level: 'beginner',
    concept: 'clarity-and-specificity',
    description: 'Practice being specific about audience and format'
  },
  {
    id: 'fundamentals-beginner-2',
    title: 'Recipe Request',
    prompt: 'Give me a simple recipe for chocolate chip cookies that takes less than 30 minutes and uses ingredients I can find at any grocery store.',
    level: 'beginner',
    concept: 'clarity-and-specificity',
    description: 'Practice setting clear constraints and expectations'
  },
  {
    id: 'fundamentals-intermediate-1',
    title: 'Travel Planning',
    prompt: 'I\'m planning a 3-day weekend trip to a city I\'ve never visited. Create a balanced itinerary that includes cultural attractions, local food experiences, and outdoor activities. Assume a moderate budget and that I enjoy both history and nature.',
    level: 'intermediate',
    concept: 'clarity-and-specificity',
    description: 'Practice providing context and multiple requirements'
  },
  {
    id: 'fundamentals-intermediate-2',
    title: 'Product Analysis',
    prompt: 'Analyze this product description and rewrite it to be more compelling for online sales. Focus on benefits over features and include a clear call-to-action. Original: "Our vacuum cleaner has a 1200W motor, HEPA filter, and 5-meter cord."',
    level: 'intermediate',
    concept: 'clarity-and-specificity',
    description: 'Practice giving specific transformation instructions'
  },

  // Chain of Thought - Step-by-step reasoning
  {
    id: 'chain-of-thought-beginner-1',
    title: 'Math Problem',
    prompt: 'Solve this step by step: If a pizza is cut into 8 slices and I eat 3 slices, what fraction of the pizza did I eat? Show your reasoning.',
    level: 'beginner',
    concept: 'step-by-step-reasoning',
    description: 'Practice requesting explicit reasoning steps'
  },
  {
    id: 'chain-of-thought-intermediate-1',
    title: 'Decision Making',
    prompt: 'I need to decide between two job offers. Walk me through a systematic approach to evaluate them. Consider factors like salary, growth potential, work-life balance, and company culture. Show me the decision-making process step by step.',
    level: 'intermediate',
    concept: 'step-by-step-reasoning',
    description: 'Practice complex multi-factor analysis'
  },
  {
    id: 'chain-of-thought-advanced-1',
    title: 'Business Strategy',
    prompt: 'A small bookstore is losing customers to online retailers. Develop a comprehensive strategy to help them compete. Think through this systematically: analyze the problem, identify opportunities, propose solutions, and outline implementation steps.',
    level: 'advanced',
    concept: 'step-by-step-reasoning',
    description: 'Practice structured business problem solving'
  },

  // System Prompts - Role Setting
  {
    id: 'system-prompts-beginner-1',
    title: 'Friendly Teacher',
    prompt: 'Act as a patient and encouraging elementary school teacher. Explain why leaves change color in the fall, using simple language and examples that kids would understand.',
    level: 'beginner',
    concept: 'role-setting',
    description: 'Practice setting a clear persona and tone'
  },
  {
    id: 'system-prompts-intermediate-1',
    title: 'Technical Consultant',
    prompt: 'You are a cybersecurity consultant advising a small business owner. Explain the top 3 security risks they should be aware of and provide practical, budget-friendly solutions for each.',
    level: 'intermediate',
    concept: 'role-setting',
    description: 'Practice professional role with specific expertise'
  },
  {
    id: 'system-prompts-advanced-1',
    title: 'Creative Director',
    prompt: 'You are an experienced creative director at a top advertising agency. A client wants to launch a sustainable fashion brand targeting Gen Z. Develop a creative brief that includes brand positioning, key messages, and campaign concepts.',
    level: 'advanced',
    concept: 'role-setting',
    description: 'Practice complex professional scenarios'
  },

  // More Chain of Thought prompts
  {
    id: 'chain-of-thought-beginner-2',
    title: 'Shopping Decision',
    prompt: 'I need to buy a laptop for college. Walk me through the key factors I should consider step by step, and help me prioritize them based on a student budget.',
    level: 'beginner',
    concept: 'step-by-step-reasoning',
    description: 'Practice systematic decision-making'
  },
  {
    id: 'chain-of-thought-intermediate-2',
    title: 'Problem Diagnosis',
    prompt: 'My car won\'t start this morning. Help me troubleshoot this systematically by thinking through the most likely causes in order of probability and how to test each one.',
    level: 'intermediate',
    concept: 'step-by-step-reasoning',
    description: 'Practice diagnostic reasoning'
  },

  // More System Prompts
  {
    id: 'system-prompts-beginner-2',
    title: 'Fitness Coach',
    prompt: 'Act as a supportive fitness coach helping someone who\'s new to exercise. Create a simple 20-minute workout routine for someone with no equipment at home.',
    level: 'beginner',
    concept: 'role-setting',
    description: 'Practice supportive coaching persona'
  },
  {
    id: 'system-prompts-intermediate-2',
    title: 'Financial Advisor',
    prompt: 'You are a financial advisor helping a young professional create their first budget. They earn $50,000/year and want to start saving. Provide practical, actionable advice.',
    level: 'intermediate',
    concept: 'role-setting',
    description: 'Practice professional advisory role'
  },

  // More Fundamentals prompts
  {
    id: 'fundamentals-beginner-3',
    title: 'How-to Guide',
    prompt: 'Explain how to tie a tie in clear, step-by-step instructions for someone who has never done it before. Use simple language and mention common mistakes to avoid.',
    level: 'beginner',
    concept: 'clarity-and-specificity',
    description: 'Practice clear instructional writing'
  },
  {
    id: 'fundamentals-intermediate-3',
    title: 'Product Comparison',
    prompt: 'Compare electric cars vs. hybrid cars for a family of four living in a suburban area. Consider cost, environmental impact, convenience, and long-term value. Present the information in a clear, balanced way.',
    level: 'intermediate',
    concept: 'clarity-and-specificity',
    description: 'Practice structured comparison'
  },

  // General prompts for any concept
  {
    id: 'general-beginner-1',
    title: 'Story Writing',
    prompt: 'Write a short story about a robot who learns to paint. Make it exactly 100 words and include the words "canvas," "dream," and "color."',
    level: 'beginner',
    concept: 'general',
    description: 'Practice creative writing with constraints'
  },
  {
    id: 'general-beginner-2',
    title: 'Simple Explanation',
    prompt: 'Explain how WiFi works to someone who isn\'t tech-savvy. Use analogies and avoid technical jargon. Keep it under 200 words.',
    level: 'beginner',
    concept: 'general',
    description: 'Practice clear explanations'
  },
  {
    id: 'general-intermediate-1',
    title: 'Email Writing',
    prompt: 'Write a professional email to a client explaining a project delay. Keep it under 150 words, maintain a positive tone, and include a revised timeline. The delay is due to unexpected technical challenges.',
    level: 'intermediate',
    concept: 'general',
    description: 'Practice professional communication'
  },
  {
    id: 'general-intermediate-2',
    title: 'Event Planning',
    prompt: 'Plan a birthday party for a 8-year-old with 12 guests. Budget is $200. Include activities, food, decorations, and a timeline. Consider both indoor and outdoor options.',
    level: 'intermediate',
    concept: 'general',
    description: 'Practice comprehensive planning'
  },
  {
    id: 'general-advanced-1',
    title: 'Research Summary',
    prompt: 'Summarize the key findings from recent research on remote work productivity. Structure your response with: 1) Main trends, 2) Surprising insights, 3) Implications for managers. Cite specific studies where possible.',
    level: 'advanced',
    concept: 'general',
    description: 'Practice research synthesis and structured reporting'
  },
  {
    id: 'general-advanced-2',
    title: 'Strategic Analysis',
    prompt: 'Analyze the potential impact of artificial intelligence on the healthcare industry over the next 10 years. Consider benefits, challenges, ethical concerns, and regulatory implications. Structure your analysis with clear sections.',
    level: 'advanced',
    concept: 'general',
    description: 'Practice complex strategic thinking'
  }
];

/**
 * Get starter prompts for a specific concept and level
 */
export function getStarterPrompts(concept?: string, level?: 'beginner' | 'intermediate' | 'advanced'): StarterPrompt[] {
  let filtered = STARTER_PROMPTS;
  
  if (concept && concept !== 'general') {
    filtered = filtered.filter(p => p.concept === concept || p.concept === 'general');
  }
  
  if (level) {
    filtered = filtered.filter(p => p.level === level);
  }
  
  return filtered;
}

/**
 * Get a random starter prompt for a concept
 */
export function getRandomStarterPrompt(concept?: string, level?: 'beginner' | 'intermediate' | 'advanced'): StarterPrompt | null {
  const prompts = getStarterPrompts(concept, level);
  if (prompts.length === 0) return null;
  
  return prompts[Math.floor(Math.random() * prompts.length)];
}

/**
 * Get starter prompt by ID
 */
export function getStarterPromptById(id: string): StarterPrompt | null {
  return STARTER_PROMPTS.find(p => p.id === id) || null;
}

/**
 * Get all available concepts
 */
export function getAvailableConcepts(): string[] {
  return Array.from(new Set(STARTER_PROMPTS.map(p => p.concept)));
}

/**
 * Get concept display name
 */
export function getConceptDisplayName(concept: string): string {
  const displayNames: Record<string, string> = {
    'clarity-and-specificity': 'Clarity & Specificity',
    'step-by-step-reasoning': 'Step-by-Step Reasoning',
    'multi-step-prompts': 'Multi-Step Prompts',
    'role-setting': 'Role Setting',
    'security-awareness': 'Security Awareness',
    'general': 'General Practice'
  };
  
  return displayNames[concept] || concept;
}