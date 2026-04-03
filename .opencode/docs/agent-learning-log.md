# Agent Learning Log

Purpose: capture recurring mistakes, failed assumptions, and fixes so future agent runs avoid repeating them.

## How to use
- Add a new entry when a bug, failed command, or rework was caused by an avoidable mistake.
- Keep entries short and actionable.
- Focus on reusable lessons, not blame.
- Never include secrets, tokens, or raw `.env` values.

## Entry template

```
Date: YYYY-MM-DD
Area: backend | frontend | infra | tooling | process
Trigger: What request/task exposed the issue?
Mistake: What was done wrong?
Impact: What broke or what extra work happened?
Correction: What fixed it?
Prevention rule: One concrete rule to prevent repeat.
Verification: Which command/check confirmed the fix?
```

## Entries

Date: 2026-04-03
Area: process
Trigger: Initial OpenCode instruction scaffolding.
Mistake: No persistent place for captured agent mistakes and recovery patterns.
Impact: Lessons would stay in chat history and be easy to lose.
Correction: Added this file as a durable learning log in `.opencode/docs/`.
Prevention rule: After any avoidable issue, append a concise entry before finalizing work.
Verification: File exists and is referenced from instruction entrypoint.
