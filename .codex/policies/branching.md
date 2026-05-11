# Branching Policy

## Default Flow
1. Start from an up-to-date `main` when possible.
2. Make issue-scoped changes on `main`.
3. Run verification.
4. Commit with a concise message.
5. Push directly to `origin/main`.
6. Update the linked GitHub issue with the result.

## Optional Branch Escape Hatch
Use a branch only when a change is too risky to land directly or when push-to-main is blocked by repository permissions.

Suggested naming:
- `codex/<issue-number>-short-topic`

## Main Branch
`main` is the default autonomous delivery branch. Agents may commit and push directly to `origin/main` after local verification passes. Force pushes remain disallowed.
