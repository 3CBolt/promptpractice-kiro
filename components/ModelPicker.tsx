'use client';

// Model selection component with source badges and WebGPU support
import React, { useState, useEffect } from 'react';
import { ModelProvider } from '@/types';
import { MODEL_REGISTRY, getSourceBadge, areHostedModelsAvailable } from '@/lib/models/providers';
import { WEBGPU_MODELS, WebGPUModelConfig, getWebGPUManager, detectWebGPUSupport } from '@/lib/models/webgpuModel';
import { tokens, getFocusRing, getFocusBoxShadow } from '@/styles/tokens';

interface ModelPickerProps {
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
  maxSelection?: number;
  availableModels?: ModelProvider[];
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  showWebGPUModels?: boolean;
  onWebGPUModelSelect?: (modelId: string) => void;
  webgpuSupported?: boolean;
  webgpuError?: string;
  onRetryWebGPU?: () => void;
  onEnterDemoMode?: () => void;
}

export default function ModelPicker({
  selectedModels,
  onSelectionChange,
  maxSelection = 3,
  availableModels = MODEL_REGISTRY,
  disabled = false,
  'aria-label': ariaLabel = 'Select models for comparison',
  'aria-describedby': ariaDescribedBy,
  showWebGPUModels = false,
  onWebGPUModelSelect,
  webgpuSupported = false,
  webgpuError,
  onRetryWebGPU,
  onEnterDemoMode
}: ModelPickerProps) {
  const hostedAvailable = areHostedModelsAvailable();
  const [focusedModel, setFocusedModel] = useState<string | null>(null);
  const [selectedWebGPUModel, setSelectedWebGPUModel] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  
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

  const handleWebGPUModelSelect = (modelId: string) => {
    if (disabled) return;
    
    setSelectedWebGPUModel(modelId);
    if (onWebGPUModelSelect) {
      onWebGPUModelSelect(modelId);
    }
    
    // Remember user's choice
    localStorage.setItem('webgpu_last_model', modelId);
    announceToScreenReader(`WebGPU model ${modelId} selected`);
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
      // Clear after announcement
      setTimeout(() => {
        announcements.textContent = '';
      }, 1000);
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

  const getWebGPUModelTooltip = (model: WebGPUModelConfig) => {
    return {
      speed: model.speed === 'fast' ? 'Very fast responses' : 
             model.speed === 'medium' ? 'Balanced speed' : 'Slower but thorough',
      quality: model.quality === 'basic' ? 'Good for simple tasks' :
               model.quality === 'good' ? 'Better reasoning and context' : 'Excellent quality',
      size: `Download size: ${model.estimatedSize}`,
      description: model.description
    };
  };

  // Load last selected WebGPU model on mount
  useEffect(() => {
    if (showWebGPUModels) {
      const lastModel = localStorage.getItem('webgpu_last_model');
      if (lastModel && WEBGPU_MODELS.find(m => m.id === lastModel)) {
        setSelectedWebGPUModel(lastModel);
      } else {
        // Default to first model
        setSelectedWebGPUModel(WEBGPU_MODELS[0]?.id || null);
      }
    }
  }, [showWebGPUModels]);

  return (
    <div 
      className="model-picker"
      role="group"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      style={{
        background: tokens.colors.background.primary,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.mobile.padding.md,
        border: `1px solid ${tokens.colors.border.light}`,
        boxShadow: tokens.boxShadow.sm,
        width: '100%',
        maxWidth: '100%',
      }}
    >
      <div className="model-picker-header">
        <h3 
          className="model-picker-title" 
          id="model-picker-title"
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.text.primary,
            margin: 0,
          }}
        >
          {showWebGPUModels ? 'Choose Browser Model' : 'Select Models'}
        </h3>
        {!showWebGPUModels && (
          <span 
            className="model-picker-count"
            aria-live="polite"
            aria-atomic="true"
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.text.tertiary,
              background: tokens.colors.background.secondary,
              padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
              borderRadius: tokens.borderRadius.base,
            }}
          >
            {selectedModels.length}/{maxSelection} selected
          </span>
        )}
      </div>

      {showWebGPUModels && (
        <div className="webgpu-info">
          <p className="webgpu-description">
            This Lab runs a small open model in your browser. <strong>No setup needed.</strong>
          </p>
          {webgpuError && (
            <div className="webgpu-error-notice" role="alert" style={{
              padding: tokens.spacing[3],
              backgroundColor: tokens.colors.error[50],
              border: `1px solid ${tokens.colors.error[600]}`,
              borderRadius: tokens.borderRadius.base,
              marginBottom: tokens.spacing[4]
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
                <span className="notice-icon">⚠️</span>
                <span style={{ color: tokens.colors.error[600], fontWeight: '500' }}>
                  {webgpuError}
                </span>
              </div>
              <div style={{ 
                marginTop: tokens.spacing[2], 
                display: 'flex', 
                gap: tokens.spacing[2] 
              }}>
                {onRetryWebGPU && (
                  <button
                    onClick={onRetryWebGPU}
                    style={{
                      padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                      backgroundColor: tokens.colors.primary[600],
                      color: 'white',
                      border: 'none',
                      borderRadius: tokens.borderRadius.base,
                      fontSize: tokens.typography.fontSize.sm,
                      cursor: 'pointer',
                      minHeight: tokens.touchTarget.minimum,
                      touchAction: 'manipulation'
                    }}
                  >
                    🔄 Retry
                  </button>
                )}
                {onEnterDemoMode && (
                  <button
                    onClick={onEnterDemoMode}
                    style={{
                      padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                      backgroundColor: tokens.colors.success[600],
                      color: 'white',
                      border: 'none',
                      borderRadius: tokens.borderRadius.base,
                      fontSize: tokens.typography.fontSize.sm,
                      cursor: 'pointer',
                      minHeight: tokens.touchTarget.minimum,
                      touchAction: 'manipulation'
                    }}
                  >
                    📖 Demo Mode
                  </button>
                )}
              </div>
            </div>
          )}
          {!webgpuSupported && !webgpuError && (
            <div className="webgpu-fallback-notice" role="alert">
              <span className="notice-icon">ℹ️</span>
              WebGPU not supported. You'll see demo responses instead.
            </div>
          )}
        </div>
      )}
      
      <div 
        className="model-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: tokens.mobile.grid.gap.md,
        }}
      >
        {showWebGPUModels ? (
          // WebGPU Models
          WEBGPU_MODELS.map((model) => {
            const isSelected = selectedWebGPUModel === model.id;
            const tooltip = getWebGPUModelTooltip(model);
            
            return (
              <div
                key={model.id}
                className={`webgpu-model-card ${isSelected ? 'selected' : ''} ${!webgpuSupported ? 'demo-mode' : ''}`}
                onClick={() => handleWebGPUModelSelect(model.id)}
                onMouseEnter={() => setShowTooltip(model.id)}
                onMouseLeave={() => setShowTooltip(null)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleWebGPUModelSelect(model.id);
                  }
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: tokens.spacing[4],
                  border: `2px solid ${isSelected ? tokens.colors.success[600] : tokens.colors.border.light}`,
                  borderRadius: tokens.borderRadius.lg,
                  background: isSelected ? tokens.colors.success[50] : tokens.colors.background.secondary,
                  cursor: 'pointer',
                  transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
                  boxShadow: isSelected ? tokens.boxShadow.md : tokens.boxShadow.sm,
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                  e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                }}
              >
                <div className="model-card-header">
                  <span className="model-name">{model.name}</span>
                  <div className="model-badges">
                    <span className={`speed-badge speed-${model.speed}`}>
                      {model.speed === 'fast' ? '⚡' : model.speed === 'medium' ? '⚖️' : '🐌'}
                    </span>
                    <span className={`quality-badge quality-${model.quality}`}>
                      {model.quality === 'basic' ? '⭐' : model.quality === 'good' ? '⭐⭐' : '⭐⭐⭐'}
                    </span>
                  </div>
                </div>
                
                <div className="model-card-details">
                  <p className="model-description">{model.description}</p>
                  <p className="model-size">{model.estimatedSize}</p>
                  {!webgpuSupported && (
                    <span className="demo-indicator">Demo Mode</span>
                  )}
                </div>
                
                {isSelected && (
                  <div className="selected-indicator" aria-hidden="true">✓</div>
                )}
                
                {showTooltip === model.id && (
                  <div className="model-tooltip" role="tooltip">
                    <div className="tooltip-section">
                      <strong>Speed:</strong> {tooltip.speed}
                    </div>
                    <div className="tooltip-section">
                      <strong>Quality:</strong> {tooltip.quality}
                    </div>
                    <div className="tooltip-section">
                      <strong>Size:</strong> {tooltip.size}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Regular Models
          availableModels.map((model) => {
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
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                padding: tokens.spacing[4],
                border: `2px solid ${
                  isSelected ? tokens.colors.success[600] : 
                  !isAvailable ? tokens.colors.border.light :
                  tokens.colors.border.light
                }`,
                borderStyle: !isAvailable ? 'dashed' : 'solid',
                borderRadius: tokens.borderRadius.lg,
                background: isSelected ? tokens.colors.success[50] : tokens.colors.background.secondary,
                cursor: (!canSelect || !isAvailable) ? 'not-allowed' : 'pointer',
                opacity: (!canSelect || !isAvailable) ? 0.6 : 1,
                transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
                textAlign: 'left',
                boxShadow: isSelected ? tokens.boxShadow.md : tokens.boxShadow.sm,
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (canSelect && isAvailable) {
                  e.currentTarget.style.borderColor = tokens.colors.primary[500];
                  e.currentTarget.style.boxShadow = `0 2px 8px ${tokens.colors.primary[500]}25`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = tokens.colors.border.light;
                  e.currentTarget.style.boxShadow = tokens.boxShadow.sm;
                }
              }}
              onFocusCapture={(e) => {
                e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
                e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
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
        })
        )}
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