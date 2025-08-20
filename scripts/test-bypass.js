#!/usr/bin/env node

/**
 * CLI utility for testing bypass functionality and file artifact validation
 * Usage: node scripts/test-bypass.js [command] [options]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironment() {
  log('🔍 Checking bypass environment...', 'blue');
  
  // Check if KIRO_BYPASS_HOOK is set
  const bypassEnabled = process.env.KIRO_BYPASS_HOOK === 'true';
  if (!bypassEnabled) {
    log('⚠️  KIRO_BYPASS_HOOK is not set to "true"', 'yellow');
    log('   Set KIRO_BYPASS_HOOK=true to enable bypass mode', 'yellow');
  } else {
    log('✅ KIRO_BYPASS_HOOK is enabled', 'green');
  }
  
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    log('⚠️  Not in development mode', 'yellow');
    log('   Bypass mode should only be used in development', 'yellow');
  } else {
    log('✅ Running in development mode', 'green');
  }
  
  // Check data directory
  const dataDir = path.join(process.cwd(), 'data');
  try {
    fs.accessSync(dataDir, fs.constants.W_OK);
    log('✅ Data directory is writable', 'green');
  } catch (error) {
    log('❌ Data directory is not writable', 'red');
    log(`   Check permissions for: ${dataDir}`, 'red');
  }
  
  return bypassEnabled && isDev;
}

async function testBypassEndpoint() {
  log('🧪 Testing bypass endpoint...', 'blue');
  
  const testData = {
    labId: 'test-bypass',
    userPrompt: 'Test prompt for bypass functionality validation',
    models: ['local-stub'],
    systemPrompt: 'You are a helpful assistant for testing.'
  };
  
  try {
    // Make request to bypass endpoint
    const response = await fetch('http://localhost:3000/api/attempts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      log(`❌ Bypass endpoint failed: ${errorData.error}`, 'red');
      return null;
    }
    
    const result = await response.json();
    log(`✅ Bypass endpoint succeeded`, 'green');
    log(`   Attempt ID: ${result.attemptId}`, 'blue');
    log(`   Status: ${result.status}`, 'blue');
    
    return result.attemptId;
    
  } catch (error) {
    log(`❌ Failed to test bypass endpoint: ${error.message}`, 'red');
    return null;
  }
}

async function validateArtifacts(attemptId) {
  log(`🔍 Validating artifacts for attempt ${attemptId}...`, 'blue');
  
  try {
    // Validate attempt file
    const attemptResponse = await fetch(`http://localhost:3000/api/dev/validate?type=attempt&id=${attemptId}`);
    if (attemptResponse.ok) {
      const attemptResult = await attemptResponse.json();
      if (attemptResult.validation.isValid) {
        log('✅ Attempt file is valid', 'green');
      } else {
        log('❌ Attempt file validation failed:', 'red');
        attemptResult.validation.errors.forEach(error => log(`   - ${error}`, 'red'));
      }
    }
    
    // Validate evaluation file
    const evaluationResponse = await fetch(`http://localhost:3000/api/dev/validate?type=evaluation&id=${attemptId}`);
    if (evaluationResponse.ok) {
      const evaluationResult = await evaluationResponse.json();
      if (evaluationResult.validation.isValid) {
        log('✅ Evaluation file is valid', 'green');
      } else {
        log('❌ Evaluation file validation failed:', 'red');
        evaluationResult.validation.errors.forEach(error => log(`   - ${error}`, 'red'));
      }
    }
    
    // Get all artifacts
    const artifactsResponse = await fetch(`http://localhost:3000/api/dev/validate?type=artifacts&id=${attemptId}`);
    if (artifactsResponse.ok) {
      const artifactsResult = await artifactsResponse.json();
      log('📁 File artifacts:', 'blue');
      log(`   Attempt file: ${artifactsResult.artifacts.hasAttemptFile ? '✅' : '❌'}`, 'blue');
      log(`   Evaluation file: ${artifactsResult.artifacts.hasEvaluationFile ? '✅' : '❌'}`, 'blue');
      log(`   Error file: ${artifactsResult.artifacts.hasErrorFile ? '⚠️' : '✅'}`, 'blue');
    }
    
  } catch (error) {
    log(`❌ Failed to validate artifacts: ${error.message}`, 'red');
  }
}

async function testPolling(attemptId) {
  log(`🔄 Testing evaluation status polling for attempt ${attemptId}...`, 'blue');
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`http://localhost:3000/api/evaluations/${attemptId}`);
      if (!response.ok) {
        log(`❌ Polling failed: ${response.status}`, 'red');
        break;
      }
      
      const result = await response.json();
      log(`   Status: ${result.status} (attempt ${attempts + 1})`, 'blue');
      
      if (result.status === 'completed') {
        log('✅ Evaluation completed successfully', 'green');
        break;
      } else if (result.status === 'failed') {
        log('❌ Evaluation failed', 'red');
        if (result.error) {
          log(`   Error: ${result.error.message}`, 'red');
        }
        break;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
    } catch (error) {
      log(`❌ Polling error: ${error.message}`, 'red');
      break;
    }
  }
  
  if (attempts >= maxAttempts) {
    log('⚠️  Polling timed out', 'yellow');
  }
}

async function runFullTest() {
  log('🚀 Running full bypass functionality test...', 'blue');
  log('');
  
  // Step 1: Check environment
  const envOk = checkEnvironment();
  if (!envOk) {
    log('❌ Environment check failed. Please fix issues above.', 'red');
    return;
  }
  log('');
  
  // Step 2: Test bypass endpoint
  const attemptId = await testBypassEndpoint();
  if (!attemptId) {
    log('❌ Bypass endpoint test failed. Cannot continue.', 'red');
    return;
  }
  log('');
  
  // Step 3: Validate artifacts
  await validateArtifacts(attemptId);
  log('');
  
  // Step 4: Test polling
  await testPolling(attemptId);
  log('');
  
  log('🎉 Full bypass functionality test completed!', 'green');
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'env':
  case 'environment':
    checkEnvironment();
    break;
    
  case 'test':
    runFullTest();
    break;
    
  case 'validate':
    const attemptId = process.argv[3];
    if (!attemptId) {
      log('❌ Please provide an attempt ID: node scripts/test-bypass.js validate <attemptId>', 'red');
      process.exit(1);
    }
    validateArtifacts(attemptId);
    break;
    
  case 'poll':
    const pollAttemptId = process.argv[3];
    if (!pollAttemptId) {
      log('❌ Please provide an attempt ID: node scripts/test-bypass.js poll <attemptId>', 'red');
      process.exit(1);
    }
    testPolling(pollAttemptId);
    break;
    
  default:
    log('🔧 Bypass Functionality Test Utility', 'blue');
    log('');
    log('Usage: node scripts/test-bypass.js [command]', 'blue');
    log('');
    log('Commands:', 'blue');
    log('  env, environment  - Check bypass environment configuration', 'blue');
    log('  test             - Run full bypass functionality test', 'blue');
    log('  validate <id>    - Validate artifacts for specific attempt', 'blue');
    log('  poll <id>        - Test polling for specific attempt', 'blue');
    log('');
    log('Environment Variables:', 'blue');
    log('  KIRO_BYPASS_HOOK=true  - Enable bypass mode', 'blue');
    log('  NODE_ENV=development   - Required for dev utilities', 'blue');
    break;
}