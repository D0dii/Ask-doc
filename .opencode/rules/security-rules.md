# Security Rules

## Secrets and credentials
- Never commit `.env` files, API keys, OAuth secrets, JWT secrets, or tokens.
- Redact sensitive values in logs, docs, and code examples.

## Auth and session handling
- Keep cookie-based authentication behavior intact unless explicitly changed.
- Do not disable auth guards to simplify development fixes.
- Preserve refresh-token and logout semantics when touching auth code.

## Data access boundaries
- Maintain per-user and per-workspace authorization checks.
- Preserve workspace scoping in document retrieval and chat query flows.

## External services
- Assume local services (PostgreSQL, Qdrant, Ollama) may be unavailable; fail clearly.
- Do not hardcode production endpoints or secrets in source files.

## Dependency and runtime safety
- Prefer minimal dependency additions.
- If adding dependencies, justify necessity in PR notes.
