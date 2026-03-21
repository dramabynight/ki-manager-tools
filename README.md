# KI Manager — Interactive Tools

Interactive tools built for the "KI für Design Thinking" course.
Each tool is a self-contained React component, designed to run as a Claude Artifact or as a standalone app.

## Tools

| Tool | Status | Description |
|------|--------|-------------|
| [lean-canvas](./lean-canvas/) | ✅ Ready | Interactive Lean Canvas with AI coaching mode |
| persona-test-bot | 🔜 Planned | AI persona simulator for prototype testing |
| interview-simulator | 🔜 Planned | Practice user interviews with AI |

## Design Conventions

- Font: Plus Jakarta Sans (Google Fonts)
- Color palette: warm off-white background, pastel field headers (terracotta, sage, dusty blue)
- Language: German (DE)
- All tools work both as Claude Artifacts and as standalone deployments

## Model

All tools use the constant `CLAUDE_MODEL` at the top of each file.
To update to a newer model, change that one line.
Current: `claude-sonnet-4-6`
