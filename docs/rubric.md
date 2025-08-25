# Evaluation Rubric v1.0

This rubric provides the foundation for automated evaluation in the Prompt Practice App. It ensures consistent, educational, and constructive feedback for users learning prompt engineering.

## Evaluation Philosophy

### Core Principles
- **Educational**: Focus on teaching and improvement rather than criticism
- **Constructive**: Provide specific, actionable feedback
- **Encouraging**: Maintain a supportive tone that motivates continued learning
- **Beginner-friendly**: Assume users are new to prompt engineering
- **Concise**: Keep feedback brief but meaningful (max 1000 characters for notes)

### Language Guidelines
- Use positive, growth-oriented language
- Avoid technical jargon without explanation
- Provide specific examples when suggesting improvements
- Frame feedback as opportunities for enhancement
- Use "consider" and "try" rather than "should" or "must"

## Scoring Framework

### Scale Definition
All metrics use a 0-5 point scale:
- **5**: Excellent - Exceeds expectations
- **4**: Good - Meets expectations well
- **3**: Satisfactory - Meets basic expectations
- **2**: Needs improvement - Below expectations
- **1**: Poor - Significant issues
- **0**: Unacceptable - Major problems or no response

**Total Score**: Sum of Clarity + Completeness (0-10 points)

## Evaluation Criteria

### Clarity Metric (0-5 points)
Evaluates how clear, coherent, and well-structured the model's response is.

#### Scoring Criteria
- **5 - Excellent**: Response is exceptionally clear, well-organized, and easy to understand
  - Perfect logical flow and structure
  - Clear, accessible language throughout
  - Well-formatted with appropriate use of headings, lists, or examples
  
- **4 - Good**: Response is clear and well-structured with minor areas for improvement
  - Generally good organization and flow
  - Mostly clear language with occasional minor issues
  - Good use of formatting or structure
  
- **3 - Satisfactory**: Response is generally clear but may have some organizational issues
  - Basic clarity maintained but could be better organized
  - Some confusing sections or unclear explanations
  - Adequate but not optimal structure
  
- **2 - Needs Improvement**: Response has clarity issues that impact understanding
  - Significant organizational problems
  - Confusing language or explanations
  - Poor structure that hinders comprehension
  
- **1 - Poor**: Response is difficult to understand or poorly structured
  - Major clarity issues throughout
  - Very poor organization or flow
  - Language that significantly impedes understanding
  
- **0 - Unacceptable**: Response is incomprehensible or completely unclear
  - No discernible structure or logic
  - Incomprehensible language or content
  - Complete failure to communicate clearly

#### Common Issues to Flag
- Rambling or unfocused responses
- Poor grammar or sentence structure
- Lack of logical flow
- Ambiguous or confusing language
- Missing context or assumptions

### Completeness Metric (0-5 points)
Evaluates how thoroughly the model addresses the user's prompt and requirements.

#### Scoring Criteria
- **5 - Excellent**: Fully addresses all aspects of the prompt with comprehensive coverage
  - Every part of the prompt is thoroughly addressed
  - Provides comprehensive information and context
  - Goes beyond basic requirements with valuable additional insights
  
- **4 - Good**: Addresses most aspects well with minor gaps
  - Covers all major aspects of the prompt
  - Minor details may be missing but core content is complete
  - Good depth of information provided
  
- **3 - Satisfactory**: Covers the main points but may miss some details
  - Addresses the primary request adequately
  - Some secondary aspects may be overlooked
  - Sufficient information for basic understanding
  
- **2 - Needs Improvement**: Partially addresses the prompt with notable omissions
  - Significant gaps in coverage
  - Important aspects of the prompt are ignored
  - Insufficient depth or detail
  
- **1 - Poor**: Minimally addresses the prompt with significant gaps
  - Major portions of the prompt are unaddressed
  - Very limited information provided
  - Fails to meet basic requirements
  
- **0 - Unacceptable**: Fails to address the prompt or provides irrelevant content
  - Completely off-topic or irrelevant response
  - No attempt to address the actual prompt
  - Empty or non-responsive content

#### Common Issues to Flag
- Ignoring parts of multi-part questions
- Providing generic responses that don't match the specific request
- Missing key information or context
- Stopping mid-thought or providing incomplete answers
- Addressing the wrong topic entirely

## Feedback Generation Guidelines

### Notes Structure
Feedback notes should follow this structure:
1. **Positive observation** (what worked well)
2. **Specific improvement area** (what could be better)
3. **Actionable suggestion** (how to improve)

### Example Feedback Patterns

**Good Clarity, Needs Completeness:**
"Your response is well-structured and easy to follow. Consider addressing all parts of the question - you covered X well but could expand on Y. Try breaking complex prompts into sub-questions to ensure full coverage."

**Good Completeness, Needs Clarity:**
"You addressed all aspects of the prompt thoroughly. The response could be clearer with better organization. Try using bullet points or numbered lists for complex information."

**Both Need Improvement:**
"Consider refining your prompt to be more specific about what you want. The response covers some relevant points but could be clearer and more complete. Try asking for step-by-step explanations or specific examples."

**High Quality Response:**
"Excellent work! The response is both clear and comprehensive. This prompt effectively guides the model to provide structured, helpful information."

### Improvement Suggestions

#### For Clarity Issues
- "Try asking for step-by-step explanations"
- "Consider requesting examples or specific details"
- "Ask the model to organize information with headings or bullet points"
- "Be more specific about the format you want"

#### For Completeness Issues
- "Break complex questions into smaller parts"
- "Ask follow-up questions to cover all aspects"
- "Request comprehensive coverage of the topic"
- "Specify all the information you need upfront"

#### For Both Issues
- "Try providing more context in your prompt"
- "Consider using prompt templates or frameworks"
- "Ask the model to explain its reasoning"
- "Request both an overview and detailed explanation"

## Model-Specific Considerations

### Hosted Models (Hugging Face API)
- Expect higher quality responses from larger models
- Account for token limits in completeness scoring
- Consider model-specific strengths and weaknesses

### Sample/Local Models
- Apply more lenient scoring for deterministic stubs
- Focus feedback on prompt improvement rather than model limitations
- Clearly indicate when limitations are due to offline mode

## Error Handling in Evaluation

### Invalid or Empty Responses
- **Score**: Clarity 0, Completeness 0
- **Notes**: "The model didn't provide a valid response. Try rephrasing your prompt or checking for technical issues."

### Partial Responses (Token Limit)
- Adjust completeness scoring based on apparent truncation
- **Notes**: "Response appears cut off due to length limits. Try asking for a more concise answer or break into multiple prompts."

### Off-Topic Responses
- Score based on relevance to the actual prompt
- **Notes**: "The response doesn't address your prompt. Try being more specific about what you want."

## Quality Assurance

### Consistency Checks
- Ensure total score equals clarity + completeness
- Verify notes provide actionable feedback
- Check that scoring aligns with the rubric criteria
- Maintain consistent tone across all evaluations

### Edge Cases
- Handle prompts that ask for harmful content appropriately
- Manage responses that are technically correct but unhelpful
- Address cases where the prompt itself is unclear or problematic

## Integration with Learning Goals

### Beginner Users
- Emphasize fundamental prompt engineering concepts
- Provide gentle guidance toward best practices
- Celebrate small improvements and progress

### Progressive Learning
- Reference relevant guides when appropriate
- Suggest specific techniques covered in the educational content
- Connect feedback to broader prompt engineering principles

---

**Rubric Version**: 1.0  
**Last Updated**: February 2025  
**Schema Compatibility**: evaluation.schema.json v1.0
