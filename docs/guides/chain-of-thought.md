# Chain-of-Thought Prompting

Chain-of-thought prompting is a powerful technique that encourages AI models to show their reasoning process step-by-step. Instead of jumping directly to an answer, the AI "thinks out loud," leading to more accurate and explainable results.

## What is Chain-of-Thought?

Chain-of-thought prompting asks the AI to break down complex problems into smaller steps and show its work. This technique is especially effective for:
- Mathematical problems
- Logical reasoning
- Multi-step analysis
- Complex decision-making

## Why It Works

When AI models show their reasoning process, they:
- Make fewer logical errors
- Provide more accurate answers
- Allow you to verify their thinking
- Handle complex problems more systematically

## Basic Technique

The simplest way to trigger chain-of-thought reasoning is to add "Let's think step by step" or "Show your work" to your prompt.

📝 **Example - Basic Chain-of-Thought:**

**Without CoT:** "What's 15% of 240?"
**With CoT:** "What's 15% of 240? Let's think step by step."

**Response with CoT:**
"Let me calculate 15% of 240 step by step:
1. Convert 15% to decimal: 15% = 0.15
2. Multiply: 240 × 0.15 = 36
Therefore, 15% of 240 is 36."

## Advanced Techniques

### 1. Explicit Step Requests

Ask the AI to break down the problem into specific steps.

📝 **Example - Explicit Steps:**

**Prompt:** "I want to start a small online business selling handmade jewelry. Walk me through the key steps I need to take, explaining the reasoning behind each step."

**Why it works:** Requests both the steps and the reasoning, leading to more thoughtful advice.

### 2. Before/After Comparisons

Show examples of reasoning to guide the AI's approach.

📝 **Example - Guided Reasoning:**

**Prompt:** "Analyze this marketing email for effectiveness. Think through each element systematically:

Email: 'HUGE SALE!!! Buy now or miss out forever! Click here!'

Please evaluate:
1. Subject line effectiveness
2. Message clarity
3. Call-to-action strength
4. Overall tone and professionalism
5. Likely audience response

For each point, explain your reasoning."

### 3. Multi-Perspective Analysis

Ask the AI to consider different viewpoints or approaches.

📝 **Example - Multiple Perspectives:**

**Prompt:** "A company is deciding whether to allow permanent remote work. Analyze this decision from three perspectives: employee satisfaction, company productivity, and long-term costs. For each perspective, list the main considerations and explain your reasoning."

## Common Applications

### Problem Solving
**Prompt:** "My houseplant's leaves are turning yellow and dropping. Help me diagnose the problem by thinking through the possible causes step by step, starting with the most common issues."

### Decision Making
**Prompt:** "I'm choosing between two job offers. Help me create a decision framework by walking through the key factors I should consider and how to weigh them."

### Learning and Explanation
**Prompt:** "Explain how photosynthesis works by breaking it down into the main stages. For each stage, describe what happens and why it's important for the overall process."

## Before and After Examples

### Example 1: Math Problem

**Before (Direct):**
"If a recipe serves 4 people and calls for 2 cups of flour, how much flour do I need for 10 people?"

**After (Chain-of-Thought):**
"If a recipe serves 4 people and calls for 2 cups of flour, how much flour do I need for 10 people? Please show your calculation step by step."

**Better Response:** The AI will show the ratio calculation (10÷4 = 2.5) and multiplication (2 cups × 2.5 = 5 cups) instead of just giving "5 cups."

### Example 2: Analysis Task

**Before (Direct):**
"Is this a good investment opportunity?"

**After (Chain-of-Thought):**
"Analyze whether this is a good investment opportunity by evaluating it step by step. Consider: market potential, competition, financial projections, risks, and management team. For each factor, explain your assessment and reasoning."

**Better Response:** The AI will systematically evaluate each factor instead of giving a vague yes/no answer.

## Practice Scenarios

### Scenario 1: Troubleshooting
"My computer is running very slowly. Help me troubleshoot this issue by thinking through the most likely causes in order of probability, and suggest how to test each one."

### Scenario 2: Planning
"I want to learn Spanish in 6 months for a trip to Mexico. Create a learning plan by thinking through: my current level, available time, learning methods, milestones, and how to measure progress."

### Scenario 3: Creative Problem Solving
"I need to organize a team-building event for 20 people with a $500 budget. Think through this challenge step by step: budget breakdown, activity options, logistics, and how to ensure everyone enjoys it."

## Tips for Better Chain-of-Thought Prompts

💡 **Tip 1:** Be specific about what kind of reasoning you want. Instead of "explain your thinking," try "walk through your decision-making process" or "show the logical steps."

💡 **Tip 2:** For complex problems, break them into phases: "First, identify the key issues. Then, analyze each issue. Finally, recommend solutions."

💡 **Tip 3:** Ask for reasoning validation: "After reaching your conclusion, double-check your logic and identify any potential flaws in your reasoning."

💡 **Tip 4:** Use reasoning templates: "Use the following framework: Problem → Analysis → Options → Evaluation → Recommendation."

## Try This in a Lab

Ready to practice chain-of-thought prompting? Head to our [Practice Lab](/labs/practice-basics) and try these prompts:

**Beginner:** "I'm trying to decide whether to buy or lease a car. Walk me through the key factors I should consider step by step."

**Intermediate:** "A local restaurant has seen a 30% drop in customers over the past 3 months. Analyze the possible causes systematically and suggest solutions for each potential cause."

**Advanced:** "Design a morning routine that maximizes productivity and well-being. Think through this systematically: current research on habits, individual factors to consider, implementation challenges, and how to measure success."

## Common Mistakes to Avoid

### 1. Forgetting to Ask for Steps
**Problem:** "Solve this complex problem" (AI jumps to conclusion)
**Solution:** "Solve this complex problem by breaking it down into clear steps"

### 2. Being Too Vague About Reasoning
**Problem:** "Explain your thinking"
**Solution:** "Walk through your decision-making process, explaining why you chose each step"

### 3. Not Providing Enough Context
**Problem:** "Think step by step about this situation" (without describing the situation clearly)
**Solution:** Provide full context before asking for step-by-step analysis

## Next Steps

Master chain-of-thought prompting and explore related techniques:
- [Fundamentals](/guides/fundamentals) - Review the basics of clear prompting
- [System Prompts](/guides/system-prompts) - Learn to set up AI roles and personas

💡 **Remember:** Chain-of-thought prompting works best when you give the AI permission to think slowly and show its work. Don't rush to the answer—the reasoning process is often as valuable as the final result.
