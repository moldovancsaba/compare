# Release Notes

## Unreleased
- Added Mongo-aware shared rate limiting for compare and tradeoff APIs with in-memory fallback, explicit unsupported-source handling for watch URLs, recent-comparison history, local saved-intent monitoring, homepage editorial landing sections, richer watch catalog attributes, and composable watch comparison rule modules.
- Moved the mechanical-watch catalog into a versioned JSON source of truth with schema validation, duplicate detection, and maintainer-facing validation and ingestion scripts.
- Added route-specific metadata for persisted saved comparison pages, including canonical, Open Graph, and Twitter fields derived from the saved verdict, plus regression coverage for the metadata builder.
- Aligned smart discovery section labels, architecture documentation, adapter SDK notes, and Trinity Brain integration docs with the current domain-adapter implementation.
- Resolved the stale release-governance blocker by restoring the local lockfile install, re-running lint, typecheck, test, build, and production audit successfully, and realigning the documentation with the verified gate status.

## v0.2.1 - 2026-05-13
- Added deterministic watch marketing-reality analysis for myth pressure, spec inflation, supported claims, and buyer cautions across comparison and should-I-buy surfaces.
- Added a local watch tradeoff simulator with six buyer-priority controls, serializable URL state, scenario recommendations, and allowlisted telemetry.
- Added optional local watch decision-intent profiles that personalize recommendation emphasis without requiring accounts.
- Added transparent watch value scoring with explicit comfort, capability, versatility, ownership, and price-discipline weights.
- Added manually curated secondary-market ownership intelligence with premium/discount, trend, liquidity, freshness, source, and warning output.
- Added smart discovery alternatives with explicit reason codes, decision-intent filtering, and no paid-placement ranking.
- Bumped the app release to `v0.2.1` and aligned README, user manual, API documentation, watch consequence rules, and release notes.

## v0.2.0 - 2026-05-12
- Added a generic comparison entity/result contract and domain adapter registry so the core system is no longer hard-coded to watches.
- Moved the watch-specific resolver and rule engine behind the first domain adapter while preserving the existing watch comparison behavior.
- Updated `/api/compare`, saved comparison persistence, Brain queue payloads, feedback, and result rendering to use generic entity/domain fields with watch IDs retained only for compatibility.
- Updated the homepage/form copy to describe the domain-based foundation while keeping mechanical watches as the first live adapter.
- Re-centered Project 16 around the generic comparison infrastructure initiative, with labels for core platform, watch adapter, and future-domain work.
- Added the domain adapter SDK documentation and shared conformance test harness, with the watch adapter as the reference passing adapter.
- Added adapter-owned UI metadata and a comparison-domain selector so the form is driven by registered domains instead of watch-specific copy.
- Added a universal evidence and confidence model so result UI can distinguish facts, rules, editorial inference, and known missing data across domains.
- Added adapter data-source governance with source tiers, freshness, curation rules, blocked-source rules, and missing-data policy requirements.
- Added the first non-watch services adapter with curated business-service archetypes, deterministic switching-cost reasoning, and evidence/confidence output.
- Added verdict-led decision output fields and adapter-owned section labels so results show stronger choice, exception case, confidence rationale, and domain-appropriate section hierarchy.
- Added resolver disambiguation suggestions so ambiguous or unsupported inputs fail closed with useful recovery options instead of guessing.
- Refined the editorial UI hierarchy with a restrained surface system, clearer first-viewport positioning, and a decision scan panel for faster result trust.
- Added structured watch ownership metadata for comfort, service burden, durability, reliability, resale stability, bracelet quality, and strap versatility.
- Added deterministic watch consequence rules for wrist presence, cuff fit, wrist-size sensitivity, service friction, versatility, and travel readiness.
- Added cross-domain recommendation signals so adapters expose decisive default picks, buyer-priority tradeoffs, confidence, and avoid-if guidance to the UI.
- Added accountless watch collection profiles with local browser persistence and adapter-owned collection context in watch comparisons.
- Added deterministic watch collection gap and overlap analysis for missing roles, redundancy, brand concentration, size balance, and complication balance.
- Added watch upgrade-path intelligence that classifies meaningful, lateral, emotional, and poor-value paths against owned watches.
- Added explainable watch collection balance scoring for versatility, redundancy, formality, complication diversity, and ownership risk.
- Added single-watch should-I-buy analysis with buy/consider/skip verdicts, collection-aware overlap, ownership risk, value assessment, emotional fit, and alternatives.
- Added conservative five-year watch ownership simulation with service-cost bands, service intervals, durability risk, exit liquidity, friction, confidence, freshness, assumptions, and warnings across comparison and should-I-buy surfaces.
- Added model-level watch market positioning for hype versus substance, collector respect, saturation, brand cachet, liquidity context, confidence, provenance, and missing-data warnings.
- Added conservative typo tolerance for distinctive watch resolver tokens while preserving fail-closed behavior for ambiguous model families.
- Bumped the app release to `v0.2.0` and aligned README, user manual, API documentation, release notes, and developer onboarding language with the current domain-adapter platform.
- Consolidated hard-coded component styling into global design-system primitives for low-confidence pills, source links, editorial layout grids, collection layouts, dividers, and verdict typography.

## v0.1.1 - 2026-05-11
- Updated `README.md` and the governance docs to match the live codebase and verification process.
- Corrected the documented technical background, including actual TypeScript, ESLint, and frontend architecture details.
- Added an explicit app version source and surfaced `v0.1.1` in the web UI.
- Added basic per-client `/api/compare` rate limiting with `429` and `Retry-After` responses.
- Hardened watch resolution so generic brand-only and ambiguous model inputs fail closed instead of selecting the first catalog match.
- Added MongoDB-backed allowlisted telemetry for compare outcomes, resolver misses, Brain polling, and feedback signals.
- Added MongoDB-backed saved-comparison persistence for submitted deterministic comparison results.
- Added stable `/compare/[slug]` pages for MongoDB-backed saved comparison results.
- Added supported-catalog quick-select examples and resolver-miss recovery data in `/api/compare`.
- Added inline duplicate and resolver-equivalent input validation before `/api/compare` submission.
- Exposed catalog side-picking, input swap/clear, manual Brain refresh, and optional feedback notes in the UI.
- Added opinionated instant verdict output with best-overall, daily-wear, one-watch, tool-watch, ownership-story, and value picks.
- Added qualitative ownership intelligence to the watch catalog and comparison output.
- Added product strategy documentation for trust-first purchase confidence, premium ownership intelligence, collection planning, upgrade analysis, and anti-SEO-spam constraints.
- Cleared the prior Next/PostCSS audit blocker with a root PostCSS override.

## v0.1.0 - 2026-05-11
- Replaced the previous repository contents with the initial {compare} codebase.
- Added a Next.js App Router mechanical-watch comparison app with a curated catalog, consequence engine, and `/api/compare` route.
- Added baseline project governance documents, tests, and MongoDB-ready infrastructure.
- Verified lint, test, typecheck, and production build locally. `npm audit --omit=dev` remains blocked by the current stable Next dependency tree.
