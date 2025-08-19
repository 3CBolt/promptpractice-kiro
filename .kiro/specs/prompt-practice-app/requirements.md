# Requirements Document

## Introduction

The Prompt Practice App is a beginner-friendly educational platform for learning prompt engineering concepts through interactive Guides and Labs. The MVP must run locally with a LocalModel fallback (no API keys required) while maintaining the ability to add external model APIs later via environment variables.

## Requirements

### Requirement 1

**User Story:** As a beginner learning prompt engineering, I want to access educational guides that explain key concepts, so that I can understand the fundamentals before practicing.

#### Acceptance Criteria

1. WHEN I visit the home page THEN the system SHALL display a list of 5 available guides (fundamentals, chain-of-thought, chaining, system-prompts, prompt-injection)
2. WHEN I click on a guide THEN the system SHALL navigate to `/guides/[slug]` and render the markdown content from `/docs/guides/*.md`
3. WHEN the guide page loads THEN the system SHALL display the guide title and body content parsed from markdown

### Requirement 2

**User Story:** As a user wanting to practice prompt engineering, I want to access different types of labs, so that I can apply what I learned in the guides.

#### Acceptance Criteria

1. WHEN I visit the home page THEN the system SHALL display a list of 3 labs (Practice Lab, Compare Lab, System Prompt Lab placeholder)
2. WHEN I click on a lab THEN the system SHALL navigate to `/labs/[id]` with the appropriate lab type
3. WHEN the lab page loads THEN the system SHALL display the lab title, instructions, and appropriate input controls

### Requirement 3

**User Story:** As a user in a Practice Lab, I want to test my prompt against a single model and receive feedback, so that I can improve my prompting skills.

#### Acceptance Criteria

1. WHEN I am in the Practice Lab THEN the system SHALL display a User Prompt textarea, Models multi-select, and Run button
2. WHEN I select models THEN the system SHALL enforce exactly 1 model selection for Practice Lab
3. WHEN I click Run THEN the system SHALL execute the prompt against the first selected model only
4. WHEN the execution completes THEN the system SHALL display the output, score, breakdown, and improvement hints
5. WHEN I submit an attempt THEN the system SHALL write `data/attempts/{attemptId}.json` and trigger the Kiro hook

### Requirement 4

**User Story:** As a user in a Compare Lab, I want to test my prompt against multiple models simultaneously, so that I can compare their responses and performance.

#### Acceptance Criteria

1. WHEN I am in the Compare Lab THEN the system SHALL display User Prompt textarea, Models multi-select, and Run button
2. WHEN I select models THEN the system SHALL enforce 2-3 model selection for Compare Lab
3. WHEN I click Run THEN the system SHALL execute the prompt against all selected models
4. WHEN the execution completes THEN the system SHALL display side-by-side cards showing modelId, latencyMs, response text, and score breakdown for each model
5. WHEN I submit an attempt THEN the system SHALL write `data/attempts/{attemptId}.json` and trigger the Kiro hook

### Requirement 5

**User Story:** As a user, I want the app to work offline without requiring API keys, so that I can practice prompt engineering immediately without setup barriers.

#### Acceptance Criteria

1. WHEN I run any lab THEN the system SHALL use the LocalModel fallback that returns deterministic sample responses
2. WHEN the LocalModel is called THEN the system SHALL return a response without making external network calls
3. WHEN the app starts THEN the system SHALL work completely offline with no API key requirements
4. WHEN using LocalModel responses THEN the system SHALL display a 📦 Sample badge to indicate offline mode

### Requirement 6

**User Story:** As a user, I want my attempts to be automatically evaluated with scores and feedback, so that I can understand how to improve my prompts.

#### Acceptance Criteria

1. WHEN I submit a prompt THEN the system SHALL call the `/api/compare` endpoint with userPrompt, systemPrompt, and selected models
2. WHEN the API processes the request THEN the system SHALL return results with modelId, text, latencyMs, and usageTokens for each model
3. WHEN evaluation completes THEN the system SHALL provide score, breakdown (clarity, completeness), and notes based on the rubric
4. WHEN evaluation finishes THEN the system SHALL write `data/evaluations/{attemptId}.json` with the complete evaluation data
5. WHEN evaluation fails THEN the system SHALL write `data/evaluations/{attemptId}.error.json` and surface a Retry option in the UI

### Requirement 7

**User Story:** As a developer, I want the Kiro hook system to automatically process attempts, so that the evaluation workflow is seamless and demonstrable.

#### Acceptance Criteria

1. WHEN a file is created at `data/attempts/{attemptId}.json` THEN the Kiro hook SHALL automatically trigger
2. WHEN the hook runs THEN the system SHALL read the Attempt JSON, POST to `/api/compare`, and write the evaluation results
3. WHEN an evaluation already exists for an attempt THEN the hook SHALL not reprocess and SHALL log 'skipped'
4. WHEN the hook completes THEN the system SHALL log the evaluation completion with attemptId, labId, models, and latency
5. WHEN the evaluation file is written THEN the UI SHALL fetch and display the results

### Requirement 8

**User Story:** As a user accessing the System Prompt Lab, I want to see a placeholder for future functionality, so that I understand this feature is planned but not yet implemented.

#### Acceptance Criteria

1. WHEN I navigate to the System Prompt Lab THEN the system SHALL display a System Prompt textarea (visible by default)
2. WHEN I view the System Prompt Lab THEN the system SHALL clearly label it as "Stretch – placeholder"
3. WHEN the System Prompt Lab loads THEN the system SHALL set `isPlaceholder: true` in the lab config for code/UI distinction
4. WHEN I interact with the System Prompt Lab THEN the system SHALL provide basic UI elements but indicate limited functionality

### Requirement 9

**User Story:** As a user, I want clear error and status feedback, so that I understand what's happening when evaluations run or fail.

#### Acceptance Criteria

1. WHEN evaluation is running THEN the system SHALL display "Evaluating…" with spinner
2. WHEN evaluation completes THEN the system SHALL display results with scores and breakdown
3. WHEN evaluation fails THEN the system SHALL display a dismissible error message and a Retry button
4. WHEN network or quota limits are hit THEN the system SHALL automatically fallback to LocalModel with clear indication
5. WHEN using fallback mode THEN the system SHALL display appropriate source badges (✨ Hosted, 📦 Sample, 💻 Local)