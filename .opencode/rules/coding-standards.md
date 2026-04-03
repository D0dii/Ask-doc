# Coding Standards

## Core principles
- Make the smallest safe change that solves the request.
- Preserve existing architecture and naming unless change requires otherwise.
- Prefer explicit, readable code over clever abstractions.
- Keep module boundaries clear (no cross-feature leakage without reason).

## Monorepo conventions
- Use pnpm workspace commands with package filters when possible.
- Keep backend and frontend dependency changes isolated to their package.
- Do not move files between packages unless explicitly needed.

## Style and formatting
- Backend uses semicolons and single quotes in TypeScript files.
- Frontend uses double quotes and no semicolons in TypeScript/TSX files.
- Follow existing file-local style if it differs from general package style.
- Run lint for touched package(s) after significant edits.

## Imports and modules
- Keep imports grouped and sorted by existing local conventions.
- Prefer existing aliases in frontend (for example `@/...`) where used.
- Avoid introducing barrel exports unless there is clear local precedent.

## Refactoring expectations
- Avoid broad refactors in feature requests.
- If you must refactor, include only tightly related changes.
- Preserve public contracts unless the task asks for breaking changes.

## Generated code
- Never hand-edit generated files under `frontend/src/client/`.
- Regenerate generated code with existing scripts.

## Documentation updates
- If behavior or commands change, update relevant docs in same PR.
- Keep docs concise and actionable.
