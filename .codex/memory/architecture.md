# {compare} Codex Runtime Architecture

## Core Decision
{compare} uses Codex as the orchestration layer. GitHub is source control, issue tracking, PR review, and project state. GitHub Actions may exist as a quality gate, but it is not the autonomous orchestration layer.

## Runtime Shape
```text
Codex Runtime
|
|-- heartbeat scheduler
|-- automation agents
|-- shared memory/state
|-- repo context
`-- GitHub integration
    |-- Issues
    |-- Project Board
    |-- PRs
    `-- Commits
```

## Dedicated Conversation
All recurring {compare} heartbeat runs should use the same dedicated conversation:

`compare-autonomous-maintenance`

This keeps memory, decisions, blockers, and implementation context in one continuous thread instead of scattering operational state across separate chats.

## Heartbeat Chain
The chain runs continuously on a 3-hour cadence:

1. Audit heartbeat at `T+0m`.
2. Planner heartbeat at `T+30m`.
3. Implementer heartbeat at `T+60m`.
4. Docs/release heartbeat at `T+120m`.

The stagger gives each agent a clean handoff window while preserving a compact loop.

## Consent Model
The product owner grants ongoing repository-maintenance consent for the heartbeat agents to operate without prompting for per-step approval. This applies to file edits, terminal commands, issue updates, commits, and pushes to `origin/main` within this repository.

The consent does not allow force pushes, deletion of production code, or pushing unverified changes. Normal verified commits to `origin/main` are allowed by explicit product-owner instruction.

## Product Boundaries
V1 remains mechanical watches only. The comparison engine should explain ownership consequences, not produce generic spec tables. Do not prematurely generalize into unrelated product categories until a documented expansion plan exists.

## Engineering Boundaries
- Keep the stack minimal: Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, and MongoDB/Mongoose only where it directly supports the product.
- Prefer deterministic comparison rules and explicit data over opaque generation.
- Keep changes issue-scoped.
- Update tests and documentation when behavior changes.
- Record blockers in shared memory instead of silently skipping them.

## GitHub Responsibilities
GitHub stores:
- Source history.
- Issues and labels.
- Project-board state.
- PR discussions and review.

Codex owns:
- Audit.
- Planning.
- Implementation.
- Documentation maintenance.
- Memory updates.
- Direct commit and push delivery to `origin/main`.
