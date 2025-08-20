# Hook System Documentation

This document describes the hook trigger conditions, error handling, and operational procedures for the Prompt Practice App's automated evaluation system.

## Hook Overview

The Prompt Practice App uses Kiro hooks to automatically process user prompt submissions through model inference and evaluation. The primary hook is `onAttemptCreated` which triggers when new attempt files are created.

## Trigger Conditions

### File Creation Trigger

**Pattern**: `data/attempts/*.json`
**Type**: `fileCreated`
**Description**: Triggers when a new JSON file is created in the `data/attempts/` directory

#### Trigger Requirements
1. **File Location**: Must be in `data/attempts/` directory
2. **File Extension**: Must have `.json` extension
3. **File Content**: Must contain valid JSON that matches the Attempt schema
4. **Filename Format**: `{attemptId}.json` where attemptId contains only alphanumeric characters, hyphens, and underscores

#### Security Considerations
- **Path Traversal Protection**: Attempt IDs are validated with regex `^[a-zA-Z0-9-_]+$`
- **File Size Limits**: Maximum file size of 1MB enforced
- **Content Validation**: All JSON content is validated against strict schemas

## Processing Workflow

### 1. Schema Validation Phase
**Purpose**: Ensure data integrity and security before processing

**Validations Performed**:
- JSON structure validation against AttemptSchema
- Required field presence check (id, labId, userPrompt, models, createdAt)
- Data type validation for all fields
- String length limits (userPrompt ≤ 2000 chars, systemPrompt ≤ 2000 chars)
- Array constraints (models: 1-3 items, all strings)
- Path traversal protection (attemptId character validation)
- Lab ID validation (must be one of: practice-basics, compare-basics, system-prompt-lab)

**Error Handling**:
- Invalid JSON → Write error file with parsing details
- Missing required fields → Write error file with field list
- Invalid data types → Write error file with type mismatch details
- Security violations → Write error file and log security event

### 2. Idempotency Check Phase
**Purpose**: Prevent duplicate processing and handle retry scenarios

**Checks Performed**:
- Look for existing `data/evaluations/{attemptId}.json`
- Look for existing `data/evaluations/{attemptId}.error.json`
- Validate attempt ID extraction from filename

**Behavior**:
- If evaluation exists → Log "skipped" and exit gracefully
- If error file exists → Log "retry attempt" and proceed
- If neither exists → Proceed with processing

### 3. API Call Phase
**Purpose**: Execute model inference with robust error handling

**API Endpoint**: `POST /api/compare`
**Payload Structure**:
```json
{
  "userPrompt": "string",
  "systemPrompt": "string (optional)",
  "models": ["array", "of", "model-ids"]
}
```

**Retry Logic**:
- **Maximum Attempts**: 3
- **Backoff Strategy**: Exponential (1s, 2s, 4s)
- **Retry Conditions**:
  - Network errors (fetch failures)
  - HTTP 429 (rate limiting)
  - HTTP 500, 502, 503 (server errors)
- **No Retry Conditions**:
  - HTTP 400 (validation errors)
  - HTTP 401, 403 (authentication/authorization)
  - HTTP 404 (not found)
  - JSON parsing errors in response

### 4. Result Processing Phase
**Purpose**: Store evaluation results or error information

**Success Path**:
- Validate API response against EvaluationSchema
- Create Evaluation object with unique ID
- Write to `data/evaluations/{attemptId}.json` with pretty formatting
- Log success with performance metrics

**Error Path**:
- Create EvaluationError object with details
- Write to `data/evaluations/{attemptId}.error.json`
- Include original attempt data for debugging
- Log error with retry count and timing

## Error Handling Strategies

### Error Categories

#### 1. Validation Errors
**Cause**: Invalid input data or schema violations
**Response**: Immediate failure with detailed error message
**Recovery**: User must fix input and resubmit
**Example**:
```json
{
  "attemptId": "invalid-attempt",
  "error": "Invalid schema: userPrompt exceeds maximum length of 2000 characters",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00Z",
  "retryCount": 0
}
```

#### 2. Network Errors
**Cause**: API unavailable, timeout, or connectivity issues
**Response**: Retry with exponential backoff
**Recovery**: Automatic retry up to 3 attempts
**Example**:
```json
{
  "attemptId": "network-fail",
  "error": "fetch failed: ECONNREFUSED (after 3 attempts)",
  "code": "NETWORK_ERROR",
  "timestamp": "2024-01-15T10:30:00Z",
  "retryCount": 3
}
```

#### 3. Rate Limiting
**Cause**: API quota exceeded or rate limits hit
**Response**: Retry with backoff, then fallback to local models
**Recovery**: Automatic retry, then graceful degradation
**Example**:
```json
{
  "attemptId": "rate-limited",
  "error": "Rate limit exceeded, fallback to local models failed",
  "code": "RATE_LIMIT_EXCEEDED",
  "timestamp": "2024-01-15T10:30:00Z",
  "retryCount": 3
}
```

#### 4. Server Errors
**Cause**: API internal errors or temporary unavailability
**Response**: Retry with backoff
**Recovery**: Automatic retry up to 3 attempts
**Example**:
```json
{
  "attemptId": "server-error",
  "error": "Server error 500: Internal server error (after 2 attempts)",
  "code": "SERVER_ERROR",
  "timestamp": "2024-01-15T10:30:00Z",
  "retryCount": 2
}
```

### Error File Structure

All error files follow the EvaluationErrorSchema:
```json
{
  "attemptId": "string",
  "error": "Human-readable error message",
  "code": "ERROR_CATEGORY",
  "timestamp": "ISO 8601 timestamp",
  "retryCount": 0,
  "originalAttempt": {
    // Complete original attempt data for debugging
  }
}
```

## Logging and Monitoring

### Log Levels
- **INFO**: Normal processing events (start, complete, skip)
- **WARN**: Retry attempts and fallback usage
- **ERROR**: Processing failures and error file creation

### Logged Information

#### Success Logs
```
[Hook] Successfully processed {attemptId}: {
  models: ["model1", "model2"],
  totalLatency: 1500,
  fallbacks: [],
  processingTime: "2.3s"
}
```

#### Error Logs
```
[Hook] Failed to process {attemptId}: {
  error: "Rate limit exceeded",
  retryCount: 3,
  processingTime: "15.2s"
}
```

#### Skip Logs
```
[Hook] Skipped {attemptId}: evaluation already exists
```

### Performance Metrics
- **Processing Time**: Total time from trigger to completion
- **API Latency**: Time spent in model inference calls
- **Retry Count**: Number of retry attempts made
- **Fallback Usage**: Which models fell back to local stubs

## Development and Testing

### Bypass Mode
**Environment Variable**: `KIRO_BYPASS_HOOK=true`
**Purpose**: Allow direct API calls during development
**Behavior**: Enables `/api/attempts` endpoint that mirrors hook behavior

### Testing Utilities
- **Mock Responses**: Test environment returns deterministic responses
- **Error Simulation**: Ability to simulate various error conditions
- **Schema Validation**: Comprehensive validation testing
- **Idempotency Testing**: Verify duplicate processing prevention

### File System Operations
- **Atomic Writes**: Use temporary files and rename for atomicity
- **Pretty Formatting**: All JSON files use 2-space indentation for readability
- **Backup Strategy**: Error files preserve original attempt data

## Troubleshooting Guide

### Common Issues

#### Hook Not Triggering
1. Check file location (`data/attempts/` directory)
2. Verify filename format (`{attemptId}.json`)
3. Ensure JSON is valid
4. Check Kiro hook service status

#### Evaluation Fails Repeatedly
1. Check API endpoint availability
2. Verify environment variables (API keys)
3. Review error files for specific error codes
4. Check network connectivity
5. Verify model availability

#### Schema Validation Errors
1. Compare attempt structure to AttemptSchema
2. Check field types and constraints
3. Verify required fields are present
4. Validate string lengths and array sizes

#### Performance Issues
1. Monitor API response times
2. Check retry frequency
3. Review fallback usage patterns
4. Analyze processing time logs

### Recovery Procedures

#### Manual Retry
1. Delete existing error file: `data/evaluations/{attemptId}.error.json`
2. Hook will automatically retry on next file system event
3. Or use development bypass: `POST /api/attempts`

#### Data Corruption Recovery
1. Restore attempt file from backup
2. Delete corrupted evaluation files
3. Allow hook to reprocess

#### API Quota Recovery
1. Wait for quota reset (usually hourly)
2. Monitor rate limit headers
3. Consider upgrading API plan if needed

## Security Considerations

### Input Sanitization
- All prompts are validated for length and content
- Path traversal attacks prevented through ID validation
- JSON parsing uses safe methods with size limits

### File System Security
- All file operations use validated paths
- No user-controlled file paths allowed
- Temporary files cleaned up automatically

### API Security
- API keys stored in environment variables only
- No sensitive data logged
- Rate limiting respected to prevent abuse

### Error Information
- Error messages sanitized to prevent information leakage
- Stack traces only in development mode
- User data anonymized in logs when possible

This documentation ensures reliable, secure, and maintainable operation of the hook system while providing clear guidance for troubleshooting and development.