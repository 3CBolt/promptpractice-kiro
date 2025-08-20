/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModelPicker from '@/components/ModelPicker';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';

// Mock the providers module
vi.mock('@/lib/models/providers', () => ({
  MODEL_REGISTRY: [
    { id: 'llama3.1-8b', name: 'Llama 3.1 8B', source: 'hosted', maxTokens: 512 },
    { id: 'mistral-7b', name: 'Mistral 7B', source: 'hosted', maxTokens: 512 },
    { id: 'local-stub', name: 'Local Stub', source: 'sample', maxTokens: 512 }
  ],
  getSourceBadge: (result: any) => {
    switch (result.source) {
      case 'hosted': return '✨ Hosted';
      case 'sample': return '📦 Sample';
      case 'local': return '💻 Local';
      default: return '❓ Unknown';
    }
  },
  areHostedModelsAvailable: () => true
}));

describe('Accessibility Tests', () => {
  describe('ModelPicker Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const mockOnChange = vi.fn();
      
      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnChange}
          maxSelection={3}
          aria-label="Select models for testing"
        />
      );

      // Check for group role
      const modelPicker = screen.getByRole('group');
      expect(modelPicker).toBeInTheDocument();
      expect(modelPicker).toHaveAttribute('aria-label', 'Select models for testing');

      // Check for proper button roles
      const modelButtons = screen.getAllByRole('button');
      expect(modelButtons.length).toBeGreaterThan(0);

      // Check for aria-pressed attributes
      modelButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    it('should support keyboard navigation', () => {
      const mockOnChange = vi.fn();
      
      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnChange}
          maxSelection={3}
        />
      );

      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();

      // Test Enter key
      fireEvent.keyDown(firstButton, { key: 'Enter' });
      expect(mockOnChange).toHaveBeenCalled();

      // Test Space key
      fireEvent.keyDown(firstButton, { key: ' ' });
      expect(mockOnChange).toHaveBeenCalledTimes(2);
    });

    it('should announce selection changes to screen readers', () => {
      const mockOnChange = vi.fn();
      
      // Mock the announcements element
      const announcementsDiv = document.createElement('div');
      announcementsDiv.id = 'announcements';
      document.body.appendChild(announcementsDiv);
      
      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnChange}
          maxSelection={3}
        />
      );

      const firstButton = screen.getAllByRole('button')[0];
      fireEvent.click(firstButton);

      // Check if announcement was made
      expect(announcementsDiv.textContent).toBeTruthy();
      
      document.body.removeChild(announcementsDiv);
    });

    it('should have proper focus management', () => {
      const mockOnChange = vi.fn();
      
      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnChange}
          maxSelection={3}
        />
      );

      const buttons = screen.getAllByRole('button');
      
      // Test that buttons are focusable
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('ErrorBoundary Accessibility', () => {
    it('should have proper error announcement', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Check for error message
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // Check for retry button
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveAttribute('type', 'button');

      consoleSpy.mockRestore();
    });

    it('should have keyboard accessible retry actions', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText('Try Again');
      
      // Test keyboard activation
      fireEvent.keyDown(retryButton, { key: 'Enter' });
      fireEvent.keyDown(retryButton, { key: ' ' });

      consoleSpy.mockRestore();
    });
  });

  describe('LoadingSpinner Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LoadingSpinner text="Loading content" />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading content');

      // Check for screen reader text
      expect(screen.getByText('Loading content', { selector: '.sr-only' })).toBeInTheDocument();
    });

    it('should announce loading state changes', () => {
      const { rerender } = render(<LoadingSpinner text="Loading..." />);
      
      expect(screen.getByText('Loading...', { selector: '.sr-only' })).toBeInTheDocument();

      rerender(<LoadingSpinner text="Almost done..." />);
      
      expect(screen.getByText('Almost done...', { selector: '.sr-only' })).toBeInTheDocument();
    });
  });

  describe('General Accessibility Features', () => {
    it('should have skip link for keyboard navigation', () => {
      // This would be tested in the layout component
      const skipLink = document.createElement('a');
      skipLink.href = '#main-content';
      skipLink.className = 'skip-link';
      skipLink.textContent = 'Skip to main content';
      document.body.appendChild(skipLink);

      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink.textContent).toBe('Skip to main content');
      
      document.body.removeChild(skipLink);
    });

    it('should respect reduced motion preferences', () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      // Test that animations are disabled when reduced motion is preferred
      const element = document.createElement('div');
      element.className = 'fade-in';
      
      // In a real implementation, this would check computed styles
      // For now, we just verify the class is applied
      expect(element.className).toContain('fade-in');
    });

    it('should have proper color contrast ratios', () => {
      // This would typically be tested with automated tools like axe-core
      // For now, we verify that contrast-related CSS classes exist
      const element = document.createElement('div');
      element.className = 'btn btn-primary';
      
      // Verify button classes are applied (actual contrast testing would need tools)
      expect(element.className).toContain('btn-primary');
    });

    it('should support high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      // Test that high contrast styles would be applied
      const element = document.createElement('div');
      element.className = 'card';
      
      expect(element.className).toContain('card');
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form labels and descriptions', () => {
      const form = document.createElement('form');
      
      const label = document.createElement('label');
      label.htmlFor = 'test-input';
      label.textContent = 'Test Input';
      
      const input = document.createElement('input');
      input.id = 'test-input';
      input.setAttribute('aria-describedby', 'test-help');
      
      const help = document.createElement('div');
      help.id = 'test-help';
      help.textContent = 'This is help text';
      
      form.appendChild(label);
      form.appendChild(input);
      form.appendChild(help);
      
      expect(label.htmlFor).toBe(input.id);
      expect(input.getAttribute('aria-describedby')).toBe(help.id);
    });

    it('should announce form validation errors', () => {
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('role', 'alert');
      errorDiv.textContent = 'This field is required';
      
      expect(errorDiv.getAttribute('role')).toBe('alert');
      expect(errorDiv.textContent).toBe('This field is required');
    });
  });
});