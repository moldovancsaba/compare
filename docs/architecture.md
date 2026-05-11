# SpecDiff Architecture

## Product Architecture
SpecDiff is a narrow V1 product for comparing mechanical watches by real ownership consequences. The user enters two supported watch names or product URLs, the app resolves them against a curated catalog, and the comparison engine returns deterministic sections for practical tradeoffs.

## Application Layers
- UI: Next.js App Router pages and React components in `src/app` and `src/components`.
- API: `/api/compare` applies basic per-client rate limiting, validates requests, resolves watches, blocks duplicate comparisons, and returns comparison output.
- Domain logic: `src/lib/services/compare-watches.ts` builds deterministic comparison sections.
- Data: `src/lib/data/watch-catalog.ts` is the V1 curated catalog.
- Persistence readiness: `src/lib/db.ts` and `src/lib/models/watch.ts` are scaffolding for future MongoDB-backed persistence.
- Tests: Vitest currently covers resolver basics, comparison output shape, and `/api/compare` route behavior.

## Automation Architecture
SpecDiff uses Codex as the autonomous orchestration layer. Heartbeats run continuously in the dedicated `specdiff-autonomous-maintenance` conversation and use GitHub for external project state.

The heartbeat chain is:
- Audit every 3 hours.
- Planner 30 minutes after audit.
- Implementer 60 minutes after audit.
- Docs/release 120 minutes after audit.

GitHub Actions are allowed as verification gates, but they are not the scheduler or primary orchestrator.

The active Codex app scheduler entry is `/Users/chappie/.codex/automations/specdiff-complete-audit/automation.toml`. It runs every 3 hours and executes the heartbeat responsibilities in one dedicated automation thread so context is not scattered across multiple chats.

## Invariants
- V1 scope is mechanical watches.
- Agents may commit and push verified changes directly to `origin/main` without per-step approval.
- Agents may not force push or delete production code autonomously.
- Shared memory must be updated after meaningful automation runs.

## Current High-Risk Areas
- Watch resolution is a trust-critical path and needs stronger ambiguity handling.
- Compare API rate limiting is currently in-memory per runtime instance; move it to shared infrastructure before scaled public traffic.
- Client error handling should cover network and malformed-response failures.
- Comparison output needs regression fixtures for stable product copy and section changes.
- Project board mutation depends on valid GitHub project tooling.
