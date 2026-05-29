# ClassScout Roadmap

This roadmap reflects the current state of the repo after the validation, reporting, reviewer-audit, and curator release-check foundation has already been delivered.

Design/UI/UX standards are governed by the [General Design System repository](https://github.com/sovereignsquad/general-design-system). This roadmap may describe ClassScout sequencing, but it is not the authority for component behavior or UI rules.

## Foundation already in place

The following are no longer aspirational:

- shared curated payload quality checks
- ingest-time semantic validation for curated payloads
- a repeatable scarcity report
- a repeatable live catalog audit
- curated payload audit tooling
- a repeatable curator release-check workflow

Those capabilities now exist in code and should be treated as operating infrastructure, not future roadmap items.

## Current active phase

The current phase is controlled catalog expansion with documentation and review discipline kept in sync.

In parallel, the UI platform now has a strict architectural direction: Mantine-only under the current GDS package/runtime contract.

## Tracks

### 1. Catalog quality

- Keep curated payloads, production rows, and generated reports aligned.
- Prefer deleting weak rows over preserving stale or unsupported claims.
- Continue hardening reviewer checks when new mistake classes are discovered.

Success looks like:

- `npm run catalog:audit` stays clean after normal curation work
- curated payload audits pass before production ingest
- cleanup work is exceptional rather than routine

### 2. Scarcity-driven coverage

- Expand the catalog from the live scarcity report instead of ad hoc browsing.
- Prefer high-confidence official sources over merely empty slices.
- Re-rank targets after each meaningful ingest or cleanup batch.

Success looks like:

- each new batch can cite the latest scarcity artifact
- target lists are refreshed when the report changes
- the weakest coverage areas improve without lowering source quality

### 3. Product/admin alignment

- Keep docs, admin behavior, ingest behavior, and type definitions synchronized.
- Avoid hidden capability drift between the repo README, the in-app API docs, and the actual route handlers.

Success looks like:

- API docs match route semantics
- script docs match `package.json`
- architecture docs match the current codebase, not retired systems

### 4. Mantine-only and GDS local conversion

- Treat the [General Design System repository](https://github.com/sovereignsquad/general-design-system) as the SSOT for all design, UI, and UX decisions.
- Keep the Mantine root platform as the only active UI runtime foundation.
- Prevent reintroduction of alternate primitive systems through local enforcement checks.
- Prefer current GDS contracts where they exist, and prefer mirrored local GDS contracts over bespoke page composition when direct package consumption is not yet deploy-safe.
- Treat future UI work as refinement inside the Mantine and GDS system, not as a migration bridge.

Success looks like:

- Mantine remains the only foundational runtime UI library for product UI
- local docs consistently point to the shared SSOT
- no local parallel design-system adapter layer returns

## Near-term priorities

1. Fill the top strict scarcity slices from [`docs/high-confidence-backfill-targets.md`](/Users/Shared/Projects/classscout/docs/high-confidence-backfill-targets.md).
2. Keep the reviewer audit at `No findings.` after each batch.
3. Refresh documentation whenever routes, scripts, or curator rules change.
4. Enforce Mantine-only boundaries with static checks and keep local exceptions explicit, narrow, and temporary.
5. Tighten validations further only when a real production mistake reveals a missing guard instead of adding speculative rules.

## Done conditions for this phase

This phase is complete when:

1. the weakest provider slices improve from the current scarcity report
2. the live catalog audit remains clean across multiple ingest batches
3. documentation stays synchronized with the code and no longer requires catch-up cleanup passes
