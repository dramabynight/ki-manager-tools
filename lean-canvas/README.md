# Lean Canvas — Interactive Tool

An interactive Lean Canvas with AI coaching mode, built for the "KI für Design Thinking" course.

## Features

- 9 Lean Canvas fields in correct grid layout
- Context switcher: Digital Product / Service / Non-Profit / Physical Product
- Help tooltips per field (explanation, guiding question, context-specific example)
- Guided Mode: AI coach opens a chat per field, asks questions, suggests formulations
- Auto-save via localStorage
- Export as text / Clear canvas

## How to use

### Option A — Claude Artifact (recommended for live demos)
1. Open claude.ai (Sonnet or higher)
2. Paste the full contents of `lean-canvas.jsx` and say: "Render this as an Artifact"
3. The tool runs immediately — no API key needed, no setup

### Option B — Standalone deployment (for sharing a URL)
See deployment notes below. Requires users to provide their own Claude API key.

## Files

- `lean-canvas.jsx` — the full component
- `CHANGELOG.md` — version history

## Model

Defined as `CLAUDE_MODEL` constant at the top of the file. Change it there to update.
