# {compare} Architecture

## Product Architecture
{compare} is a domain-based comparison system. The live V1 adapter compares mechanical watches by real ownership consequences, but the foundation is no longer watch-shaped: inputs resolve to generic comparison entities, domain adapters own product/service/category-specific resolution, and the API/UI consume a shared comparison result contract.

The current product-development initiative is generic comparison infrastructure with domain-specific adapters. GitHub Project 16 is the SSOT for that initiative. Board items should be labeled by scope:
- `scope: core-platform` for generic API, UI shell, persistence, evidence, adapter SDK, and shared tests.
- `scope: watch-adapter` for watch-specific resolver, catalog, ownership, and recommendation work.
- `scope: future-domain` for services, SaaS, or later comparison domains.

## Application Layers
- UI: Next.js App Router pages and React components in `src/app` and `src/components`, including an adapter-aware domain selector, editorial result hierarchy, decision scan panel, and shareable saved comparison pages at `/compare/[slug]`.
- API: `/api/compare` applies basic per-client rate limiting, validates requests, delegates resolution/comparison to a domain adapter, rejects unresolved inputs with adapter suggestions, blocks duplicate entities, and returns comparison output.
- Comparison core: `src/types/comparison.ts` and `src/lib/services/compare.ts` define the generic entity/result contract, verdict-led decision output fields, universal evidence/confidence model, adapter-owned UI metadata, and adapter registry.
- Domain logic: `src/lib/domains/watch-domain.ts` and `src/lib/domains/service-domain.ts` are the first adapters; `src/lib/services/compare-watches.ts` and `src/lib/services/compare-services.ts` remain domain-specific deterministic rule engines behind those adapters.
- Data: `src/lib/data/watch-catalog.ts` and `src/lib/data/service-catalog.ts` are curated adapter data sources. Watch rows include structured ownership profiles for comfort, service burden, durability, reliability, resale stability, bracelet quality, and strap versatility. Future domains should add their own adapter and source data instead of adding category conditionals to the API or UI shell.
- Adapter SDK: `docs/domain-adapters.md` defines the adapter contract, registration workflow, and required conformance tests in `tests/support/domain-adapter-conformance.ts`. `docs/data-governance.md` defines source-tier, freshness, curation, blocked-source, and missing-data rules. `docs/watch-consequence-rules.md` records the deterministic watch attribute-to-consequence heuristics.
- Persistence: `src/lib/db.ts` connects to optional MongoDB Atlas. Submitted deterministic comparisons are best-effort upserted to `saved_comparisons` with generic entity/domain fields plus legacy watch IDs for compatibility, Brain jobs use `compare_jobs` and `comparison_traces`, feedback uses `comparison_feedback`, and telemetry uses `analytics_events`.
- Observability: `src/lib/observability/logger.ts` emits structured JSON events with redaction for user inputs, URLs/URIs, notes, credentials, authorization-like fields, and raw error messages. `src/lib/observability/telemetry.ts` optionally records durable allowlisted analytics events in MongoDB when Atlas is configured.
- Tests: Vitest currently covers resolver basics, typo tolerance, ambiguity rejection, comparison output shape, and `/api/compare` route behavior.

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
- The live V1 adapters are mechanical watches and business services.
- New domains must enter through adapter registration, conformance tests, and data governance rather than conditional logic in the API or UI shell.
- Every adapter result must expose evidence, confidence, data-quality, and missing-data metadata so the UI can distinguish facts, rules, editorial inference, and known gaps.
- Every adapter result must expose stronger choice, exception case, confidence rationale, and section labels so the UI stays verdict-led without hard-coded domain language.
- Resolvers must fail closed with suggestions for ambiguous or unsupported inputs instead of guessing between close variants.
- Every adapter must expose a data policy with source tiers, freshness rules, curation rules, blocked sources, and missing-data behavior.
- Agents may commit and push verified changes directly to `origin/main` without per-step approval.
- Agents may not force push or delete production code autonomously.
- Operational logs must preserve event context without exposing raw user-submitted comparison text, notes, credentials, or client IP addresses.
- Shared memory must be updated after meaningful automation runs.

## Current High-Risk Areas
- Watch resolution is a trust-critical path; it now handles obvious single-token typos, but broader nickname coverage and explicit disambiguation prompts still need product work.
- Compare API rate limiting is currently in-memory per runtime instance; move it to shared infrastructure before scaled public traffic.
- Saved comparisons now persist submitted deterministic results and stable public routes when MongoDB is configured; the next product step is richer SEO metadata and aggregation over saved-page demand.
- Durable telemetry currently captures compare outcomes, resolver misses, Brain polls, persistence status, and feedback signals; the next analytics step is adding product-facing aggregation views and retention policy.
- Project board mutation depends on valid GitHub project tooling.
