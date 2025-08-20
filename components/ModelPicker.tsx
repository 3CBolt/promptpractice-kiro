'use client';

// Model selection component with source badges
import React, { useState, useEffect } from 'react';
import { ModelProvider } from '@/types';
import { MODEL_REGISTRY, getSourceBadge, areHostedModelsAvailable } from '@/lib/models/providers';

interface ModelPickerProps {
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
  maxSelection?: number;
  availableModels?: ModelProvider[];
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export default function ModelPicker({
  selectedModels,
  onSelectionChange,
  maxSelection = 3,
  availableModels = MODEL_REGISTRY,
  disabled = false,
  'aria-label': ariaLabel = 'Select models for comparison',
  'aria-describedby': ariaDescribedBy
}: ModelPickerProps) {
  const hostedAvailable = areHostedModelsAvailable();
  const [focusedModel, setFocusedModel] = useState<string | null>(null);
  
  const handleModelToggle = (modelId: string) => {
    if (disabled) return;
    
    if (selectedModels.includes(modelId)) {
      // Remove model
      onSelectionChange(selectedModels.filter(id => id !== modelId));
      // Announce change to screen readers
      announceToScreenReader(`${modelId} deselected`);
    } else {
      // Add model if under limit
      if (selectedModels.length < maxSelection) {
        onSelectionChange([...selectedModels, modelId]);
        announceToScreenReader(`${modelId} selected`);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, modelId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleModelToggle(modelId);
    }
  };

  const announceToScreenReader = (message: string) => {
    const announcements = document.getElementById('announcements');
    if (announcements) {
      announcements.textContent = message;
    }
  };

  const getModelSourceBadge = (model: ModelProvider) => {
    switch (model.source) {
      case 'hosted':
        return hostedAvailable ? '✨ Hosted' : '📦 Sample';
      case 'sample':
        return '📦 Sample';
      case 'local':
        return '💻 Local';
      default:
        return '❓ Unknown';
    }
  };

  const isModelAvailable = (model: ModelProvider) => {
    if (model.source === 'hosted' && !hostedAvailable) {
      return false;
    }
    return true;
  };

  return (
    <div 
      className="model-picker"
      role="group"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <div className="model-picker-header">
        <h3 className="model-picker-title" id="model-picker-title">Select Models</h3>
        <span 
          className="model-picker-count"
          aria-live="polite"
          aria-atomic="true"
        >
          {selectedModels.length}/{maxSelection} selected
        </span>
      </div>
      
      <div className="model-grid">
        {availableModels.map((model) => {
          const isSelected = selectedModels.includes(model.id);
          const isAvailable = isModelAvailable(model);
          const canSelect = !disabled && (isSelected || selectedModels.length < maxSelection);
          
          return (
            <button
              key={model.id}
              type="button"
              className={`model-card fade-in ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''} ${!isAvailable ? 'unavailable' : ''} ${focusedModel === model.id ? 'focused' : ''}`}
              onClick={() => handleModelToggle(model.id)}
              onKeyDown={(e) => handleKeyDown(e, model.id)}
              onFocus={() => setFocusedModel(model.id)}
              onBlur={() => setFocusedModel(null)}
              disabled={!canSelect || !isAvailable}
              aria-pressed={isSelected}
              aria-describedby={`${model.id}-description`}
              aria-labelledby={`${model.id}-name`}
            >
              <div className="model-card-header">
                <span className="model-name" id={`${model.id}-name`}>{model.name}</span>
                <span className={`source-badge ${model.source}`} aria-label={`Source: ${getModelSourceBadge(model)}`}>
                  {getModelSourceBadge(model)}
                </span>
              </div>
              
              <div className="model-card-details" id={`${model.id}-description`}>
                <span className="model-tokens">Max: {model.maxTokens} tokens</span>
                {!isAvailable && (
                  <span className="unavailable-notice" role="alert">API unavailable</span>
                )}
              </div>
              
              {isSelected && (
                <div className="selected-indicator" aria-hidden="true">✓</div>
              )}
            </button>
          );
        })}
      </div>
      
      {selectedModels.length >= maxSelection && (
        <div className="selection-limit-notice alert alert-warning" role="alert">
          Maximum {maxSelection} models selected. Deselect a model to choose another.
        </div>
      )}
      
      {!hostedAvailable && (
        <div className="fallback-notice alert alert-info" role="status">
          <span className="notice-icon" aria-hidden="true">ℹ️</span>
          Hosted models unavailable. Using sample responses for demonstration.
        </div>
      )}
    </div>
  );
}