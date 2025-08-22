# Implementation Plan - Prompt Practice App Refinement Phase

## Quick Wins (1 Day)

- [x] 1. Implement browser-based LLM with zero-setup onboarding
  - Add `lib/models/webgpuModel.ts` using WebLLM or transformers.js for in-browser inference
  - Implement two model options: "Fast (tiny)" and "Better (small)" with weight caching between sessions
  - Create lazy loading that only downloads models when user first opens any Lab
  - Build onboarding modal explaining Lab workflow (Draft → Submit → Feedback) with 3-step tip sheet
  - Add progress bar with statuses: "Fetching weights...", "Compiling...", "Warming up...", "Ready"
  - Implement model picker dropdown with tooltips about speed vs quality tradeoffs
  - Add localStorage to remember user's last model choice
  - Replace API key copy with "This Lab runs a small open model in your browser. No setup needed."
  - Add WebGPU detection with graceful fallback to "Read-only demo" mode for unsupported browsers
  - _Requirements: 6.4, 6.5, 1.1_
  - _Files: lib/models/webgpuModel.ts, components/OnboardingModal.tsx, components/ModelPicker.tsx, lib/models/providers.ts_
  - _Effort: L, Dependencies: None, Risks: WebGPU compatibility, model loading performance_

- [x] 2. Implement v1.0 schemas and shared contracts
  - Create `schemas/attempt.schema.json` with userId, rubricVersion, modelConfig, timestamp, and context fields
  - Create `schemas/evaluation.schema.json` with enhanced error contract and rubricVersion tracking
  - Add `types/contracts.ts` with shared AttemptStatus enum and ErrorContract interface
  - Update existing TypeScript interfaces to match schema exactly
  - _Requirements: 3.1, 3.2, 3.3, 9.2_
  - _Files: schemas/attempt.schema.json, schemas/evaluation.schema.json, types/contracts.ts, types/index.ts_
  - _Effort: M, Dependencies: None, Risks: Breaking changes to existing data_

- [x] 3. Create design token system and apply to buttons/inputs
  - Create `styles/tokens.ts` with colors, spacing, typography, and focus ring definitions
  - Update button components to use design tokens for consistent styling
  - Update input components to use design tokens for consistent styling
  - Add focus ring styles that meet WCAG AA contrast requirements
  - _Requirements: 5.1, 5.2, 4.2_
  - _Files: styles/tokens.ts, components/ModelPicker.tsx, components/RetryButton.tsx_
  - _Effort: S, Dependencies: None, Risks: Visual regression_

- [x] 4. Add global navigation with persistent header
  - Create `components/GlobalNav.tsx` with Learn | Practice | Progress | About sections
  - Add skip link for accessibility compliance
  - Implement active state indication and keyboard navigation
  - Update `app/layout.tsx` to include persistent navigation
  - _Requirements: 1.1, 4.1, 4.3_
  - _Files: components/GlobalNav.tsx, app/layout.tsx_
  - _Effort: M, Dependencies: Design tokens, Risks: Layout conflicts_

- [x] 5. Implement idempotency ledger for hook/retry protection
  - Create `lib/idempotency.ts` with IdempotencyManager class
  - Add file-based ledger at `data/.idempotency.json` with lock/unlock mechanisms
  - Update hook processing to check idempotency before execution
  - Add concurrent request protection with lock expiry
  - _Requirements: 3.4, 7.5_
  - _Files: lib/idempotency.ts, .kiro/hooks/onAttemptCreated.ts_
  - _Effort: M, Dependencies: None, Risks: Race conditions_

## Sprint 1: Core UX (3-5 Days)

- [ ] 6. Create clear lab workflow with visible Draft → Submit → Feedback progression
  - Create `components/LabStepHeader.tsx` with numbered steps (1. Draft, 2. Submit, 3. Feedback) and progress indicators
  - Implement distinct visual states: Draft (editable), Submit (loading/processing), Feedback (results/retry)
  - Add contextual help text for each step ("Write your prompt", "Evaluating response", "Review and improve")
  - Include step navigation that allows users to understand where they are in the process
  - Add "Start Over" option in feedback step to return to draft with clean slate
  - Ensure each step feels purposeful and reduces cognitive load for beginners
  - _Requirements: 1.4, 7.1, 7.3_
  - _Files: components/LabStepHeader.tsx, app/labs/practice-basics/page.tsx, app/labs/compare-basics/page.tsx_
  - _Effort: L, Dependencies: Design tokens, Risks: User flow complexity_

- [ ] 7. Build comprehensive feedback system with educational reinforcement
  - Create `components/FeedbackPanel.tsx` with per-criterion explanations, specific example fixes, and improvement suggestions
  - Implement constructive feedback design using encouraging colors (blue, green) and avoiding punitive red/warning badges
  - Add "Resubmit" functionality that creates new attempt with fresh attemptId and preserves learning context
  - Add dynamic links to relevant guide sections based on feedback content (e.g., "Learn more about clarity in our Fundamentals guide")
  - Include "What went well" section alongside improvement areas to maintain positive tone
  - Add progress indicators showing improvement over multiple attempts
  - _Requirements: 2.3, 2.5, 2.6, 11.1, 11.2, 11.3, 11.4_
  - _Files: components/FeedbackPanel.tsx, lib/clientUtils.ts, lib/progress.ts_
  - _Effort: L, Dependencies: Design tokens, rubric content, guide content, Risks: Feedback quality and tone_

- [ ] 8. Render all six status states in practice lab UI
  - Update practice lab to display queued, running, success, partial, error, timeout states
  - Implement partial results rendering with clear indicators for incomplete responses
  - Add appropriate loading states and error recovery suggestions
  - Ensure all status transitions are visually clear and accessible
  - _Requirements: 7.1, 7.2, 7.4_
  - _Files: app/labs/practice-basics/page.tsx, components/StatusIndicator.tsx_
  - _Effort: M, Dependencies: Status contracts, Risks: State synchronization_

- [ ] 9. Create comprehensive educational guide content with practical examples
  - Write complete `docs/guides/fundamentals.md` with prompt engineering basics, common mistakes, and 3+ practical examples
  - Write complete `docs/guides/chain-of-thought.md` with step-by-step reasoning techniques, before/after examples, and practice scenarios
  - Write complete `docs/guides/system-prompts.md` with role setting, context examples, and persona techniques
  - Add tip callouts (💡 Tip:) and example callouts (📝 Example:) using Markdown extensibility
  - Include "Try this in a Lab" CTAs with specific starter prompts that demonstrate each concept
  - _Requirements: 6.1, 6.2, 1.2, 10.1, 10.2_
  - _Files: docs/guides/fundamentals.md, docs/guides/chain-of-thought.md, docs/guides/system-prompts.md_
  - _Effort: L, Dependencies: None, Risks: Content quality and educational effectiveness_

- [ ] 10. Implement complete guide-to-lab learning flow with authentic practice
  - Update guide CTA links to pass context (guide slug, example prompt) to labs with URL parameters
  - Modify lab pages to accept and prefill context from guide CTAs with clear "From Guide: [concept]" indicators
  - Add multiple starter prompt scaffolds in labs for different skill levels (beginner, intermediate)
  - Ensure real model interaction by testing both local fallback and external API responses
  - Add "Back to Guide" links in labs to reinforce the learning connection
  - Verify that practice feels authentic with meaningful model responses, not just dummy data
  - _Requirements: 1.3, 6.3, 6.4, 6.5_
  - _Files: app/guides/[slug]/page.tsx, app/labs/practice-basics/page.tsx, app/labs/compare-basics/page.tsx, lib/models/providers.ts_
  - _Effort: M, Dependencies: Guide content, model providers, Risks: Model response quality_

- [ ] 11. Update rubric content and implement versioning
  - Update `docs/rubric.md` with detailed v1.0 criteria definitions
  - Implement rubric version pinning in evaluation logic
  - Update evaluator to use versioned rubric criteria with constructive language
  - Ensure feedback generation uses beginner-friendly, encouraging tone
  - _Requirements: 2.1, 2.2, 2.4, 11.1_
  - _Files: docs/rubric.md, lib/evaluator.ts_
  - _Effort: M, Dependencies: None, Risks: Evaluation consistency_

## Sprint 2: Polish (2-3 Days)

- [ ] 12. Create comprehensive progress tracking with motivation mechanics
  - Create `app/progress/page.tsx` with visual progress bars for guide completion and lab mastery
  - Implement progress calculation based on guide reading time, lab submissions, and improvement over attempts
  - Add unlockable example prompts that become available after completing related guides and labs
  - Add optional streak badges for consecutive days of practice (dismissible with user preference)
  - Track learning journey with "Next recommended" suggestions based on completed content
  - Add celebration moments for milestones (first successful submission, first improvement, etc.)
  - Include learning analytics: time spent, concepts mastered, areas for improvement
  - _Requirements: 1.5, 1.6, 12.1, 12.2, 12.3, 12.4, 12.5_
  - _Files: app/progress/page.tsx, lib/progress.ts, components/ProgressBar.tsx, components/UnlockableContent.tsx_
  - _Effort: L, Dependencies: Global nav, guide/lab completion tracking, Risks: Motivation feature complexity_

- [ ] 13. Implement polished guide layout with Markdown extensibility
  - Update guide rendering to support tip/example callouts with consistent styling
  - Add proper heading hierarchy and semantic markup for accessibility
  - Implement linkable sections with anchor navigation
  - Apply design tokens for consistent typography and spacing
  - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - _Files: app/guides/[slug]/page.tsx, styles/guide-layout.css_
  - _Effort: M, Dependencies: Design tokens, Risks: Markdown parsing complexity_

- [ ] 14. Add comprehensive accessibility compliance
  - Implement visible focus rings on all interactive elements using design tokens
  - Verify 4.5:1 contrast ratio compliance across all UI components
  - Add ARIA labels and semantic markup for screen reader compatibility
  - Test keyboard navigation paths and 200% zoom functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - _Files: styles/tokens.ts, components/*.tsx, app/globals.css_
  - _Effort: M, Dependencies: Design tokens, Risks: Accessibility testing complexity_

- [ ] 15. Write comprehensive test suite for new functionality
  - Create schema validation tests for v1.0 attempt and evaluation schemas
  - Add state transition tests for all six status states and error scenarios
  - Implement accessibility tests for keyboard navigation and focus management
  - Add integration tests for guide-to-lab context passing and progress tracking
  - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - _Files: lib/__tests__/schemas.test.ts, lib/__tests__/state-transitions.test.ts, lib/__tests__/accessibility.test.ts, lib/__tests__/guide-lab-integration.test.ts_
  - _Effort: L, Dependencies: All core functionality, Risks: Test coverage gaps_

- [ ] 16. Validate complete beginner learning experience end-to-end
  - Test full learning flow: Guide reading → CTA click → Lab prefill → Submit → Feedback → Resubmit → Progress tracking
  - Verify that each guide provides sufficient educational value with real examples and practical tips
  - Ensure labs feel authentic with meaningful model responses and constructive feedback
  - Validate that feedback consistently links back to relevant guide sections for reinforcement
  - Test that progress tracking accurately reflects learning journey and provides motivation
  - Verify cognitive load reduction through starter prompts, clear progression, and helpful guidance
  - _Requirements: 1.1-1.6, 2.1-2.6, 6.1-6.5, 10.1-10.4, 11.1-11.4, 12.1-12.5_
  - _Files: All guide, lab, and component files_
  - _Effort: M, Dependencies: All previous tasks, Risks: Learning experience gaps_

- [ ] 17. Implement first-time learner onboarding flow
  - Add "Start Here" indicator on homepage pointing to first guide with clear visual prominence
  - Create optional guided tooltip walkthrough for key interface elements (dismissible)
  - Implement localStorage to remember onboarding completion and user preferences
  - Add gentle introduction text explaining the Learn → Practice → Progress flow
  - _Requirements: 13.1, 13.2, 13.3, 13.4_
  - _Files: app/page.tsx, components/OnboardingTooltips.tsx, lib/onboarding.ts_
  - _Effort: M, Dependencies: Global nav, Risks: User experience complexity_

- [ ] 18. Add lightweight attempt history and progress reflection
  - Create attempt history storage in localStorage with size limits
  - Add "View History" section in Progress page showing past attempts with scores
  - Implement comparison view showing improvement over time with visual indicators
  - Add "Revisit" functionality to reload past attempts for review and learning
  - _Requirements: 14.1, 14.2, 14.3, 14.4_
  - _Files: lib/history.ts, app/progress/page.tsx, components/HistoryView.tsx_
  - _Effort: M, Dependencies: Progress tracking, Risks: Storage management_

- [ ] 19. Enhance feedback with example strong prompts
  - Create curated library of example strong prompts for different concepts
  - Add "See Example" section in feedback panel with relevant strong prompt examples
  - Include explanations of why example prompts are effective with highlighted techniques
  - Implement variety in examples to show different approaches and styles
  - _Requirements: 15.1, 15.2, 15.3, 15.4_
  - _Files: data/examples/strong-prompts.json, components/FeedbackPanel.tsx, lib/examples.ts_
  - _Effort: M, Dependencies: Feedback panel, guide content, Risks: Example quality and relevance_

- [ ] 20. Implement comprehensive error handling and fallback strategies
  - Add retry mechanisms for failed model loads with progressively smaller models
  - Implement detailed progress indicators with estimated time remaining for model loading
  - Create read-only demo mode with pre-generated responses when WebGPU unavailable
  - Add clear error messages with specific next steps and alternative options
  - Implement graceful degradation that maintains educational value even in fallback modes
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  - _Files: lib/models/webgpuModel.ts, components/ErrorFallback.tsx, lib/fallbackResponses.ts_
  - _Effort: M, Dependencies: Browser LLM implementation, Risks: Fallback experience quality_

- [ ] 21. Ensure mobile-responsive design and touch optimization
  - Update all layouts to be responsive with mobile-first approach using design tokens
  - Optimize touch targets to meet minimum 44px size requirements for accessibility
  - Test and optimize text input areas for mobile keyboards and autocorrect
  - Verify model loading and inference performance on mobile browsers
  - Add mobile-specific optimizations for lab interfaces and feedback display
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_
  - _Files: styles/tokens.ts, app/globals.css, all component files_
  - _Effort: M, Dependencies: Design tokens, Risks: Mobile performance and compatibility_

- [ ] 22. Apply design tokens across all remaining components
  - Update all card components to use consistent styling from design tokens
  - Apply token-based spacing and colors to status indicators and badges
  - Ensure consistent button and input styling across all lab interfaces
  - Update error banners and loading spinners to use design system
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - _Files: components/ResultsCards.tsx, components/StatusIndicator.tsx, components/ScoreBadge.tsx, components/ErrorBanner.tsx, components/LoadingSpinner.tsx_
  - _Effort: S, Dependencies: Design tokens, Risks: Visual consistency_

## File Change Plan

### New Files to Create
- `lib/models/webgpuModel.ts` - Browser-based LLM using WebLLM/transformers.js
- `components/OnboardingModal.tsx` - Lab onboarding with progress bar
- `components/OnboardingTooltips.tsx` - First-time user guided walkthrough
- `components/ProgressBar.tsx` - Model loading progress indicator
- `components/UnlockableContent.tsx` - Motivation mechanics component
- `components/HistoryView.tsx` - Attempt history and progress reflection
- `components/ErrorFallback.tsx` - Comprehensive error handling UI
- `lib/onboarding.ts` - Onboarding state management
- `lib/history.ts` - Attempt history utilities
- `lib/examples.ts` - Strong prompt examples management
- `lib/fallbackResponses.ts` - Pre-generated responses for offline mode
- `data/examples/strong-prompts.json` - Curated example prompts library
- `schemas/attempt.schema.json` - v1.0 attempt schema with enhanced fields
- `schemas/evaluation.schema.json` - v1.0 evaluation schema with error contracts
- `types/contracts.ts` - Shared enums and interfaces
- `styles/tokens.ts` - Design token system
- `components/GlobalNav.tsx` - Persistent navigation component
- `components/LabStepHeader.tsx` - Lab progression indicator
- `components/FeedbackPanel.tsx` - Constructive feedback display
- `lib/idempotency.ts` - Idempotency ledger management
- `lib/progress.ts` - Progress tracking utilities
- `app/progress/page.tsx` - Progress tracking page
- `styles/guide-layout.css` - Guide-specific styling
- `data/.idempotency.json` - Idempotency ledger file

### Files to Update
- `types/index.ts` - Update interfaces to match v1.0 schemas
- `app/layout.tsx` - Add global navigation
- `app/labs/practice-basics/page.tsx` - Add step header, render all states, context handling
- `app/labs/compare-basics/page.tsx` - Add step header, context handling
- `app/guides/[slug]/page.tsx` - Add CTA functionality, polished layout
- `docs/guides/fundamentals.md` - Real content with CTAs
- `docs/guides/chain-of-thought.md` - Real content with CTAs
- `docs/guides/system-prompts.md` - Real content with CTAs
- `docs/rubric.md` - v1.0 rubric with constructive language
- `lib/evaluator.ts` - Rubric versioning, constructive feedback
- `.kiro/hooks/onAttemptCreated.ts` - Idempotency integration
- All component files - Apply design tokens

### API Enhancements
- Update all endpoints to use v1.0 schemas
- Enhance error responses with structured ErrorContract
- Add partial results handling in evaluation endpoints

## Testing Plan

### Unit Tests
- **Schema Validators**: Test v1.0 schema compliance and backward compatibility
- **Status Transitions**: Verify all six status states and error scenarios
- **Idempotency Manager**: Test lock/unlock mechanisms and concurrent access
- **Progress Tracking**: Validate completion calculations and milestone detection

### Integration Tests
- **Guide-Lab Flow**: Test CTA → Lab prefill → Submit → Feedback cycle
- **Error Propagation**: Verify ErrorContract propagation through UI layers
- **Accessibility Paths**: Test keyboard navigation and screen reader compatibility
- **State Synchronization**: Test status updates and partial results rendering

### Accessibility Tests
- **Keyboard Navigation**: Verify tab order and focus management
- **Focus Rings**: Test visibility and contrast of focus indicators
- **Color Contrast**: Validate 4.5:1 ratio across all UI elements
- **Screen Reader**: Test ARIA labels and semantic markup
- **Zoom Functionality**: Verify 200% zoom usability

## Rollout & Safeguards

### Backward Compatibility
- v1.0 schemas include all v0.x fields for seamless migration
- Local model fallback continues to work without API dependencies
- Existing attempt/evaluation files remain readable
- Progressive enhancement approach for new features

### Feature Flags
- `ENABLE_PROGRESS_TRACKING` - Toggle progress page and badges
- `ENABLE_MOTIVATION_FEATURES` - Toggle streaks and achievements
- `STRICT_SCHEMA_VALIDATION` - Toggle v1.0 schema enforcement

### Success Metrics
- **Guide Completion Rate**: Percentage of users who complete reading guides
- **Lab Submission Completion**: Percentage of submissions that complete successfully
- **Resubmit Usage**: Frequency of resubmit button usage indicating iterative learning
- **Time-to-Feedback**: Average time from submission to feedback display
- **Onboarding Completion**: Percentage of first-time users who complete the guided walkthrough
- **History Engagement**: Frequency of users revisiting past attempts for learning
- **Mobile Usage**: Percentage of successful interactions on mobile devices
- **Model Loading Success**: Percentage of successful browser model loads vs fallback usage
- **Accessibility Compliance**: Automated accessibility audit scores
- **Error Recovery Rate**: Percentage of failed submissions that successfully retry

### Risk Mitigation
- **Schema Migration**: Gradual rollout with fallback to v0.x schemas
- **Performance Impact**: Monitor file I/O performance with idempotency ledger
- **Content Quality**: Peer review of guide content for accuracy and tone
- **Accessibility Regression**: Automated testing in CI/CD pipeline