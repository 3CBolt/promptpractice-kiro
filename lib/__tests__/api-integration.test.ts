import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';

describe('API Integration Tests', () => {
  let serverProcess: ChildProcess;
  const baseUrl = 'http://localhost:3001'; // Use different port to avoid conflicts

  beforeAll(async () => {
    // Start the Next.js development server
    serverProcess = spawn('npm', ['run', 'dev'], {
      env: { ...process.env, PORT: '3001' },
      stdio: 'pipe'
    });

    // Wait for server to start
    await new Promise((resolve) => {
      serverProcess.stdout?.on('data', (data) => {
        if (data.toString().includes('Ready')) {
          resolve(true);
        }
      });
      
      // Fallback timeout
      setTimeout(resolve, 10000);
    });
  });

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  it('should handle single model comparison request', async () => {
    const response = await fetch(`${baseUrl}/api/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userPrompt: 'Explain artificial intelligence in simple terms',
        models: ['local-stub']
      })
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('metadata');
    expect(data.results).toHaveLength(1);
    
    const result = data.results[0];
    expect(result).toHaveProperty('modelId', 'local-stub');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('latencyMs');
    expect(result).toHaveProperty('source', 'sample');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('breakdown');
    expect(result).toHaveProperty('notes');
    
    // Verify evaluation structure
    expect(result.breakdown).toHaveProperty('clarity');
    expect(result.breakdown).toHaveProperty('completeness');
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    
    // Verify metadata
    expect(data.metadata).toHaveProperty('totalLatencyMs');
    expect(data.metadata).toHaveProperty('processedAt');
    expect(data.metadata).toHaveProperty('fallbacksUsed');
    expect(Array.isArray(data.metadata.fallbacksUsed)).toBe(true);
  });

  it('should handle multi-model comparison request', async () => {
    const response = await fetch(`${baseUrl}/api/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userPrompt: 'What are the benefits of renewable energy?',
        models: ['local-stub', 'local-creative', 'local-analytical']
      })
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    expect(data.results).toHaveLength(3);
    
    // Verify each result has proper structure
    data.results.forEach((result: any, index: number) => {
      expect(result).toHaveProperty('modelId');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('latencyMs');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('notes');
      
      // Verify different models return different responses
      if (index > 0) {
        expect(result.text).not.toBe(data.results[0].text);
      }
    });
  });

  it('should handle system prompt correctly', async () => {
    const response = await fetch(`${baseUrl}/api/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userPrompt: 'Explain quantum computing',
        systemPrompt: 'You are a helpful physics teacher. Explain concepts clearly and use analogies.',
        models: ['local-stub']
      })
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.results).toHaveLength(1);
    expect(data.results[0]).toHaveProperty('text');
  });

  it('should return proper error for invalid requests', async () => {
    // Test missing userPrompt
    const response1 = await fetch(`${baseUrl}/api/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        models: ['local-stub']
      })
    });

    expect(response1.status).toBe(400);
    const data1 = await response1.json();
    expect(data1.error).toContain('userPrompt is required');

    // Test missing models
    const response2 = await fetch(`${baseUrl}/api/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userPrompt: 'Test prompt'
      })
    });

    expect(response2.status).toBe(400);
    const data2 = await response2.json();
    expect(data2.error).toContain('models array is required');

    // Test too many models
    const response3 = await fetch(`${baseUrl}/api/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userPrompt: 'Test prompt',
        models: ['model1', 'model2', 'model3', 'model4']
      })
    });

    expect(response3.status).toBe(400);
    const data3 = await response3.json();
    expect(data3.error).toContain('Maximum of 3 models allowed');
  });

  it('should return API information on GET request', async () => {
    const response = await fetch(`${baseUrl}/api/compare`, {
      method: 'GET'
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    expect(data).toHaveProperty('endpoint', '/api/compare');
    expect(data).toHaveProperty('methods');
    expect(data.methods).toContain('POST');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('availableModels');
    expect(data).toHaveProperty('limits');
    
    // Verify limits
    expect(data.limits).toMatchObject({
      maxPromptLength: 2000,
      maxModelsPerRequest: 3,
      maxTokensPerModel: 512
    });
    
    // Verify available models structure
    expect(Array.isArray(data.availableModels)).toBe(true);
    expect(data.availableModels.length).toBeGreaterThan(0);
    
    data.availableModels.forEach((model: any) => {
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('source');
      expect(model).toHaveProperty('maxTokens');
    });
  });
}, 30000); // 30 second timeout for integration tests