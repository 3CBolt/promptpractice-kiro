# Project Structure

## Root Directory
```
├── app/                 # Next.js App Router pages and layouts
│   ├── guides/[slug]/   # Dynamic guide pages
│   ├── labs/[id]/       # Dynamic lab pages
│   ├── api/             # API routes (compare, attempts, evaluations)
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/          # Reusable UI components
│   ├── ModelPicker.tsx
│   ├── ResultsCards.tsx
│   └── ScoreBadge.tsx
├── lib/                 # Core business logic
│   ├── models/          # Model providers and integration
│   ├── evaluator.ts     # Scoring and rubric logic
│   └── utils.ts         # Shared utilities
├── types/               # TypeScript type definitions
│   └── index.ts         # Core interfaces
├── data/                # File-based storage (dev only)
│   ├── attempts/        # User submissions
│   └── evaluations/     # Processed results
├── docs/                # Educational content
│   ├── guides/          # Learning materials (5 guides)
│   ├── specs/           # Technical specifications
│   └── rubric.md        # Evaluation criteria
├── .kiro/               # Kiro configuration
│   ├── specs/           # Workflow definitions
│   ├── hooks/           # Automated evaluation hooks
│   └── steering/        # AI assistant guidance
└── content/             # Reserved for future content
```

## Key Conventions
- **File naming**: kebab-case for files, PascalCase for components
- **TypeScript**: Strict mode, all interfaces in `types/index.ts`
- **Path aliases**: `@/` for project root imports
- **JSON storage**: Pretty-printed (2-space indent) for demo readability
- **Security**: Schema validation, path traversal guards, input sanitization
- **Error handling**: Standardized UI patterns with retry mechanisms

## Lab Structure
- `practice-basics`: Single model testing
- `compare-basics`: Multi-model comparison
- `system-prompt-lab`: Placeholder (`isPlaceholder: true`)

## Data Flow
1. User submits → `data/attempts/{id}.json`
2. Kiro hook triggers → calls `/api/compare`
3. Evaluation completes → `data/evaluations/{id}.json`
4. UI polls and displays results

## Development Notes
- Single-user demo only (not multi-user ready)
- Works completely offline with stubs
- Enhanced with Hugging Face API when available
- All artifacts human-readable for hackathon judging