# Product Overview

The Prompt Practice App is a beginner-friendly educational platform for learning prompt engineering concepts through interactive content. Built as a hackathon MVP with strong Kiro hook integration.

## Core Features
- **Guides** (📚 Learn): 5 markdown-based educational guides explaining prompt engineering concepts
  - Fundamentals, Chain-of-Thought, Chaining, System Prompts, Prompt Injection
- **Labs** (🧪 Practice): Interactive practice environments with automated evaluation
  - Practice Lab: Single model testing with feedback
  - Compare Lab: Multi-model side-by-side comparison
  - System Prompt Lab: Placeholder for future functionality (clearly marked)
- **Local-first**: Runs offline with deterministic stubs, enhanced with Hugging Face API when available

## Model Integration Strategy
- **Primary**: Hugging Face Inference API (Llama 3.1 8B, Mistral 7B) with 256-512 token caps
- **Fallback**: LocalModel deterministic stubs (always available)
- **Source badges**: ✨ Hosted, 📦 Sample, 💻 Local (future)

## Evaluation System
- **Simple rubric**: Clarity + Completeness scoring (0-5 each, 0-10 total)
- **Automated pipeline**: Kiro hooks process attempts → evaluation → results
- **File-based storage**: JSON artifacts in `data/attempts/` and `data/evaluations/`

## Target Audience
Beginners learning prompt engineering who want hands-on practice with immediate feedback and clear learning progression.