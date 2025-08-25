/**
 * Onboarding utilities for first-time learner experience
 * 
 * Manages onboarding state, user preferences, and guided walkthrough functionality.
 * Uses localStorage to persist user preferences and onboarding completion status.
 */

export interface OnboardingState {
  hasCompletedOnboarding: boolean;
  hasSeenTooltips: boolean;
  preferredStartGuide: string;
  dismissedFeatures: string[];
  lastVisit: string;
}

export interface TooltipStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  order: number;
  optional?: boolean;
}

const ONBOARDING_STORAGE_KEY = 'prompt-practice-onboarding';
const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  hasCompletedOnboarding: false,
  hasSeenTooltips: false,
  preferredStartGuide: 'fundamentals',
  dismissedFeatures: [],
  lastVisit: new Date().toISOString(),
};

/**
 * Onboarding manager class for handling user onboarding state
 */
export class OnboardingManager {
  private state: OnboardingState;

  constructor() {
    this.state = this.loadState();
  }

  /**
   * Load onboarding state from localStorage
   */
  private loadState(): OnboardingState {
    if (typeof window === 'undefined') {
      return DEFAULT_ONBOARDING_STATE;
    }

    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_ONBOARDING_STATE, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load onboarding state:', error);
    }

    return DEFAULT_ONBOARDING_STATE;
  }

  /**
   * Save onboarding state to localStorage
   */
  private saveState(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save onboarding state:', error);
    }
  }

  /**
   * Check if user is a first-time visitor
   */
  isFirstTimeUser(): boolean {
    return !this.state.hasCompletedOnboarding;
  }

  /**
   * Check if user has seen tooltips
   */
  hasSeenTooltips(): boolean {
    return this.state.hasSeenTooltips;
  }

  /**
   * Mark onboarding as completed
   */
  completeOnboarding(): void {
    this.state.hasCompletedOnboarding = true;
    this.state.lastVisit = new Date().toISOString();
    this.saveState();
  }

  /**
   * Mark tooltips as seen
   */
  markTooltipsSeen(): void {
    this.state.hasSeenTooltips = true;
    this.saveState();
  }

  /**
   * Dismiss a specific feature (like streaks, badges, etc.)
   */
  dismissFeature(featureId: string): void {
    if (!this.state.dismissedFeatures.includes(featureId)) {
      this.state.dismissedFeatures.push(featureId);
      this.saveState();
    }
  }

  /**
   * Check if a feature has been dismissed
   */
  isFeatureDismissed(featureId: string): boolean {
    return this.state.dismissedFeatures.includes(featureId);
  }

  /**
   * Set preferred starting guide
   */
  setPreferredStartGuide(guideSlug: string): void {
    this.state.preferredStartGuide = guideSlug;
    this.saveState();
  }

  /**
   * Get preferred starting guide
   */
  getPreferredStartGuide(): string {
    return this.state.preferredStartGuide;
  }

  /**
   * Update last visit timestamp
   */
  updateLastVisit(): void {
    this.state.lastVisit = new Date().toISOString();
    this.saveState();
  }

  /**
   * Get current onboarding state
   */
  getState(): OnboardingState {
    return { ...this.state };
  }

  /**
   * Reset onboarding state (for testing or user preference)
   */
  reset(): void {
    this.state = { ...DEFAULT_ONBOARDING_STATE };
    this.saveState();
  }
}

/**
 * Default tooltip steps for guided walkthrough
 */
export const DEFAULT_TOOLTIP_STEPS: TooltipStep[] = [
  {
    id: 'welcome',
    target: '.home-header',
    title: 'Welcome to Prompt Practice!',
    content: 'This platform helps you learn prompt engineering through interactive guides and hands-on practice.',
    position: 'bottom',
    order: 1,
  },
  {
    id: 'learn-section',
    target: '.guides-section',
    title: 'Learn the Fundamentals',
    content: 'Start here with our educational guides. Each guide covers key prompt engineering concepts with practical examples.',
    position: 'top',
    order: 2,
  },
  {
    id: 'practice-section',
    target: '.labs-section',
    title: 'Practice Your Skills',
    content: 'Apply what you\'ve learned in our interactive labs. Get instant feedback on your prompts.',
    position: 'top',
    order: 3,
  },
  {
    id: 'navigation',
    target: '.global-nav',
    title: 'Navigate Your Learning',
    content: 'Use the navigation to move between Learn, Practice, and Progress sections.',
    position: 'bottom',
    order: 4,
    optional: true,
  },
];

/**
 * Utility functions for onboarding
 */
export const onboardingUtils = {
  /**
   * Check if user should see onboarding
   */
  shouldShowOnboarding(): boolean {
    const manager = new OnboardingManager();
    return manager.isFirstTimeUser();
  },

  /**
   * Check if user should see tooltips
   */
  shouldShowTooltips(): boolean {
    const manager = new OnboardingManager();
    return manager.isFirstTimeUser() && !manager.hasSeenTooltips();
  },

  /**
   * Get the recommended first guide for new users
   */
  getRecommendedFirstGuide(): string {
    const manager = new OnboardingManager();
    return manager.getPreferredStartGuide();
  },

  /**
   * Mark user as having completed initial onboarding
   */
  completeInitialOnboarding(): void {
    const manager = new OnboardingManager();
    manager.completeOnboarding();
  },

  /**
   * Mark tooltips as seen
   */
  markTooltipsSeen(): void {
    const manager = new OnboardingManager();
    manager.markTooltipsSeen();
  },

  /**
   * Check if a specific feature should be shown
   */
  shouldShowFeature(featureId: string): boolean {
    const manager = new OnboardingManager();
    return !manager.isFeatureDismissed(featureId);
  },

  /**
   * Dismiss a feature
   */
  dismissFeature(featureId: string): void {
    const manager = new OnboardingManager();
    manager.dismissFeature(featureId);
  },
};

/**
 * Hook for React components to use onboarding state
 */
export const useOnboarding = () => {
  const manager = new OnboardingManager();
  
  return {
    isFirstTimeUser: manager.isFirstTimeUser(),
    hasSeenTooltips: manager.hasSeenTooltips(),
    preferredStartGuide: manager.getPreferredStartGuide(),
    shouldShowOnboarding: onboardingUtils.shouldShowOnboarding(),
    shouldShowTooltips: onboardingUtils.shouldShowTooltips(),
    completeOnboarding: () => manager.completeOnboarding(),
    markTooltipsSeen: () => manager.markTooltipsSeen(),
    dismissFeature: (featureId: string) => manager.dismissFeature(featureId),
    isFeatureDismissed: (featureId: string) => manager.isFeatureDismissed(featureId),
  };
};