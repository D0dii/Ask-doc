# Testing and Validation Rules

## Minimum validation standard
- Run validation steps for the package(s) you changed.
- Prefer targeted checks first, then broader checks if risk is higher.

## Backend changes
- Required: `pnpm --filter ./backend lint`
- Recommended: `pnpm --filter ./backend test`
- For high-risk logic changes (auth, retrieval, ingestion): run tests before finalizing.

## Frontend changes
- Required: `pnpm --filter ./frontend lint`
- Recommended: `pnpm --filter ./frontend build`

## Full-repo changes
- If both packages are affected, run:
  - `pnpm --filter ./backend lint`
  - `pnpm --filter ./frontend lint`
  - `pnpm build`

## Reporting expectations
- In final notes, state exactly which commands were run.
- If a command cannot be run, explain why and provide a clear verify step.
