---
name: task-complete
description: Run after each task completion to capture new learnings
trigger: post-task
---

# Task Complete Hook

After completing any task, reflect briefly:

**Did you discover any new patterns, mistakes, or decisions worth recording?**

- New code patterns specific to this repo
- Fixes for bugs that might recur
- Architectural decisions or trade-offs
- Edge cases handled
- Anything that would help future agents

If yes, append a brief entry to `.opencode/docs/agent-learning-log.md` using the template:

```
Date: YYYY-MM-DD
Area: frontend | backend | infra | tooling | process
Trigger: What task exposed the issue/pattern?
Mistake/Pattern: What was learned?
Impact: Why it matters for future work?
Prevention: One rule or check to apply going forward.
```

If no meaningful new learnings, do nothing.

**Note**: Do not log secrets, credentials, or `.env` contents. Keep entries concise (2-4 sentences max).