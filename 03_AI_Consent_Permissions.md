# AI Consent Permissions

The PO has granted repository-wide permission to create, modify, and delete files within this project and to execute destructive cleanup required for setup.

## Current interpretation
- Repository contents were deliberately removed before scaffolding the new app.
- Future code and documentation changes may be performed autonomously inside this repository unless the PO revokes that consent.
- Git push, tagging, and Vercel deployment still require actual execution before they can be claimed as complete.

## Codex heartbeat consent
- Codex is the orchestration layer for audit, planning, implementation, and documentation heartbeats.
- The PO grants ongoing consent for recurring Codex heartbeats to run continuously every 3 hours in the dedicated `specdiff-autonomous-maintenance` conversation.
- Heartbeats should not ask for per-step approval for normal repository maintenance, including local commands, file edits, GitHub issue updates, commits, and pushes to `origin/main`.
- This consent allows autonomous direct pushes to `origin/main` after verification passes.
- This consent does not allow force pushes, production-code deletion, or unverified release/deployment claims.
