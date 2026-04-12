# Frontend Rules (React + Vite)

## Scope
Applies to files under `frontend/`.

## Architecture rules
- Keep code organized by feature (`features/*`) and route composition (`routes/*`).
- Prefer colocated API helpers per feature when extending data access.
- Reuse existing UI primitives in `src/components/ui/` before adding new ones.
- Keep page files thin — compose route-specific components, don't pack large JSX trees in page files.
- Route-specific code (components, hooks, utils used by only one route) goes inside the route folder.
- Shared code used by 2+ routes goes in top-level directories: `components/`, `features/`, `lib/`.

## Component conventions
- Prefer kebab-case filenames for component files (for example `workspace-card.tsx`).
- Prefer named exports with arrow functions for components and helpers.
- Do not explicitly type the return type (no `: JSX.Element` or `React.FC`).
- For props with up to 4 fields, inline the type in the function signature.
- For props with 5+ fields, extract an in-file `Props` interface/type (not a separate file).
- Keep components small and focused on a single responsibility.
- Extract sections into separate components when JSX grows beyond ~50 lines or has its own state/logic.

```tsx
// Good — inline props, arrow function, no return type
export const WorkspaceCard = ({ name, files }: { name: string; files: number }) => {
  return <div>{name} — {files} files</div>
}

// Good — complex props extracted to interface
interface ChatPanelProps {
  messages: Message[]
  workspaceId: string
  onSend: (text: string) => void
  isLoading: boolean
}

export const ChatPanel = ({ messages, workspaceId, onSend, isLoading }: ChatPanelProps) => { ... }
```

## Performance defaults
- Do not add `useMemo` or `useCallback` unless there is a clearly measured performance problem.
- Do not add `React.memo` as a default optimization.
- Prefer fixing state ownership/render boundaries before memoization.

## Data fetching and routing
- Use TanStack Query patterns already present in feature API modules.
- Respect TanStack Router route boundaries and route file conventions.
- Maintain auth/session behavior from `auth-provider` and API interceptor flow.

## Styling
- Use Tailwind CSS utility classes.
- Avoid custom CSS unless absolutely necessary.

## UI Components
- Use existing UI primitives in `src/components/ui/` (Radix-based).
- Do not create custom components for things already provided by Radix primitives.

## Generated assets
- Do not manually edit:
  - `frontend/src/client/**`
  - `frontend/src/routeTree.gen.ts`
- Regenerate OpenAPI client with `pnpm --filter ./frontend openapi-ts` when API contracts change.

## Validation commands
- Lint frontend: `pnpm --filter ./frontend lint`
- Build frontend: `pnpm --filter ./frontend build`