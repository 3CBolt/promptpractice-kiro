import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModelPicker from '@/components/ModelPicker';
import { ModelProvider } from '@/types';

// Mock the providers module
vi.mock('@/lib/models/providers', () => ({
  MODEL_REGISTRY: [
    { id: 'llama3.1-8b', name: 'Llama 3.1 8B', source: 'hosted', maxTokens: 512 },
    { id: 'mistral-7b', name: 'Mistral 7B', source: 'hosted', maxTokens: 512 },
    { id: 'local-stub', name: 'Local Stub', source: 'sample', maxTokens: 512 },
    { id: 'local-creative', name: 'Local Creative', source: 'sample', maxTokens: 512 }
  ],
  getSourceBadge: vi.fn((result) => {
    switch (result.source) {
      case 'hosted': return '✨ Hosted';
      case 'sample': return '📦 Sample';
      case 'local': return '💻 Local';
      default: return '❓ Unknown';
    }
  }),
  areHostedModelsAvailable: vi.fn(() => true)
}));

const mockModels: ModelProvider[] = [
  { id: 'llama3.1-8b', name: 'Llama 3.1 8B', source: 'hosted', maxTokens: 512 },
  { id: 'mistral-7b', name: 'Mistral 7B', source: 'hosted', maxTokens: 512 },
  { id: 'local-stub', name: 'Local Stub', source: 'sample', maxTokens: 512 },
  { id: 'local-creative', name: 'Local Creative', source: 'sample', maxTokens: 512 }
];

describe('ModelPicker Component', () => {
  const mockOnSelectionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all available models', () => {
      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
        />
      );

      expect(screen.getByText('Llama 3.1 8B')).toBeInTheDocument();
      expect(screen.getByText('Mistral 7B')).toBeInTheDocument();
      expect(screen.getByText('Local Stub')).toBeInTheDocument();
      expect(screen.getByText('Local Creative')).toBeInTheDocument();
    });

    it('should display selection count correctly', () => {
      render(
        <ModelPicker
          selectedModels={['llama3.1-8b']}
          onSelectionChange={mockOnSelectionChange}
          maxSelection={3}
          availableModels={mockModels}
        />
      );

      expect(screen.getByText('1/3 selected')).toBeInTheDocument();
    });

    it('should show max tokens for each model', () => {
      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
        />
      );

      const tokenLabels = screen.getAllByText(/Max: \d+ tokens/);
      expect(tokenLabels).toHaveLength(4);
      expect(screen.getByText('Max: 512 tokens')).toBeInTheDocument();
    });
  });

  describe('Source Badge Rendering', () => {
    it('should display correct source badges when hosted models are available', () => {
      const { areHostedModelsAvailable } = require('@/lib/models/providers');
      vi.mocked(areHostedModelsAvailable).mockReturnValue(true);

      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
        />
      );

      expect(screen.getAllByText('✨ Hosted')).toHaveLength(2);
      expect(screen.getAllByText('📦 Sample')).toHaveLength(2);
    });

    it('should show sample badges for hosted models when API unavailable', () => {
      const { areHostedModelsAvailable } = require('@/lib/models/providers');
      vi.mocked(areHostedModelsAvailable).mockReturnValue(false);

      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
        />
      );

      // All hosted models should show as sample when API unavailable
      expect(screen.getAllByText('📦 Sample')).toHaveLength(4);
      expect(screen.queryByText('✨ Hosted')).not.toBeInTheDocument();
    });

    it('should display local badge for local models', () => {
      const localModel: ModelProvider = {
        id: 'local-model',
        name: 'Local Model',
        source: 'local',
        maxTokens: 512
      };

      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={[localModel]}
        />
      );

      expect(screen.getByText('💻 Local')).toBeInTheDocument();
    });

    it('should display unknown badge for unknown source', () => {
      const unknownModel: ModelProvider = {
        id: 'unknown-model',
        name: 'Unknown Model',
        source: 'unknown' as any,
        maxTokens: 512
      };

      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={[unknownModel]}
        />
      );

      expect(screen.getByText('❓ Unknown')).toBeInTheDocument();
    });
  });

  describe('Model Selection', () => {
    it('should call onSelectionChange when model is selected', () => {
      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
        />
      );

      fireEvent.click(screen.getByText('Llama 3.1 8B'));

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['llama3.1-8b']);
    });

    it('should call onSelectionChange when model is deselected', () => {
      render(
        <ModelPicker
          selectedModels={['llama3.1-8b', 'mistral-7b']}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
        />
      );

      fireEvent.click(screen.getByText('Llama 3.1 8B'));

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['mistral-7b']);
    });

    it('should respect max selection limit', () => {
      render(
        <ModelPicker
          selectedModels={['llama3.1-8b', 'mistral-7b']}
          onSelectionChange={mockOnSelectionChange}
          maxSelection={2}
          availableModels={mockModels}
        />
      );

      // Try to select a third model
      fireEvent.click(screen.getByText('Local Stub'));

      // Should not call onSelectionChange since limit is reached
      expect(mockOnSelectionChange).not.toHaveBeenCalled();
    });

    it('should show selection limit notice when max reached', () => {
      render(
        <ModelPicker
          selectedModels={['llama3.1-8b', 'mistral-7b']}
          onSelectionChange={mockOnSelectionChange}
          maxSelection={2}
          availableModels={mockModels}
        />
      );

      expect(screen.getByText(/Maximum 2 models selected/)).toBeInTheDocument();
    });

    it('should show selected indicator for selected models', () => {
      render(
        <ModelPicker
          selectedModels={['llama3.1-8b']}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
        />
      );

      const selectedCards = screen.getAllByText('✓');
      expect(selectedCards).toHaveLength(1);
    });
  });

  describe('Disabled State', () => {
    it('should not allow selection when disabled', () => {
      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
          disabled={true}
        />
      );

      fireEvent.click(screen.getByText('Llama 3.1 8B'));

      expect(mockOnSelectionChange).not.toHaveBeenCalled();
    });

    it('should apply disabled styling to all models when disabled', () => {
      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
          disabled={true}
        />
      );

      const modelCards = screen.getAllByRole('button');
      modelCards.forEach(card => {
        expect(card).toBeDisabled();
      });
    });
  });

  describe('API Availability', () => {
    it('should show fallback notice when hosted models unavailable', () => {
      const { areHostedModelsAvailable } = require('@/lib/models/providers');
      vi.mocked(areHostedModelsAvailable).mockReturnValue(false);

      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
        />
      );

      expect(screen.getByText(/Hosted models unavailable/)).toBeInTheDocument();
      expect(screen.getByText(/Using sample responses/)).toBeInTheDocument();
    });

    it('should not show fallback notice when hosted models available', () => {
      const { areHostedModelsAvailable } = require('@/lib/models/providers');
      vi.mocked(areHostedModelsAvailable).mockReturnValue(true);

      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
        />
      );

      expect(screen.queryByText(/Hosted models unavailable/)).not.toBeInTheDocument();
    });

    it('should disable hosted models when API unavailable', () => {
      const { areHostedModelsAvailable } = require('@/lib/models/providers');
      vi.mocked(areHostedModelsAvailable).mockReturnValue(false);

      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
        />
      );

      // Hosted models should show unavailable notice
      expect(screen.getAllByText('API unavailable')).toHaveLength(2);
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct CSS classes for selected models', () => {
      render(
        <ModelPicker
          selectedModels={['llama3.1-8b']}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
        />
      );

      const selectedCard = screen.getByText('Llama 3.1 8B').closest('button');
      expect(selectedCard).toHaveClass('selected');
    });

    it('should apply source-specific CSS classes', () => {
      render(
        <ModelPicker
          selectedModels={[]}
          onSelectionChange={mockOnSelectionChange}
          availableModels={mockModels}
        />
      );

      const hostedBadges = screen.getAllByText('✨ Hosted');
      hostedBadges.forEach(badge => {
        expect(badge).toHaveClass('hosted');
      });

      const sampleBadges = screen.getAllByText('📦 Sample');
      sampleBadges.forEach(badge => {
        expect(badge).toHaveClass('sample');
      });
    });
  });
});