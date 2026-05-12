# READMEDEV

## Objective
Build and maintain {compare} as a production-grade, domain-adapter comparison platform. The product standard is verdict-led, evidence-aware decision guidance with domain-specific reasoning kept inside adapters.

## Active Assignment
- GitHub Project 16 is the roadmap and task SSOT.
- Current release line: `v0.2.x`.
- Current live domains: mechanical watches and business services.
- Current watch-adapter depth includes collection profiles, gap/overlap analysis, upgrade-path intelligence, and balance scoring.

## Working Rules
1. Read this file before implementation.
2. Read `.codex/memory/architecture.md` before automation, planning, implementation, or docs work.
3. Keep platform code domain-neutral; domain-specific behavior belongs in adapters, domain data, and adapter-owned docs/tests.
4. Do not add dependencies unless they directly support the current issue and are justified by existing architecture.
5. Keep code, README, user manual, API docs, architecture docs, release notes, and version metadata synchronized in the same change set when behavior changes.
6. GitHub Project 16 remains the source of truth for roadmap items. Markdown roadmap files must not compete with it.
7. Codex heartbeats are the orchestration layer; GitHub Actions are verification gates, not the autonomous scheduler.
8. Autonomous agents may create commits, push verified changes directly to `origin/main`, update issues, and update docs without per-step approval. Force pushes remain disallowed.
9. If a future task depends on missing SSOT context or unavailable credentials, record the blocker in shared memory.

## Required Documents
- [README.md](./README.md)
- [docs/user-manual.md](./docs/user-manual.md)
- [docs/api.md](./docs/api.md)
- [docs/architecture.md](./docs/architecture.md)
- [docs/domain-adapters.md](./docs/domain-adapters.md)
- [docs/data-governance.md](./docs/data-governance.md)
- [docs/watch-collection-profiles.md](./docs/watch-collection-profiles.md)
- [docs/watch-consequence-rules.md](./docs/watch-consequence-rules.md)
- [10_Release_Notes.md](./10_Release_Notes.md)
- [design-tokens.md](./design-tokens.md)
- [.codex/memory/architecture.md](./.codex/memory/architecture.md)

## Current Architecture Snapshot
- Frontend: Next.js 16 App Router
- Styling: Tailwind CSS 4 with CSS-variable theming plus semantic UI primitives in `src/app/globals.css`
- Core contract: generic comparison entities/results in `src/types/comparison.ts`
- Adapter registry: `src/lib/services/compare.ts`
- Live adapters: watches and services
- API: `/api/compare`, `/api/compare/brain`, `/api/compare/feedback`
- Persistence: optional MongoDB Atlas through Mongoose
- UI composition: `comparison-form` orchestrator with separated hero, input, collection profile, and result components
- Tests: Vitest coverage for adapters, API behavior, comparison rules, collection intelligence, feedback, telemetry, and client parsing
- Automation: Codex heartbeat chain in `.codex/heartbeats`, sharing memory through `.codex/memory`

## Definition Of Ready For Any Future Task
- Existing docs and shared Codex memory are checked.
- Related GitHub Project 16 issue is reviewed.
- The implementation path preserves domain neutrality in shared platform code.
- Build, lint, typecheck, test, and audit gates are re-run after code changes.
