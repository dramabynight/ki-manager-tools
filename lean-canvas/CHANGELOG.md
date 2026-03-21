# Changelog — Lean Canvas

## v1.2 — 2026-03-21
- Fixed: textarea focus lost after each keystroke (FieldCard moved to module level)
- Fixed: component re-mounting on every render ("rebuilding" feeling)
- Added: `USE_PROXY` config flag — `true` for standalone, `false` for Claude Artifact
- Added: `callClaude()` helper — single place to switch between direct API and proxy
- Added: Vite project setup for standalone deployment (package.json, vite.config.js, index.html)
- Added: Vercel serverless proxy at `api/chat.js`

## v1.1 — 2026-03-21
- Updated model to `claude-sonnet-4-6`
- Extracted model name into `CLAUDE_MODEL` constant (single place to update)
- Moved into `ki-manager-tools` repo

## v1.0 — 2026-03-06
- Initial version built as Claude Artifact
- 9 fields, 4 context types, guided AI coaching mode
- localStorage auto-save
- Participant iteration (participant worked on Julia's base version)
