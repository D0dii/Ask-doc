# OpenCode Instructions for AskDoc

This file is the primary instruction set for coding agents working in this repository.

## Project Snapshot
- Product: AskDoc, a full-stack RAG app for asking questions about PDF documents.
- Monorepo: pnpm workspace with two packages: `backend` (NestJS) and `frontend` (React + Vite).
- Core flow: upload PDF -> ingest/chunk/embed -> index in Qdrant -> retrieve -> generate grounded answer with citations.

## Architecture
- Backend: NestJS 11, TypeORM, PostgreSQL, JWT cookie auth, Google OAuth, Qdrant vector search, AI SDK + Groq.
- Frontend: React 19, TanStack Router, TanStack Query, Tailwind CSS 4, Radix UI.
- Infra: `docker-compose.yml` provides PostgreSQL and Qdrant locally.

## Repo Layout
- `backend/`: API, auth, workspaces, files, ingestion, retrieval, chat.
- `frontend/`: SPA routes, feature modules, API client wrapper, generated OpenAPI client.
- `.opencode/rules/`: detailed coding rules.
- `.opencode/workflows/`: step-by-step execution playbooks.
- `.opencode/docs/`: extra project context and terminology.

## Commands You Will Need
- Install deps: `pnpm install`
- Start infra: `docker compose up -d`
- Run app (backend + frontend): `pnpm dev`
- Build all: `pnpm build`

### Backend commands
- Dev server: `pnpm --filter ./backend start:dev`
- Lint: `pnpm --filter ./backend lint`
- Test: `pnpm --filter ./backend test`
- Coverage: `pnpm --filter ./backend test:cov`

### Frontend commands
- Dev server: `pnpm --filter ./frontend dev`
- Lint: `pnpm --filter ./frontend lint`
- Build: `pnpm --filter ./frontend build`
- Regenerate OpenAPI client: `pnpm --filter ./frontend openapi-ts`

## Environment
- Required env files:
  - `backend/.env`
  - `frontend/.env`
- Backend defaults used in docs:
  - API: `http://localhost:3000`
  - Swagger: `http://localhost:3000/api`
- Frontend defaults:
  - App: `http://localhost:5173`
  - API base env var: `VITE_backend_url`

## High-Priority Agent Rules
- Keep edits scoped and minimal; avoid unrelated refactors.
- Prefer package-local conventions (backend style differs from frontend style).
- React/NestJS guidance is project-local in `.opencode/rules/frontend-rules.md` and `.opencode/rules/backend-rules.md`.
- Do not hand-edit generated files; regenerate instead.
- Never commit secrets, `.env` contents, or credentials.
- Validate with targeted lint/tests for changed package(s) before finalizing.
- After avoidable mistakes, append a short entry to `.opencode/docs/agent-learning-log.md`.

## Generated Files
- OpenAPI-generated frontend client lives under `frontend/src/client/`.
- Router tree file `frontend/src/routeTree.gen.ts` is generated.
- If API shapes change, regenerate generated assets instead of manual edits.

## Where To Read Next
- General coding rules: `.opencode/rules/coding-standards.md`
- Backend specifics: `.opencode/rules/backend-rules.md`
- Frontend specifics: `.opencode/rules/frontend-rules.md`
- Testing/validation: `.opencode/rules/testing-rules.md`
- Security constraints: `.opencode/rules/security-rules.md`
- Delivery playbook: `.opencode/workflows/ship-feature.md`
- Learning log: `.opencode/docs/agent-learning-log.md`
