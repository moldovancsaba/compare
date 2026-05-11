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
- `npm run typecheck`
- `npm run build`
- `npm audit --omit=dev`

## Automation evidence
Recurring Codex heartbeat runs must also update shared memory when they create issues, choose priorities, implement changes, hit blockers, or push verified changes. The dedicated conversation should remain `specdiff-autonomous-maintenance` so the operational history stays together.
