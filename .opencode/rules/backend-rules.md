# Backend Rules (NestJS)

## Scope

Applies to files under `backend/`.

## Architecture rules

- Keep feature modules separated (`auth`, `workspaces`, `documents`, `ingestion`, `retrieval`, `chat`).
- Put business logic in services; keep controllers thin.
- Add DTOs for request/response shape changes and validate with `class-validator`.
- Use guards for authorization and workspace access boundaries.

## Patterns for this repo

- Use NestJS module/controller/service structure (not server-action/service/repository layout).
- Prefer DTO + entity contracts over introducing a generic ActionResult wrapper.
- Use `class-validator`/`class-transformer` for runtime validation at API boundaries.
- Keep external integrations behind `shared/` abstractions when possible (LLM, vector store).

## Data and persistence

- TypeORM currently uses `synchronize: true` for local development.
- Do not introduce migration requirements unless task explicitly asks.
- Keep entity changes backward-compatible when possible.

## RAG pipeline safety

- Preserve workspace-level isolation in retrieval and query paths.
- Keep citation/source shape stable for frontend consumers unless coordinated updates are included.
- If changing prompts/constants, keep behavior deterministic and testable.

## API and contracts

- Keep Swagger/OpenAPI compatibility in mind for endpoint changes.
- If endpoint contract changes, ensure frontend client regeneration is documented or included.
- Maintain cookie-based auth flow; avoid token transport changes unless requested.

## Validation commands

- Lint backend: `pnpm --filter ./backend lint`
- Test backend: `pnpm --filter ./backend test`
