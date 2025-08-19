# Technology Stack

## Framework & Runtime
- **Next.js 14** with App Router (experimental appDir enabled)
- **React 18** with TypeScript
- **Node.js** runtime

## Build System
- Next.js built-in build system
- TypeScript compilation with strict mode enabled
- ESLint for code linting

## Key Dependencies
- `next`: 14.0.0
- `react` & `react-dom`: ^18
- `typescript`: ^5
- `eslint-config-next`: 14.0.0
- `dompurify`: For markdown sanitization
- Additional: Schema validation library (zod recommended)

## API Integration
- **Hugging Face Inference API**: Primary model provider
- **LocalModel stubs**: Offline fallback system
- **Rate limiting**: Free tier constraints (1000 requests/hour)
- **Token limits**: 256-512 tokens per model call

## Common Commands
```bash
# Development
npm run dev          # Start development server (works offline)

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Environment
HUGGINGFACE_API_KEY=hf_xxx     # Optional - app works without
KIRO_BYPASS_HOOK=true          # Dev mode - bypass hooks for inline evaluation
```

## TypeScript Configuration
- Strict mode enabled
- Path aliases: `@/*` maps to project root
- JSX preserve mode for Next.js
- ES6+ target with bundler module resolution
- Schema validation must match TypeScript interfaces exactly