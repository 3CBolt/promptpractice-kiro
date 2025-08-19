# Design Document

## Overview

The Prompt Practice App is a Next.js 14 application that provides educational content through Guides (markdown-based learning) and Labs (interactive practice environments). The system uses a hybrid approach with Hugging Face API for real model inference and LocalModel stubs for offline functionality, ensuring the app works without API keys while providing real AI interactions when available.

## Architecture

### Frontend Architecture
- **Next.js 14 App Router**: File-based routing with TypeScript
- **React 18**: Component-based UI with hooks for state management
- **Client-side evaluation**: Real-time feedback and scoring display
- **Progressive enhancement**: Works offline, enhanced with API access

### Backend Architecture
- **API Routes**: Next.js API routes for model inference and evaluation
- **File-based storage**: JSON files for attempts and evaluations (dev-friendly)
- **Model abstraction**: Unified interface supporting multiple backends
- **Kiro hooks**: Automated evaluation pipeline

### Model Integration Strategy
1. **Primary**: Hugging Face Inference API (2-3 small OSS models)
2. **Fallback**: LocalModel deterministic stubs
3. **Future**: Ollama local models (optional advanced feature)

## Components and Interfaces

### Core Types
```typescript
// types/index.ts
interface Guide {
  id: string;
  title: string;
  body: string;
  links?: { title: string; url: string }[];
}

interface Lab {
  id: string;
  type: 'practice' | 'compare' | 'system';
  title: string;
  instructions: string;
  linkedGuideSlug?: string;
  isPlaceholder?: boolean; // For System Prompt Lab - MVP placeholder only
}

interface Attempt {
  id: string;
  labId: string;
  systemPrompt?: string;
  userPrompt: string;
  models: string[];
  createdAt: string;
}

interface ModelResult {
  modelId: string;
  text: string;
  latencyMs: number;
  usageTokens?: number;
  source: 'hosted' | 'sample' | 'local'; // Model source badge
}

interface Evaluation {
  id: string;
  attemptId: string;
  perModelResults: (ModelResult & {
    score?: number;
    breakdown?: { clarity: number; completeness: number };
    notes?: string;
  })[];
  createdAt: string;
}
```

### Model Provider Interface
```typescript
// lib/models/providers.ts
interface ModelProvider {
  id: string;
  name: string;
  source: 'hosted' | 'sample' | 'local';
  maxTokens: number;
  isPlaceholder?: boolean;
}

const MODEL_REGISTRY: ModelProvider[] = [
  { id: 'llama3.1-8b', name: 'Llama 3.1 8B', source: 'hosted', maxTokens: 512 },
  { id: 'mistral-7b', name: 'Mistral 7B', source: 'hosted', maxTokens: 512 },
  { id: 'local-stub', name: 'Local Stub', source: 'sample', maxTokens: 512 } // Always available fallback
];

// Global API limits: 1000 requests/hour for free tier
// Per-model token limits: 256-512 tokens to respect free tier
```

### Page Components

#### Home Page (`/`)
- **GuidesList**: Renders 5 guides from `/docs/guides/*.md` with "📚 Learn" section header
- **LabsList**: Displays 3 lab types with "🧪 Practice" section header and clear visual separation
- **Navigation**: Prominent visual distinction between Guides (learning concepts) and Labs (hands-on practice)
- **PlaceholderIndicators**: System Prompt Lab clearly marked as "Stretch – Placeholder"

#### Guide Pages (`/guides/[slug]`)
- **MarkdownRenderer**: Parses and displays guide content
- **Navigation**: Back to home, next/previous guides
- **LinkedResources**: Optional related links

#### Lab Pages (`/labs/[id]`)
- **LabInterface**: Common interface for all lab types
- **ModelPicker**: Multi-select with source badges
- **PromptInputs**: User prompt + optional system prompt
- **ResultsDisplay**: Adaptive based on lab type
- **EvaluationFeedback**: Scores, breakdown, improvement hints

### UI Components

#### ModelPicker Component
```typescript
interface ModelPickerProps {
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
  maxSelection?: number;
}
```
- Displays model name with source badge (✨ Hosted, 📦 Sample, 💻 Local)
- Enforces selection limits (1 for Practice, 2-3 for Compare)
- Shows availability status

#### ResultsCards Component
```typescript
interface ResultsCardsProps {
  results: ModelResult[];
  evaluations?: Evaluation['perModelResults'];
  layout: 'single' | 'side-by-side';
}
```
- **Single layout**: Practice Lab results
- **Side-by-side layout**: Compare Lab results
- Shows model source badge, latency, response, and scores

#### ScoreBadge Component
```typescript
interface ScoreBadgeProps {
  score: number;
  breakdown: { clarity: number; completeness: number };
  notes?: string;
}
```
- Numeric score display with color coding
- Tooltip with detailed breakdown
- Improvement suggestions

## Data Models

### File Storage Structure
```
data/
├── attempts/           # User submissions
│   └── {attemptId}.json
├── evaluations/        # Processed results
│   └── {attemptId}.json
└── cache/             # Model response cache (optional)
    └── {hash}.json
```

### Attempt Flow
1. User submits lab → Write `data/attempts/{attemptId}.json`
2. Kiro hook triggers → Read attempt, call `/api/compare`
3. API processes → Call models, evaluate results
4. Write `data/evaluations/{attemptId}.json`
5. UI polls/fetches → Display results

## Error Handling

### Model Fallback Strategy
1. **Primary**: Try Hugging Face API
2. **Rate limit**: Switch to LocalModel with clear indication
3. **Network error**: Graceful fallback with user notification
4. **Quota exceeded**: Display helpful message about free tier limits

### User Experience
- **Loading states**: "Evaluating..." with progress indication
- **Error states**: Standardized inline cards + dismissible banners
  - "⚠️ Hugging Face quota exceeded. Switching to sample mode."
  - "🔌 Network error. Using offline mode."
- **Offline mode**: Prominent "📦 Sample Mode" badges on all results
- **Rate limiting**: Friendly explanation with retry timer

### Kiro Hook Error Handling
- **Idempotent operations**: Safe to retry
- **Failure logging**: Detailed error logs for debugging
- **UI feedback**: Show evaluation status in real-time

## Testing Strategy

### Unit Tests
- **Model providers**: Test fallback logic and response formatting
- **Evaluator**: Test scoring algorithms and rubric application
- **Components**: Test UI interactions and state management

### Integration Tests
- **API endpoints**: Test complete request/response cycles
- **File operations**: Test attempt/evaluation file handling
- **Kiro hooks**: Test automated evaluation pipeline
- **Rate limit simulation**: Test Hugging Face rate-limit → stub fallback path
- **Model source badges**: Test Hosted vs Sample vs Local badge rendering

### End-to-End Tests
- **Guide navigation**: Test markdown rendering and navigation
- **Lab workflows**: Test complete user journeys
- **Offline functionality**: Test LocalModel fallback behavior

### Performance Considerations
- **Response caching**: Cache model responses for identical prompts
- **Token limits**: Enforce 256-512 token limits for free tier
- **Rate limiting**: Implement client-side rate limiting
- **Lazy loading**: Load guides and lab content on demand

## Evaluation System

### MVP Rubric (Intentionally Simple)
- **Clarity**: Response coherence and readability (0-5 scale)
- **Completeness**: How well the response addresses the prompt (0-5 scale)
- **Total Score**: Sum of clarity + completeness (0-10 scale)
- **Notes**: Brief improvement suggestions

### Rubric Expansion (Post-MVP)
Future versions can add: tone, safety, creativity, factual accuracy, prompt injection resistance.

## Planned Features (Not MVP)

### System Prompt Lab
- Full system prompt experimentation interface
- A/B testing between system prompt variations
- Advanced prompt engineering techniques

### Prompt Injection Sandbox
- Safe environment to test injection vulnerabilities
- Educational content about prompt security
- Detection and mitigation strategies

### Advanced Model Integration
- Ollama local model support
- Custom model endpoints
- Model performance benchmarking

## Security and Privacy

### Data Handling
- **No user accounts**: No personal data collection in MVP
- **Local storage**: JSON file storage for single-user hackathon demo only (not multi-user ready)
- **API key security**: Environment variables only, never exposed to client
- **Content sanitization**: 
  - DOMPurify for markdown rendering
  - Basic regex checks for malicious prompt injection patterns
  - Input length limits (max 2000 characters per prompt)

### Model Safety
- **Content filtering**: Basic content filtering for inappropriate prompts
- **Token limits**: Prevent excessive API usage
- **Error boundaries**: Graceful handling of model failures

## Deployment and Configuration

### Environment Variables
```bash
# Optional - app works without these
HUGGINGFACE_API_KEY=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
NEXT_PUBLIC_ENABLE_HOSTED_MODELS=true
```

### Development Setup
1. Clone repository
2. `npm install`
3. `npm run dev` (works immediately, no setup required)
4. Optional: Add HF API key for real model access

### Production Considerations
- **Static generation**: Pre-generate guide pages
- **API rate limiting**: Implement proper rate limiting
- **Monitoring**: Track API usage and errors
- **Caching**: Implement response caching for performance