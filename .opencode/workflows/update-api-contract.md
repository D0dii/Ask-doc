# Workflow: Update API Contract

Use this when backend endpoint DTOs or response shapes change.

## 1) Backend contract changes
- Update controller/service/DTO/entity logic in `backend/`.
- Keep Swagger docs accurate for changed endpoints.

## 2) Backend validation
- Run `pnpm --filter ./backend lint`
- Run `pnpm --filter ./backend test` for related modules when possible.

## 3) Regenerate frontend client
- Ensure backend is running and serving `http://localhost:3000/api-json`.
- Run `pnpm --filter ./frontend openapi-ts`.
- Avoid manual edits in `frontend/src/client/**`.

## 4) Frontend alignment
- Update feature API usage/types where compile errors or behavior changes appear.
- Run `pnpm --filter ./frontend lint`
- Run `pnpm --filter ./frontend build`

## 5) Final checks
- Confirm end-to-end call paths still function for changed endpoints.
- Document any required migration for API consumers.
