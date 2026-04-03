# Frontend Rules (React + Vite)

## Scope
Applies to files under `frontend/`.

## Architecture rules
- Keep code organized by feature (`features/*`) and route composition (`routes/*`).
- Prefer colocated API helpers per feature when extending data access.
- Reuse existing UI primitives in `src/components/ui/` before adding new ones.

## Component conventions
- Prefer kebab-case filenames for component files (for example `workspace-card.tsx`).
- Prefer named exports with arrow functions for components and helpers.
- For props with up to 4 fields, inline the type in the function signature.
- For props with 5+ fields, extract an in-file `Props` interface/type.
- Keep components small and focused; split sections when JSX grows beyond ~50 lines.

## Performance defaults
- Do not add `useMemo` or `useCallback` without a measured bottleneck.
- Do not add `React.memo` as a default optimization.
- Prefer fixing state ownership/render boundaries before memoization.

## Data fetching and routing
- Use TanStack Query patterns already present in feature API modules.
- Respect TanStack Router route boundaries and route file conventions.
- Maintain auth/session behavior from `auth-provider` and API interceptor flow.

## Styling and components
- Follow current Tailwind + utility composition patterns.
- Keep components focused and avoid over-abstracting one-off UI.
- Preserve responsive behavior for workspace and chat views.

## Generated assets
- Do not manually edit:
  - `frontend/src/client/**`
  - `frontend/src/routeTree.gen.ts`
- Regenerate OpenAPI client with `pnpm --filter ./frontend openapi-ts` when API contracts change.

## Validation commands
- Lint frontend: `pnpm --filter ./frontend lint`
- Build frontend: `pnpm --filter ./frontend build`
