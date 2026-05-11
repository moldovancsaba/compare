# AI Verification Protocol

Every implementation report must state only what was actually executed in the current session.

## Required evidence categories
- Files created or updated
- Commands executed
- Commands not executed
- Verification results
- Outstanding blockers

## Current mandatory gates
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm audit --omit=dev`
