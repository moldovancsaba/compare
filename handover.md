# Handover: Hungarian Shooting OS Rebuild + GitHub Board Replay

Date: 2026-05-29  
Owner: compare repository (moldovancsaba/compare)  
Status: code changes applied locally; GitHub GraphQL actions blocked by rate limit at API node level.

## Completed locally in this run

- Added shooting source ingestion and collection module set:
  - `src/lib/shootingIngestion/sourceSeedDefaults.ts`
  - `src/lib/shootingIngestion/sourceSeeds.ts`
  - `src/lib/shootingIngestion/sourceClassifier.ts`
  - `src/lib/shootingIngestion/sourceInventory.ts`
  - `src/lib/shootingIngestion/sourceCollectorText.ts`
  - `src/lib/shootingIngestion/sourceCollector.ts`
  - `src/lib/shootingIngestion/types.ts`
- Added scripts:
  - `scripts/export-shooting-sources.ts`
  - `scripts/classify-shooting-sources.ts`
  - `scripts/collect-shooting-leads.ts`
- Wired npm scripts in `package.json`:
  - `shooting:sources:inventory`
  - `shooting:sources:classify`
  - `shooting:collect:leads`
- Fixed ingestion module issues from prior state:
  - Removed lint warning by deleting unused variable path (`countDistribution`).
  - fixed duplicate counter math and row counts.
  - made collection functions deterministic for unsupported hints and promise handling.
- Validation:
  - `npm run lint`
  - `npm test`
  - script smoke run: `npm run shooting:sources:inventory`, `npm run shooting:sources:classify`, `npm run shooting:collect:leads`

## What remains blocked by GitHub GraphQL quota

The following operations are pending until GraphQL quota resets:
- Project board item cleanup and re-population on `PVT_kwHOACGtF84BXVW4`.
- Deleting/rebuilding existing board items using GH CLI `project` subcommands.
- Issue-level dependency links via board/metadata flows if this repo setup requires GraphQL.

`gh api rate_limit` can show reset time.

## GitHub mutation playbook

### 1) Confirm targets and reset state

```bash
# Confirm open issues currently present
gh api /repos/moldovancsaba/compare/issues?state=open&per_page=200

gh project list -R moldovancsaba/compare

gh project view PVT_kwHOACGtF84BXVW4 --owner moldovancsaba

gh project item-list PVT_kwHOACGtF84BXVW4 --owner moldovancsaba
```

### 2) Clear current project items

```bash
gh project item-list PVT_kwHOACGtF84BXVW4 --owner moldovancsaba --format json \
  | jq -r '.[] | .id' \
  | xargs -n1 -I{} gh project item-delete {} --owner moldovancsaba
```

### 3) Ensure labels / milestones exist

Use these exact labels:
- `initiative: hungarian-shooting-os`
- `type: architecture`
- `type: backend`
- `type: frontend`
- `type: ops`
- `scope: source-inventory`
- `track: source-inventory`
- `track: competition-intelligence`
- `track: operator-intelligence`
- `track: workflow`
- `severity: high|medium`
- `priority: p0|p1`
- `dependencies`

Use / verify:

```bash
gh label list -R moldovancsaba/compare
```

Milestones to attach in exact order:
1. Phase 1 - Source Foundation
2. Phase 2 - Competition Intelligence
3. Phase 3 - Operator Intelligence
4. Phase 4 - Workflow and Operations
5. Phase 5 - Public MVP
6. Phase 6 - Localization Foundation (if still needed in this milestone set)
7. Phase 7 - Localization Delivery
8. Phase 8 - Localization Operations

### 4) Create issues from this plan

Create each issue with:
- title prefix `[ShootingOS]: ...`
- labels: milestone-appropriate labels above
- milestone attached.
- body using exact sections below.
- dependencies section should explicitly refer to earlier issue numbers.

I recommend creating using a temporary shell loop with `--body-file`.

## Issue templates (copy this structure)

Use this exact section model in each new issue:

- Summary
- Executive Summary
- Business / Product Context
- Current State
- Problem Statement
- Goals (Functional + Technical)
- Non-Goals
- Mandatory Technical Constraints
- Architecture
- Data Model / Contracts
- API Contracts
- Runtime Flow
- Pseudo-code
- Mathematical / Ranking Logic (if applicable)
- UX / Operator Behaviour
- Accessibility Requirements
- Edge Cases
- Performance Expectations
- Security / Privacy Requirements
- Observability
- Retries and Timeouts
- Rollback / Recovery
- Acceptance Criteria
- Testing Requirements
- Documentation Requirements
- Handover / Runbook
- How to Verify
- Known Limitations
- Execution Order
- Dependencies
- Delivery Expectations
- Operational Behavior

## New issue backlog to create

Create these in dependency order:

### A. [ShootingOS]: Rulebook-backed source policy and contract baseline
- Milestone: Phase 1 - Source Foundation
- Labels: `type: architecture`, `track: source-inventory`, `initiative: hungarian-shooting-os`, `priority: p0`
- Goal: codify canonical source entities/contracts for federation, competition, range, club, course, and document surfaces; define discoverability contracts and ingestion quality gates.
- Depends on: none.
- Execution order anchor: this must be #1.

### B. [ShootingOS]: Source seed registry for Hungarian operators
- Milestone: Phase 1 - Source Foundation
- Labels: `type: backend`, `scope: source-inventory`, `track: source-inventory`, `initiative: hungarian-shooting-os`, `priority: p0`
- Goal: persist source seeds for official federation surfaces, PractiScore surface, and club/range/course starting points.
- Includes tasks: fetchability checks, freshness SLA, trust tiering, dedupe, validation.
- Dependencies: issue A.

### C. [ShootingOS]: Source classifier + extractor routing intelligence
- Milestone: Phase 1 - Source Foundation
- Labels: `type: backend`, `track: source-inventory`, `scope: source-inventory`, `initiative: hungarian-shooting-os`, `priority: p0`
- Goal: deterministic routing of each source to extractor archetype and evidence strategy.
- Dependencies: issues A, B.

### D. [ShootingOS]: Shooting source inventory and inventory artifacts
- Milestone: Phase 1 - Source Foundation
- Labels: `type: backend`, `track: source-inventory`, `scope: source-inventory`, `initiative: hungarian-shooting-os`, `priority: p0`
- Goal: inventory JSON + markdown report generation; include health, duplicates, validation status, and retries/timeouts.
- Dependencies: issues B, C.

### E. [ShootingOS]: Competition normalization engine (MVP)
- Milestone: Phase 2 - Competition Intelligence
- Labels: `type: architecture`, `track: competition-intelligence`, `initiative: hungarian-shooting-os`, `priority: p0`
- Goal: define `CompetitionRecord` schema + deterministic mapping for federation heterogeneity.
- Dependencies: issues A-D.

### F. [ShootingOS]: Competition collector and lead export pipeline
- Milestone: Phase 2 - Competition Intelligence
- Labels: `type: backend`, `track: competition-intelligence`, `initiative: hungarian-shooting-os`, `priority: p1`
- Goal: produce competition/event candidates and confidence scoring from classified sources.
- Dependencies: issues C, D, E.

### G. [ShootingOS]: PractiScore readiness abstraction layer
- Milestone: Phase 2 - Competition Intelligence
- Labels: `type: backend`, `track: competition-intelligence`, `scope: operator-intelligence`, `initiative: hungarian-shooting-os`, `priority: p1`
- Goal: support registration pre-checks and readiness status before user registration.
- Dependencies: issue F.

### H. [ShootingOS]: Range and club operator intelligence
- Milestone: Phase 3 - Operator Intelligence
- Labels: `type: backend`, `track: operator-intelligence`, `initiative: hungarian-shooting-os`, `priority: p1`
- Goal: collect ranges/clubs/courses, capability matrix, membership signals, beginner onboarding metadata.
- Dependencies: issue F.

### I. [ShootingOS]: Beginner journey onboarding + discover surfaces (EU)
- Milestone: Phase 5 - Public MVP
- Labels: `type: frontend`, `track: workflow`, `initiative: hungarian-shooting-os`, `priority: p1`
- Goal: rule-based profile intake for new shooter flow; map to recommended entity buckets.
- Accessibility mandate: all UI with general-design-system only, keyboard flow and aria-strong labels.
- Dependencies: issues F, H.

### J. [ShootingOS]: Workflow bridge from checklist mission + stale recovery
- Milestone: Phase 4 - Workflow and Operations
- Labels: `type: ops`, `track: workflow`, `scope: source-inventory`, `initiative: hungarian-shooting-os`, `priority: p1`
- Goal: add production-safe scheduled orchestration, replayability, stale handling, and auditability.
- Dependencies: issues D, F, H.

### K. [ShootingOS]: Observability and rollout safety
- Milestone: Phase 4 - Workflow and Operations
- Labels: `type: ops`, `track: workflow`, `initiative: hungarian-shooting-os`, `priority: p1`
- Goal: expose ingestion + classification + collector metrics and failure taxonomy; add emergency stop/rollback.
- Dependencies: issues D, F, J.

### L. [ShootingOS]: i18n and UX policy for EU multilingual operations
- Milestone: Phase 6 - Localization Foundation
- Labels: `type: frontend`, `scope: localization`, `track: workflow`, `initiative: localization`, `priority: p1`
- Goal: define locale strategy for HU/EN/IT for ShootingOS surfaces.
- Dependencies: issue I.

## GraphQL project operations after quota recovery

After creating issues, add them to the project and sequence:

```bash
gh project item-add PVT_kwHOACGtF84BXVW4 --owner moldovancsaba --url <issue-url>

gh project item-list PVT_kwHOACGtF84BXVW4 --owner moldovancsaba

gh project item-edit <item-id> --field-id <status-field-id> --single-select-option-id <open-option-id>
```

Then set dependencies in issue body or comments (depends-on) and order by status:
- `New` -> `In Progress` -> `Blocked` -> `Review` -> `Done`.

## Run sequence recommendation

1. Execute all issue creation in A→B→C→D→E→F→G→H→I→J→K→L.
2. Add dependencies in issue bodies as above.
3. On Monday UTC start, map A into project with strict `Status=In Progress` only when previous dependency marked Done.

