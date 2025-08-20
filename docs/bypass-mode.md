# Bypass Mode Documentation

The Prompt Practice App includes a development bypass mode that allows testing the evaluation pipeline without relying on Kiro hooks. This is useful for development, testing, and debugging.

## Overview

Bypass mode provides:
- Direct API endpoint that mirrors hook behavior exactly
- Immediate processing of attempts through the evaluation pipeline
- Identical file structure output to hook mode
- Development utilities for validation and testing
- Evaluation status polling for real-time feedback

## Environment Setup

### Required Environment Variables

```bash
# Enable bypass mode (required)
KIRO_BYPASS_HOOK=true

# Development mode (recommended)
NODE_ENV=development

# Optional: Hugging Face API key for real model testing
HUGGINGFACE_API_KEY=your_api_key_here
```

### Directory Structure

Bypass mode uses the same file structure as hook mode:

```
data/
├── attempts/           # User submissions
│   └── {attemptId}.json
├── evaluations/        # Processed results
│   ├── {attemptId}.json
│   └── {attemptId}.error.json  # Error files if processing fails
└── config/
    └── rubric.json
```

## API Endpoints

### POST /api/attempts

Creates an attempt and processes it immediately through the evaluation pipeline.

**Request:**
```json
{
  "labId": "practice-basics",
  "userPrompt": "Explain machine learning in simple terms",
  "models": ["llama3.1-8b", "mistral-7b"],
  "systemPrompt": "You are a helpful assistant."
}
```

**Response:**
```json
{
  "attemptId": "mej2vy66-8i3f6x",
  "status": "completed",
  "evaluation": {
    "id": "eval-123",
    "attemptId": "mej2vy66-8i3f6x",
    "perModelResults": [
      {
        "modelId": "llama3.1-8b",
        "text": "Machine learning is...",
        "latencyMs": 1250,
        "source": "hosted",
        "score": 8,
        "breakdown": {
          "clarity": 4,
          "completeness": 4
        },
        "notes": "Good explanation with clear examples."
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "attemptId": "mej2vy66-8i3f6x",
  "status": "failed",
  "error": {
    "message": "Model processing failed",
    "code": "PROCESSING_ERROR"
  }
}
```

### GET /api/evaluations/{attemptId}

Polls the evaluation status for a specific attempt. This endpoint works for both hook mode and bypass mode.

**Response:**
```json
{
  "status": "processing|completed|failed",
  "evaluation": { /* evaluation object if completed */ },
  "error": { /* error details if failed */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Development Validation Endpoints

#### GET /api/dev/validate

Validation utilities (development mode only):

- `?type=attempt&id=attemptId` - Validate attempt file structure
- `?type=evaluation&id=attemptId` - Validate evaluation file structure
- `?type=artifacts&id=attemptId` - Get all file artifacts for an attempt
- `?type=compare&id1=attemptId1&id2=attemptId2` - Compare artifacts between attempts
- `?type=environment` - Check bypass environment configuration
- `?type=test` - Run comprehensive bypass functionality test

## Usage Examples

### Basic Usage

```bash
# Enable bypass mode
export KIRO_BYPASS_HOOK=true
export NODE_ENV=development

# Start the development server
npm run dev

# Create and process an attempt
curl -X POST http://localhost:3000/api/attempts \
  -H "Content-Type: application/json" \
  -d '{
    "labId": "practice-basics",
    "userPrompt": "What is prompt engineering?",
    "models": ["local-stub"]
  }'

# Poll evaluation status
curl http://localhost:3000/api/evaluations/{attemptId}
```

### Using the Test Utility

```bash
# Check environment configuration
node scripts/test-bypass.js env

# Run full functionality test
node scripts/test-bypass.js test

# Validate specific attempt artifacts
node scripts/test-bypass.js validate mej2vy66-8i3f6x

# Test polling for specific attempt
node scripts/test-bypass.js poll mej2vy66-8i3f6x
```

### Validation Examples

```bash
# Validate attempt file structure
curl "http://localhost:3000/api/dev/validate?type=attempt&id=mej2vy66-8i3f6x"

# Check environment configuration
curl "http://localhost:3000/api/dev/validate?type=environment"

# Compare artifacts between two attempts
curl "http://localhost:3000/api/dev/validate?type=compare&id1=attempt1&id2=attempt2"
```

## File Structure Validation

### Attempt File Structure

```json
{
  "id": "mej2vy66-8i3f6x",
  "labId": "practice-basics",
  "systemPrompt": "You are a helpful assistant.",
  "userPrompt": "What is prompt engineering?",
  "models": ["llama3.1-8b"],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Required Fields:**
- `id` (string): Unique attempt identifier
- `labId` (string): Lab identifier
- `userPrompt` (string): User's prompt
- `models` (array): Array of model IDs
- `createdAt` (string): ISO timestamp

**Optional Fields:**
- `systemPrompt` (string): System prompt if provided

### Evaluation File Structure

```json
{
  "id": "eval-123",
  "attemptId": "mej2vy66-8i3f6x",
  "perModelResults": [
    {
      "modelId": "llama3.1-8b",
      "text": "Prompt engineering is...",
      "latencyMs": 1250,
      "source": "hosted",
      "score": 8,
      "breakdown": {
        "clarity": 4,
        "completeness": 4
      },
      "notes": "Clear and comprehensive explanation."
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

## Testing and Validation

### Automated Testing

The bypass mode includes comprehensive validation utilities:

1. **File Structure Validation**: Ensures all required fields are present and correctly typed
2. **Content Validation**: Validates prompt lengths, model limits, and data integrity
3. **Comparison Testing**: Compares artifacts between different attempts to ensure consistency
4. **Environment Validation**: Checks that bypass mode is properly configured

### Manual Testing

1. **Create Test Attempt**: Use the `/api/attempts` endpoint to create a test attempt
2. **Validate Files**: Check that both attempt and evaluation files are created correctly
3. **Test Polling**: Use the evaluation status endpoint to test real-time polling
4. **Compare Results**: Compare bypass mode results with hook mode results

### Error Handling

Bypass mode handles errors identically to hook mode:

- **Processing Errors**: Creates `.error.json` files with detailed error information
- **Validation Errors**: Returns appropriate HTTP status codes and error messages
- **File System Errors**: Handles permission and disk space issues gracefully

## Security Considerations

### Development Only

Bypass mode is designed for development and testing only:

- Only enabled when `KIRO_BYPASS_HOOK=true`
- Validation endpoints only work in development mode
- Should not be used in production environments

### Input Validation

All inputs are validated for security:

- Prompt length limits (2000 characters)
- Model selection limits (maximum 3 models)
- Path traversal protection for file operations
- Schema validation for all JSON inputs

### File System Security

- All file operations use safe path construction
- Directory traversal attacks are prevented
- File permissions are checked before operations

## Troubleshooting

### Common Issues

1. **Bypass Mode Not Enabled**
   - Ensure `KIRO_BYPASS_HOOK=true` is set
   - Check that you're in development mode

2. **File Permission Errors**
   - Ensure the `data/` directory is writable
   - Check file system permissions

3. **API Errors**
   - Check that the development server is running
   - Verify request format and required fields

4. **Validation Failures**
   - Use the validation endpoints to identify issues
   - Check file structure against documented schemas

### Debug Commands

```bash
# Check environment
node scripts/test-bypass.js env

# Run comprehensive test
node scripts/test-bypass.js test

# Validate specific files
curl "http://localhost:3000/api/dev/validate?type=artifacts&id=attemptId"
```

## Integration with Kiro Hooks

Bypass mode is designed to produce identical results to Kiro hooks:

- Same file structure and naming conventions
- Identical processing pipeline
- Same error handling and logging
- Compatible with existing polling mechanisms

This ensures that code developed and tested with bypass mode will work seamlessly with the production Kiro hook system.