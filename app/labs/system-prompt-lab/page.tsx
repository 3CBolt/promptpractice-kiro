'use client';

import { useState } from 'react';
import { ModelProvider } from '@/types';
import { MODEL_REGISTRY } from '@/lib/models/providers';

export default function SystemPromptLab() {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  // Get available models (prefer hosted, fallback to sample)
  const availableModels = MODEL_REGISTRY.filter(model => 
    model.source === 'hosted' || model.source === 'sample'
  );

  const getSourceBadge = (source: ModelProvider['source']) => {
    switch (source) {
      case 'hosted':
        return '✨ Hosted';
      case 'sample':
        return '📦 Sample';
      case 'local':
        return '💻 Local';
      default:
        return '❓ Unknown';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Placeholder Badge */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">System Prompt Lab</h1>
          <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
            Stretch – Placeholder
          </span>
        </div>
        <p className="text-gray-600">
          Experiment with system prompts to guide model behavior and responses. This lab is currently a placeholder with limited functionality.
        </p>
      </div>

      {/* Placeholder Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Placeholder Lab</h3>
            <p className="text-sm text-yellow-700 mt-1">
              This lab is currently in development. The interface below shows planned functionality but is not fully operational.
            </p>
          </div>
        </div>
      </div>

      {/* Lab Interface - Disabled State */}
      <div className="space-y-6 opacity-75">
        {/* Model Selection */}
        <div>
          <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Model
          </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            disabled
          >
            <option value="">Choose a model...</option>
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} {getSourceBadge(model.source)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Model selection will be available in the full version
          </p>
        </div>

        {/* System Prompt Input - Visible by default */}
        <div>
          <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-700 mb-2">
            System Prompt
          </label>
          <textarea
            id="system-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Define the model's role, behavior, and constraints..."
            rows={4}
            maxLength={2000}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical bg-gray-50"
            disabled
          />
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span>System prompts guide the model's overall behavior</span>
            <span>{systemPrompt.length}/2000</span>
          </div>
        </div>

        {/* User Prompt Input */}
        <div>
          <label htmlFor="user-prompt" className="block text-sm font-medium text-gray-700 mb-2">
            User Prompt
          </label>
          <textarea
            id="user-prompt"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Enter your prompt here... (max 2000 characters)"
            rows={6}
            maxLength={2000}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical bg-gray-50"
            disabled
          />
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span>Test how your system prompt affects the response</span>
            <span>{userPrompt.length}/2000</span>
          </div>
        </div>

        {/* Run Button - Disabled */}
        <div>
          <button
            disabled
            className="px-6 py-3 bg-gray-400 text-white font-medium rounded-md cursor-not-allowed opacity-50"
          >
            Run Experiment (Coming Soon)
          </button>
        </div>
      </div>

      {/* Roadmap Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-blue-900 mb-4">🚀 Planned Features</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium text-blue-800 mb-2">System Prompt Experimentation</h3>
            <ul className="text-sm text-blue-700 space-y-1 ml-4">
              <li>• Test different system prompt variations</li>
              <li>• Compare how system prompts affect model responses</li>
              <li>• Pre-built system prompt templates for common use cases</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-blue-800 mb-2">A/B Testing Interface</h3>
            <ul className="text-sm text-blue-700 space-y-1 ml-4">
              <li>• Side-by-side comparison of different system prompts</li>
              <li>• Automated evaluation of system prompt effectiveness</li>
              <li>• Statistical analysis of prompt variations</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-blue-800 mb-2">Advanced Prompt Engineering</h3>
            <ul className="text-sm text-blue-700 space-y-1 ml-4">
              <li>• Role-based system prompt templates</li>
              <li>• Constraint and safety guideline integration</li>
              <li>• Context window optimization techniques</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-blue-800 mb-2">Educational Content</h3>
            <ul className="text-sm text-blue-700 space-y-1 ml-4">
              <li>• Interactive tutorials on system prompt design</li>
              <li>• Best practices and common patterns</li>
              <li>• Real-world use case examples</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Development Status */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Development Status</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
            <span>UI Design: Complete</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
            <span>Backend Integration: Planned</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
            <span>Evaluation System: Planned</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
            <span>A/B Testing: Planned</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <a
          href="/"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
}