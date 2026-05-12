# {compare} Architecture

## Product Architecture
{compare} is a domain-based comparison system. The live V1 adapter compares mechanical watches by real ownership consequences, but the foundation is no longer watch-shaped: inputs resolve to generic comparison entities, domain adapters own product/service/category-specific resolution, and the API/UI consume a shared comparison result contract.

## Application Layers
- UI: Next.js App Router pages and React components in `src/app` and `src/components`, including shareable saved comparison pages at `/compare/[slug]`.
- API: `/api/compare` applies basic per-client rate limiting, validates requests, delegates resolution/comparison to a domain adapter, rejects unresolved inputs with supported examples, blocks duplicate entities, and returns comparison output.
- Comparison core: `src/types/comparison.ts` and `src/lib/services/compare.ts` define the generic entity/result contract and adapter registry.
- Domain logic: `src/lib/domains/watch-domain.ts` is the first adapter; `src/lib/services/compare-watches.ts` remains the watch-specific deterministic rule engine behind that adapter.
- Data: `src/lib/data/watch-catalog.ts` is the V1 curated watch catalog. Future domains should add their own adapter and source data instead of adding category conditionals to the API or UI shell.
- Persistence: `src/lib/db.ts` connects to optional MongoDB Atlas. Submitted deterministic comparisons are best-effort upserted to `saved_comparisons` with generic entity/domain fields plus legacy watch IDs for compatibility, Brain jobs use `compare_jobs` and `comparison_traces`, feedback uses `comparison_feedback`, and telemetry uses `analytics_events`.
- Observability: `src/lib/observability/logger.ts` emits structured JSON events with redaction for user inputs, URLs/URIs, notes, credentials, authorization-like fields, and raw error messages. `src/lib/observability/telemetry.ts` optionally records durable allowlisted analytics events in MongoDB when Atlas is configured.
- Tests: Vitest currently covers resolver basics, ambiguity rejection, comparison output shape, and `/api/compare` route behavior.

## Automation Architecture
{compare} uses Codex as the autonomous orchestration layer. Heartbeats run continuously in the dedicated `compare-autonomous-maintenance` conversation and use GitHub for external project state.

The heartbeat chain is:
- Audit every 3 hours.
- Planner 30 minutes after audit.
- Implementer 60 minutes after audit.
- Docs/release 120 minutes after audit.

GitHub Actions are allowed as verification gates, but they are not the scheduler or primary orchestrator.

The active Codex app scheduler entry is `/Users/chappie/.codex/automations/compare-complete-audit/automation.toml`. It runs every 3 hours and executes the heartbeat responsibilities in one dedicated automation thread so context is not scattered across multiple chats.

## Invariants
- The comparison foundation must stay domain-neutral; product/service/category specifics belong in adapters.
- The live V1 adapter is mechanical watches.
- Agents may commit and push verified changes directly to `origin/main` without per-step approval.
- Agents may not force push or delete production code autonomously.
- Operational logs must preserve event context without exposing raw user-submitted comparison text, notes, credentials, or client IP addresses.
- Shared memory must be updated after meaningful automation runs.

## Current High-Risk Areas
- Watch resolution is a trust-critical path and still needs broader fuzzy matching coverage.
- Compare API rate limiting is currently in-memory per runtime instance; move it to shared infrastructure before scaled public traffic.
- Saved comparisons now persist submitted deterministic results and stable public routes when MongoDB is configured; the next product step is richer SEO metadata and aggregation over saved-page demand.
- Durable telemetry currently captures compare outcomes, resolver misses, Brain polls, persistence status, and feedback signals; the next analytics step is adding product-facing aggregation views and retention policy.
- Project board mutation depends on valid GitHub project tooling.
