# Workflow: Ship a Feature

## 1) Understand and scope
- Read relevant feature/module files first.
- Identify affected package(s): `backend`, `frontend`, or both.
- Prefer minimal scope and preserve existing conventions.

## 2) Implement
- Make focused edits in the correct module/feature directories.
- Keep API contracts stable unless change is intentional.
- If backend contract changes, plan frontend update and client regeneration.

## 3) Regenerate generated assets (if needed)
- OpenAPI client: `pnpm --filter ./frontend openapi-ts`
- Router tree (when route files change): run frontend build/dev flow that regenerates route tree.

## 4) Validate
- Backend touched: `pnpm --filter ./backend lint` and ideally `pnpm --filter ./backend test`
- Frontend touched: `pnpm --filter ./frontend lint` and ideally `pnpm --filter ./frontend build`
- Cross-cutting changes: `pnpm build`

## 5) Finalize notes
- List changed files and key behavior changes.
- List validation commands run and results.
- Call out follow-up actions if any checks were skipped.
