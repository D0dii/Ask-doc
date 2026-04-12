---
name: pre-edit
description: Run before any file edit to check for guardrails
trigger: pre-edit
---

# Pre-Edit Hook

Before editing any file, check:

**1. Generated files — BLOCK if attempting to edit:**
- `frontend/src/client/**`
- `frontend/src/routeTree.gen.ts`
- Any `.gen.ts` or `.gen.d.ts` files

If trying to edit a generated file:
- STOP
- Instead, regenerate using: `pnpm --filter ./frontend openapi-ts`
- Then update the usages in feature code, not the generated output

**2. Secrets guard — BLOCK if editing contains:**
- Real API keys, tokens, secrets
- `.env` file contents
- Hardcoded credentials

**3. Migration check — WARN if editing:**
- `backend/src/**/*.entity.ts`
- Database schema changes

If warn: note that TypeORM uses `synchronize: true` locally; migrations would be needed for production.

---

If any block applies, do not proceed with edit — explain the issue and suggest correct approach.