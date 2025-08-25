/**
 * Accessibility Utilities
 * 
 * Helper functions for managing focus, announcements, and other
 * accessibility features throughout the application.
 */

/**
 * Announce a message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcements = document.getElementById('announcements');
  const status = document.getElementById('status');
  
  if (priority === 'assertive' && status) {
    status.textContent = message;
    // Clear after announcement
    setTimeout(() => {
      status.textContent = '';
    }, 1000);
  } else if (announcements) {
    announcements.textContent = message;
    // Clear after announcement
    setTimeout(() => {
      announcements.textContent = '';
    }, 1000);
  }
}

/**
 * Focus the main content area (useful after navigation)
 */
export function focusMainContent() {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.focus();
  }
}

/**
 * Get the first focusable element within a container
 */
export function getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="menuitem"]:not([disabled])',
    '[role="tab"]:not([disabled])',
  ].join(', ');
  
  return container.querySelector(focusableSelectors);
}

/**
 * Get the last focusable element within a container
 */
export function getLastFocusableElement(container: HTMLElement): HTMLElement | null {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="menuitem"]:not([disabled])',
    '[role="tab"]:not([disabled])',
  ].join(', ');
  
  const focusableElements = container.querySelectorAll(focusableSelectors);
  return focusableElements[focusableElements.length - 1] as HTMLElement || null;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="menuitem"]:not([disabled])',
    '[role="tab"]:not([disabled])',
  ].join(', ');
  
  return Array.from(container.querySelectorAll(focusableSelectors));
}

/**
 * Trap focus within a container (useful for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  
  // Focus the first element
  firstElement?.focus();
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Get the appropriate animation duration based on user preferences
 */
export function getAnimationDuration(defaultDuration: number): number {
  return prefersReducedMotion() ? 0 : defaultDuration;
}

/**
 * Create a unique ID for accessibility attributes
 */
export function createAccessibilityId(prefix: string = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  
  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    element.hasAttribute('aria-hidden') ||
    element.hidden
  );
}

/**
 * Set up keyboard navigation for a group of elements
 */
export function setupKeyboardNavigation(
  container: HTMLElement,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
    activateOnFocus?: boolean;
  } = {}
): () => void {
  const { orientation = 'both', wrap = true, activateOnFocus = false } = options;
  
  const handleKeyDown = (event: KeyboardEvent) => {
    const focusableElements = getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          nextIndex = currentIndex + 1;
          if (nextIndex >= focusableElements.length) {
            nextIndex = wrap ? 0 : focusableElements.length - 1;
          }
        }
        break;
        
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) {
            nextIndex = wrap ? focusableElements.length - 1 : 0;
          }
        }
        break;
        
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          nextIndex = currentIndex + 1;
          if (nextIndex >= focusableElements.length) {
            nextIndex = wrap ? 0 : focusableElements.length - 1;
          }
        }
        break;
        
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) {
            nextIndex = wrap ? focusableElements.length - 1 : 0;
          }
        }
        break;
        
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
        
      case 'End':
        event.preventDefault();
        nextIndex = focusableElements.length - 1;
        break;
        
      default:
        return;
    }
    
    const nextElement = focusableElements[nextIndex];
    if (nextElement) {
      nextElement.focus();
      
      if (activateOnFocus && nextElement.click) {
        nextElement.click();
      }
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Manage focus restoration after modal/dialog closes
 */
export class FocusManager {
  private previouslyFocusedElement: HTMLElement | null = null;
  
  /**
   * Save the currently focused element
   */
  saveFocus(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
  }
  
  /**
   * Restore focus to the previously focused element
   */
  restoreFocus(): void {
    if (this.previouslyFocusedElement && this.previouslyFocusedElement.focus) {
      this.previouslyFocusedElement.focus();
    }
    this.previouslyFocusedElement = null;
  }
  
  /**
   * Focus a specific element and save the previous focus
   */
  focusElement(element: HTMLElement): void {
    this.saveFocus();
    element.focus();
  }
}

/**
 * Create a global focus manager instance
 */
export const globalFocusManager = new FocusManager();

/**
 * Debounce function for accessibility announcements
 */
export function debounceAnnouncement(
  message: string,
  delay: number = 500,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Clear any existing timeout
  if ((window as any).announcementTimeout) {
    clearTimeout((window as any).announcementTimeout);
  }
  
  // Set new timeout
  (window as any).announcementTimeout = setTimeout(() => {
    announceToScreenReader(message, priority);
  }, delay);
}

/**
 * Check if the current device is likely using touch input
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get appropriate touch target size based on device
 */
export function getTouchTargetSize(): number {
  return isTouchDevice() ? 44 : 32; // 44px for touch, 32px for mouse
}

/**
 * Validate color contrast ratio
 */
export function validateColorContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const threshold = level === 'AAA' ? 7 : 4.5;
  return ratio >= threshold;
}

/**
 * Calculate contrast ratio between two colors
 */
function calculateContrastRatio(color1: string, color2: string): number {
  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(color: string): number {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}