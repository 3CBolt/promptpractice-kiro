# Kiro Hook System Documentation

## Overview

The Kiro hook system provides automated evaluation of user attempts in the Prompt Practice App. When a user submits a prompt through the UI, an attempt file is created, which triggers the hook to automatically process and evaluate the submission.

## Hook Files

### onAttemptCreated.kiro.hook
- **Trigger**: File creation in `data/attempts/*.json`
- **Purpose**: Automatically processes new attempt files with comprehensive validation, API calls, and result storage
- **Features**:
  - Schema validation with security guards
  - Idempotency checks to prevent duplicate processing
  - Retry logic with exponential backoff
  - Comprehensive logging and error handling
  - Atomic file operations

### onAttemptCreated.ts
- **Purpose**: TypeScript implementation of the hook logic for development and testing
- **Features**:
  - Mock responses in test environment
  - Direct function calls for bypass mode
  - Full error handling and validation
  - Compatible with the hook workflow

## Workflow

1. **User submits attempt** → `data/attempts/{attemptId}.json` created
2. **Hook triggers** → Validates attempt schema and security
3. **Idempotency check** → Skips if evaluation already exists
4. **API call** → POST to `/api/compare` with retry logic
5. **Result storage** → Writes `data/evaluations/{attemptId}.json` or `{attemptId}.error.json`
6. **Logging** → Comprehensive status and performance logging

## API Endpoints

### POST /api/attempts
- Creates new attempts and optionally processes them immediately
- Supports bypass mode via `KIRO_BYPASS_HOOK=true` environment variable
- Mirrors hook behavior for development and testing

### GET /api/evaluations/[attemptId]
- Returns evaluation status: `processing`, `completed`, or `failed`
- Provides polling mechanism for UI status updates
- Includes security validation for attemptId format

## Security Features

### Path Traversal Protection
- Validates attemptId format: only alphanumeric, hyphens, and underscores
- Prevents `../../../etc/passwd` style attacks
- Safe file operations with proper path validation

### Input Validation
- Prompt length limits: 2000 characters max
- Model selection limits: 1-3 models per request
- Schema validation for all JSON inputs
- Content sanitization before disk writes

### Error Handling
- Graceful handling of all error conditions
- Atomic file writes (temp file → rename)
- Detailed error logging with stack traces
- Retry logic for transient failures only

## Development and Testing

### Environment Variables
```bash
# Enable bypass mode for development
KIRO_BYPASS_HOOK=true

# Test environment (enables mock responses)
NODE_ENV=test
```

### Testing
- Unit tests: `lib/__tests__/hook-integration.test.ts`
- API tests: `lib/__tests__/api-hook-integration.test.ts`
- Mock responses in test environment
- Comprehensive validation and error scenario testing

### Bypass Mode
When `KIRO_BYPASS_HOOK=true`:
- `/api/attempts` processes attempts immediately
- No hook trigger required
- Identical file structures to hook mode
- Useful for development and debugging

## Logging Format

The hook provides comprehensive logging for monitoring and debugging:

```javascript
{
  status: 'completed' | 'failed' | 'skipped',
  processingTime: '123ms',
  attemptId: 'unique-attempt-id',
  labId: 'practice-basics',
  models: ['local-stub'],
  totalLatencyMs: 100,
  fallbacksUsed: [],
  retryCount: 0,
  modelResults: [
    {
      modelId: 'local-stub',
      latencyMs: 100,
      score: 8,
      source: 'sample'
    }
  ]
}
```

## Error Handling

### Validation Errors
- Schema validation failures
- Security violations (path traversal, invalid characters)
- Input length violations
- Model selection limit violations

### API Errors
- Network failures (with retry)
- Rate limiting (429 status)
- Server errors (5xx status)
- Client errors (4xx status, no retry except 429)

### File System Errors
- Permission issues
- Disk space problems
- Concurrent access conflicts

All errors are logged and written to `.error.json` files for debugging and user feedback.

## Performance Considerations

- **Retry Logic**: Exponential backoff (1s, 2s, 4s) for transient failures
- **Idempotency**: Prevents duplicate processing of the same attempt
- **Atomic Operations**: Safe concurrent file access
- **Mock Responses**: Fast testing without external API calls
- **Comprehensive Logging**: Detailed performance metrics for optimization

## Future Enhancements

- **Queue System**: Handle high-volume submissions
- **Webhook Support**: External system notifications
- **Advanced Retry**: Configurable retry policies
- **Metrics Collection**: Performance and usage analytics
- **Distributed Processing**: Multi-instance support