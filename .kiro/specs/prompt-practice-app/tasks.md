# Implementation Plan

- [x] 1. Set up core project structure and TypeScript interfaces
  - Create `types/index.ts` with Guide, Lab, Attempt, ModelResult, and Evaluation interfaces
  - Set up `lib/` directory structure for models, evaluator, and utilities
  - Create `components/` directory for reusable UI components
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 2. Implement model provider system with fallback strategy
  - Create `lib/models/localModel.ts` with deterministic stub responses
  - Implement `lib/models/providers.ts` with MODEL_REGISTRY and callModel function
  - Add Hugging Face API integration with 256-512 token caps enforced per model
  - Implement rate limiting detection and automatic fallback to local stubs
  - Implement model source badge logic (hosted/sample/local)
  - _Requirements: 5.1, 5.2, 5.3, 6.2_

- [x] 3. Create evaluation system and rubric implementation
  - Implement `lib/evaluator.ts` with clarity + completeness scoring only (intentionally simple)
  - Create rubric parser that reads from `/docs/rubric.md` with fallback to basic heuristics
  - Add evaluation result formatting with 0-5 scale per metric, total score, and improvement notes
  - Write unit tests for evaluation logic with deterministic scoring
  - _Requirements: 6.3, 6.4_

- [x] 4. Build API endpoints for model inference and evaluation
  - Create `/api/compare` endpoint that processes userPrompt, systemPrompt, and models array
  - Implement model calling logic with timing and token tracking
  - Add evaluation pipeline integration that calls evaluator for each result
  - Implement error handling with proper HTTP status codes and fallback responses
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 5. Implement file-based storage system for attempts and evaluations
  - Create `data/attempts/` and `data/evaluations/` directory structure
  - Implement attempt writing logic with unique ID generation
  - Add evaluation file writing with proper JSON formatting (2-space indentation for readability)
  - Write all JSON artifacts in pretty-printed format for demo readability
  - Create utility functions for reading/writing attempt and evaluation files
  - _Requirements: 3.4, 4.4, 6.4, 7.4_

- [x] 6. Create Kiro hook system for automated evaluation
  - Implement `.kiro/hooks/onAttemptCreated.ts` with file creation trigger
  - Add attempt JSON validation using schema validation with path traversal guards
  - Implement hook logic that reads attempt, calls `/api/compare`, and writes evaluation
  - Add comprehensive logging: attemptId, labId, models[], latency, and result status
  - Create error handling that writes `.error.json` files for failed evaluations
  - Add retry logic and idempotency checks to prevent duplicate processing
  - Ensure hook logs are surfaced in the UI status via polling mechanism
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 7. Build home page with guides and labs navigation
  - Create home page (`/`) with clear separation between Guides and Labs sections
  - Implement GuidesList component that reads from `/docs/guides/*.md`
  - Create LabsList component with 3 lab types and placeholder indicators
  - Add visual distinction between learning (📚) and practice (🧪) sections
  - _Requirements: 1.1, 2.1_

- [ ] 8. Implement guide pages with markdown rendering
  - Create `/guides/[slug]` dynamic route for guide display
  - Implement markdown parsing and rendering with DOMPurify sanitization
  - Add navigation between guides and back to home
  - Create guide content loading from filesystem
  - _Requirements: 1.2, 1.3_

- [ ] 9. Build Practice Lab interface and functionality
  - Create `/labs/practice-basics` page with lab interface
  - Implement user prompt textarea and single model selection
  - Add Run button that creates attempt file and triggers evaluation
  - Create results display with single model output, score, and improvement hints
  - Add loading states and error handling with standardized error messages
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 10. Build Compare Lab interface and functionality
  - Create `/labs/compare-basics` page with multi-model interface
  - Implement user prompt textarea and multi-model selection (2-3 models)
  - Add Run button that creates attempt file for multiple models
  - Create side-by-side results cards showing modelId, latency, response, and scores
  - Add model source badges and comparison metrics
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 11. Create System Prompt Lab placeholder
  - Create `/labs/system-prompt-lab` page with placeholder interface
  - Add System Prompt textarea (visible by default) with clear "Stretch – Placeholder" labeling
  - Set `isPlaceholder: true` in lab configuration for clear code/UI distinction
  - Implement basic UI elements but indicate limited functionality with disabled states
  - Add roadmap information about planned features
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 12. Implement reusable UI components
  - Create ModelPicker component with source badges and selection limits
  - Build ResultsCards component with single and side-by-side layouts
  - Implement ScoreBadge component with tooltips and breakdown display
  - Add loading spinners, error banners, and status indicators
  - _Requirements: 3.1, 4.1, 6.3_

- [ ] 13. Add comprehensive error handling and user feedback
  - Implement standardized error UI with inline cards and dismissible banners
  - Add rate limiting detection and friendly error messages
  - Create offline mode indicators and fallback explanations
  - Implement retry mechanisms for failed evaluations
  - Add "Retry" button for failed attempts that creates new attempt.json with fresh attemptId
  - Surface hook execution status in UI via polling: Evaluating / Complete / Failed / Timeout
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 14. Create Kiro configuration files
  - Write `.kiro/specs/prompt-practice.yaml` with SubmitAttempt flow definition
  - Create `.kiro/steering/prompts.md` with evaluator tone and rubric guidelines
  - Add schema validation for Attempt and Evaluation data structures
  - Ensure schema validation in .kiro/specs matches TypeScript interfaces exactly to prevent drift
  - Document hook trigger conditions and error handling
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 15. Implement development bypass and testing utilities
  - Add `KIRO_BYPASS_HOOK` environment variable support
  - Create `/api/attempts` endpoint that mirrors hook behavior exactly (inline call to `/api/compare` + file writes)
  - Ensure bypass mode writes identical file structures to hook mode
  - Implement evaluation status polling with GET `/api/evaluations/{attemptId}`
  - Add development utilities for testing hook functionality and file artifact validation
  - _Requirements: 7.1, 7.2, 7.4_

- [ ] 16. Add input validation and security measures
  - Implement schema validation for all JSON inputs with strict type checking
  - Add path traversal guards for all file operations (prevent ../../../ attacks)
  - Implement prompt sanitization before disk writes (strip dangerous characters)
  - Add prompt length limits (max 2000 characters) with client and server validation
  - Add content sanitization with DOMPurify for markdown rendering
  - Create basic regex checks for malicious prompt injection patterns
  - Add model selection validation (1 for Practice, 2-3 for Compare)
  - _Requirements: 3.1, 4.1, 5.1, 5.2_

- [ ] 17. Write comprehensive tests for core functionality
  - Create unit tests for model providers, evaluator, and utility functions
  - Add integration tests for API endpoints and file operations
  - Implement tests for Kiro hook execution and error handling
  - Add tests for rate limit simulation and model source badge rendering
  - _Requirements: 5.1, 6.1, 7.1, 7.2_

- [ ] 18. Polish UI and add final touches
  - Implement responsive design for mobile and desktop
  - Add proper loading states and smooth transitions
  - Create consistent styling and component theming
  - Add accessibility features and keyboard navigation
  - Optimize performance and add error boundaries
  - _Requirements: 1.1, 2.1, 3.1, 4.1_