# Handover: Hungarian Shooting OS Rebuild + GitHub Board Replay

Date: 2026-05-29  
Owner: compare repository (moldovancsaba/compare)  
Status: code changes applied locally; GitHub GraphQL actions blocked by rate limit at API node level.

## Completed locally in this run

- Added/extended shooting source ingestion and collection module set:
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
- RangeScout production-shift implementation updates (content-plane + intake):
  - Added EU+HU geographies to `src/data/locations.ts` while retaining legacy NYC values for compatibility with existing discover/seed data.
  - Added Hungarian source seed extension path in `src/lib/shootingIngestion/sourceSeeds.ts` via:
    - `SHOOTING_SOURCE_SEEDS_JSON` (inline JSON array)
    - `SHOOTING_SOURCE_SEEDS_FILE` (path to JSON file)
    - dedupe and shape validation during ingestion.
  - Updated adapter, curator constants, and schema enums to support `Competition Ready`, `After-school` weekday signaling, and extended meetup enums for shooting workflows.
  - Fixed `RangeScout` adapter draft validation issues (stable recurring-program signal handling and long description min-length guard).
  - Updated scarcity/report tests to avoid hardcoded EU-neighborhood assumptions after geographies were widened.
- Validation:
  - `npm run lint`
  - `npm test`
  - script smoke run: `npm run shooting:sources:inventory`, `npm run shooting:sources:classify`, `npm run shooting:collect:leads`

### Additional implementation completed in this continuation

- Rulebook-first lead collection completed for shooting ingestion:
  - Added `src/lib/shootingIngestion/collectionRulebook.ts` with scored rule matches, precedence, lead-type deduping, and deterministic match ordering.
  - Updated `src/lib/shootingIngestion/sourceCollector.ts` to emit rule-derived `ShootingEntityLeadRecord`s with per-type and per-source caps, richer competition/event mapping, and unified entity lead export support.
  - Extended `src/lib/shootingIngestion/types.ts` with explicit entity contracts for `ShootingLeadType`, `ShootingEntityLeadRecord`, and `ShootingLeadReport`.
  - Added `src/lib/shootingIngestion/sourceCollector.test.ts` coverage for rule ordering, fallback behavior, and candidate semantics.
  - Updated `scripts/collect-shooting-leads.ts` to emit `shooting-lead-pipeline-latest.json` and entity lead reports for downstream workflows.
  - Updated `src/lib/shootingIngestion/sourceSeeds.ts` to merge external hot-loaded seed entries by `sourceId`.
- Current verification result:
  - `npm run build`
  - `npm test --silent`
  - `npm run lint --silent`
- Board synchronization remains deferred (`skip board management`), so no further GitHub project mutations were performed in this pass.

## Execution-ready follow-up (implementation-focused)

- Immediate backlog still needed before product release:
  - Add a first-class competition normalization schema + extractor mapping (`CompetitionRecord`, discipline mapping, registration readiness fields).
  - Build PractiScore readiness bridge (federation IDs, registration intent, membership checks).
  - Implement scout-source routing for `cups`/`series`/`events` and enrich `collectCompetitionLeads` with dedupe + confidence scoring.
  - Add observability metrics for seed-level failures and recovery for blocked/401/timeout sources.

- Board actions are still paused by user request (no project-item mutations until quota / preferred window).

## Current GitHub mutation state (2026-05-29)

Repository issues/milestones/labels are now in the requested shape, and project-board mutations remain blocked by GraphQL quota for the current token.

- 12 active issues created for the ShootingOS implementation plan.
  - `#86` Rulebook-backed source policy and contract baseline
  - `#87` Source seed registry for Hungarian operators
  - `#88` Source classifier + extractor routing intelligence
  - `#89` Shooting source inventory and inventory artifacts
  - `#90` Competition normalization engine (MVP)
  - `#91` Competition collector and lead export pipeline
  - `#92` PractiScore readiness abstraction layer
  - `#93` Range and club operator intelligence
  - `#94` Beginner journey onboarding + discover surfaces (EU)
  - `#95` Workflow bridge from checklist mission + stale recovery
  - `#96` Observability and rollout safety
  - `#97` i18n and UX policy for EU multilingual operations
- Old duplicate/open shooting backlog issue `#85` was closed.
- Labels verified: `type`, `track`, `initiative`, `priority`, `scope` labels are present and attached per issue.
- Milestones verified and aligned:
  - 1: Source Foundation
  - 2: Competition Intelligence
  - 3: Operator Intelligence
  - 4: Workflow and Operations
  - 5: Public MVP
  - 6: Localization Foundation

Blocked now (token-level):
- Adding issues/labels/milestones and issue-level dependencies requires only REST and is now complete.
- Project board item add/remove/edit and dependency metadata operations still require GraphQL.

## GraphQL recovery and project board continuation plan

When GraphQL is available again, run the following exact sequence:

```bash
# 1) Confirm GraphQL quota has budget
gh api rate_limit --cache 0s

# 2) Verify board exists and list field IDs (status, execution order, dependencies if present)
gh project view PVT_kwHOACGtF84BXVW4 --owner moldovancsaba
gh project field-list PVT_kwHOACGtF84BXVW4 --owner moldovancsaba

# 3) Optional cleanup: remove stale items first (if old items are visible)
gh project item-list PVT_kwHOACGtF84BXVW4 --owner moldovancsaba --format json \
  | jq -r '.[] | .id' \
  | xargs -n1 -I{} gh project item-delete {} --owner moldovancsaba

# 4) Add issue cards in sequence order:
# 86,87,88,89,90,91,92,93,94,95,96,97
for n in 86 87 88 89 90 91 92 93 94 95 96 97; do
  url=\"https://github.com/moldovancsaba/compare/issues/$n\"
  gh project item-add PVT_kwHOACGtF84BXVW4 --owner moldovancsaba --url \"$url\"
done

# 5) Set sequencing/status fields to match plan
```

Execution ordering for sequencing:
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12
matching issues `#86` through `#97`.

Dependency order by issue title (for references in each body and to map as project blockers):
- `#86` has no dependency
- `#87`, `#88` depend on `#86`
- `#89` depends on `#87` and `#88`
- `#90` depends on `#86`, `#87`, `#88`, `#89`
- `#91` depends on `#88`, `#89`, `#90`
- `#92` depends on `#91`
- `#93` depends on `#91`
- `#94` depends on `#91` and `#93`
- `#95` depends on `#89`, `#91`, `#93`
- `#96` depends on `#89`, `#91`, `#95`
- `#97` depends on `#94`

## Remaining blocked item

The following operations are pending until GraphQL recovers:
- Project board item-level sequencing/status/dependency metadata updates.
- Any dependency linking via GraphQL fields, if this board requires native dependency metadata.
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


## Pending GitHub Artifact Work (run in one pass once GraphQL quota is available)

### Scope to execute in GitHub directly
- [x] Project: `PVT_kwHOACGtF84BXVW4` (`{compare} - Hungarian Shooting OS`)
- [x] Ensure issue dependency relationships for localization track:
  - #80 depends on #79 and #81
  - #81 depends on #79
  - #82 depends on #79 and #81
  - #83 depends on #79 and #81
  - #84 depends on #79, #81, #82, #83, #80
- [x] Confirm localization labels/milestones on these issues:
  - #79 → milestone `Phase 6 - Localization Foundation`
  - #81 → milestone `Phase 6 - Localization Foundation`
  - #80 → milestone `Phase 7 - Localization Delivery`
  - #82 → milestone `Phase 7 - Localization Delivery`
  - #83 → milestone `Phase 7 - Localization Delivery`
  - #84 → milestone `Phase 8 - Localization Operations`
- [x] Update project status sequencing and execution order:
  - 79: `In Progress (NOW)`
  - 81: `In Progress (NOW)`
  - 83: `Todo (NEXT)`
  - 80: `Todo (NEXT)`
  - 82: `Backlog (SOONER)`
  - 84: `Roadmap (LATER)`
  - optional: add Number field `Execution Order` in project and set: 79=1, 81=2, 80=3, 83=4, 82=5, 84=6

### GraphQL mutation script (copy/paste)
Use `gh api graphql` after token reset. This avoids manual UI drift and is safe to rerun with current IDs.

```bash
# 1) Resolve issue node IDs from REST payloads if they ever change
for n in 79 80 81 82 83 84; do
  node=$(gh api repos/moldovancsaba/compare/issues/$n --jq '.node_id')
  echo "$n $node"
done

# 2) Add dependency links (issue A blockedBy issue B)
# 79 depends on none
# 81 depends on 79
# 80 depends on 79 + 81
# 82 depends on 79 + 81
# 83 depends on 79 + 81
# 84 depends on 79 + 81 + 80 + 82 + 83
cat >/tmp/block.graphql <<'GQL'
mutation($issueId: ID!, $blockingIssueId: ID!) {
  addBlockedBy(input: { issueId: $issueId, blockingIssueId: $blockingIssueId }) {
    issue { number title }
    blockingIssue { number title }
  }
}
GQL

# replace ISSUE and BLOCKER with node IDs above
for pair in "80 79" "80 81" "81 79" "82 79" "82 81" "83 79" "83 81" "84 79" "84 81" "84 80" "84 82" "84 83"; do
  set -- $pair
  issue=$1
  blocker=$2
  issueNode=$(gh api repos/moldovancsaba/compare/issues/$issue --jq '.node_id')
  blockerNode=$(gh api repos/moldovancsaba/compare/issues/$blocker --jq '.node_id')
  gh api graphql -F issueId="$issueNode" -F blockingIssueId="$blockerNode" -f query=@/tmp/block.graphql > /dev/null

done

# 3) Ensure labels (if missing) and attach them
# Labels required by governance:
for label in "initiative: localization" "track: localization" "scope: localization" "type: i18n" "priority: p1" "accessibility" "dependencies"; do
  gh label create "$label" -R moldovancsaba/compare --force || true
done

# 4) Milestones check is already correct for current issue set, re-assert when needed
# 79 and 81 -> 6, 80/82/83 -> 7, 84 -> 8

gh issue edit 79 81 --repo moldovancsaba/compare --milestone "Phase 6 - Localization Foundation"
gh issue edit 80 82 83 --repo moldovancsaba/compare --milestone "Phase 7 - Localization Delivery"
gh issue edit 84 --repo moldovancsaba/compare --milestone "Phase 8 - Localization Operations"

# 5) Project board execution sequencing and status values (requires item IDs)
# Project item IDs in this run:
# 79 -> PVTI_lAHOACGtF84BXVW4zguMdZQ
# 80 -> PVTI_lAHOACGtF84BXVW4zguMddQ
# 81 -> PVTI_lAHOACGtF84BXVW4zguMdaY
# 82 -> PVTI_lAHOACGtF84BXVW4zguMdcE
# 83 -> PVTI_lAHOACGtF84BXVW4zguMdbQ
# 84 -> PVTI_lAHOACGtF84BXVW4zguMdek

# status field id = PVTSSF_lAHOACGtF84BXVW4zhSi3y0
# execution order field id (after creation): from gh project field-list output (Number field)
# options: f75ad846 Todo, 532b72d5 Backlog, 392fb27d Roadmap, 47fc9ee4 In Progress
# sequence field (if added): create via gh project field-create then set with --number

gh project field-create PVT_kwHOACGtF84BXVW4 --owner @me --name "Execution Order" --data-type number

# Update execution state + order (replace item IDs if items changed):
# set status
gh project item-edit --project-id PVT_kwHOACGtF84BXVW4 --id PVTI_lAHOACGtF84BXVW4zguMZc8 --field-id PVTF_lAHOACGtF84BXVW4zhSi3y4 --single-select-option-id 47fc9ee4
gh project item-edit --project-id PVT_kwHOACGtF84BXVW4 --id PVTI_lAHOACGtF84BXVW4zguMdaY --field-id PVTF_lAHOACGtF84BXVW4zhSi3y4 --single-select-option-id 47fc9ee4
gh project item-edit --project-id PVT_kwHOACGtF84BXVW4 --id PVTI_lAHOACGtF84BXVW4zguMdbQ --field-id PVTF_lAHOACGtF84BXVW4zhSi3y4 --single-select-option-id f75ad846
gh project item-edit --project-id PVT_kwHOACGtF84BXVW4 --id PVTI_lAHOACGtF84BXVW4zguMddQ --field-id PVTF_lAHOACGtF84BXVW4zhSi3y4 --single-select-option-id f75ad846
gh project item-edit --project-id PVT_kwHOACGtF84BXVW4 --id PVTI_lAHOACGtF84BXVW4zguMdcE --field-id PVTF_lAHOACGtF84BXVW4zhSi3y4 --single-select-option-id 532b72d5
gh project item-edit --project-id PVT_kwHOACGtF84BXVW4 --id PVTI_lAHOACGtF84BXVW4zguMdek --field-id PVTF_lAHOACGtF84BXVW4zhSi3y4 --single-select-option-id 392fb27d

# set numeric execution order
gh project item-edit --project-id PVT_kwHOACGtF84BXVW4 --id PVTI_lAHOACGtF84BXVW4zguMZc8 --field-id <execution-order-field-id> --number 1
gh project item-edit --project-id PVT_kwHOACGtF84BXVW4 --id PVTI_lAHOACGtF84BXVW4zguMdaY --field-id <execution-order-field-id> --number 2
gh project item-edit --project-id PVT_kwHOACGtF84BXVW4 --id PVTI_lAHOACGtF84BXVW4zguMddQ --field-id <execution-order-field-id> --number 3
gh project item-edit --project-id PVT_kwHOACGtF84BXVW4 --id PVTI_lAHOACGtF84BXVW4zguMdbQ --field-id <execution-order-field-id> --number 4
gh project item-edit --project-id PVT_kwHOACGtF84BXVW4 --id PVTI_lAHOACGtF84BXVW4zguMdcE --field-id <execution-order-field-id> --number 5
gh project item-edit --project-id PVT_kwHOACGtF84BXVW4 --id PVTI_lAHOACGtF84BXVW4zguMdek --field-id <execution-order-field-id> --number 6
```

### Conflict-safe note
`handover.md` is a shared doc; append-only updates are preferred to full replacement so concurrent collaborators can merge with minimal conflicts.

## Completed in Recovery Pass (2026-05-29)

- GraphQL rate limit recovered and live artifact mutations were completed.
- Dependency graph verified as:
  - `#80 <- 79, 81`
  - `#81 <- 79`
  - `#82 <- 79, 81`
  - `#83 <- 79, 81`
  - `#84 <- 79, 81, 80, 82, 83`
- Type labels normalized:
  - `type: architecture`: #79, #81
  - `type: backend`: #80
  - `type: frontend`: #82, #83
  - `type: ops`: #84
- Current item IDs on project `PVT_kwHOACGtF84BXVW4`:
  - #79: `PVTI_lAHOACGtF84BXVW4zguMdZQ`
  - #80: `PVTI_lAHOACGtF84BXVW4zguMddQ`
  - #81: `PVTI_lAHOACGtF84BXVW4zguMdaY`
  - #82: `PVTI_lAHOACGtF84BXVW4zguMdcE`
  - #83: `PVTI_lAHOACGtF84BXVW4zguMdbQ`
  - #84: `PVTI_lAHOACGtF84BXVW4zguMdek`
- Project status field remains `Done` for all localization items due issue closure state.

## Continuation Checkpoint (2026-05-29)

- `main` remains clean and in sync with `origin/main`.
- `npm run build` and `npm test --silent` pass locally after all i18n/watch cleanup.
- Project `#16` on `moldovancsaba` is the active board for this repo and currently contains only legacy localization issues `#79`-`#84`.
- `gh project item-list 16 --owner moldovancsaba` shows no blockers for deployment:
  - all localized issues are closed and present on the board with `Done` status.
- Outstanding open GitHub work is issue `#97` (not yet placed on the board) and is outside the closed `#79`-`#84` localization execution set.
- Next operator step (if continuing implementation) is to either:
  - place `#97` on an explicit backlog status for de-scoping, or
  - close it and decompose into the strict execution issue style used in this repo (or confirm no action needed).

Suggested board command for placement (if requested):

```bash
gh project item-add 16 --owner moldovancsaba --url https://github.com/moldovancsaba/compare/issues/97
gh project item-list 16 --owner moldovancsaba --format json | jq -r '.items[] | select(.content.url|contains(\"/issues/97\")) | [.id, .content.url]'
```

## Completed in Recovery Pass (2026-05-29)

- GraphQL rate limit recovered and live artifact mutations were completed.
- Dependency graph verified as:
  - `#80 <- 79, 81`
  - `#81 <- 79`
  - `#82 <- 79, 81`
  - `#83 <- 79, 81`
  - `#84 <- 79, 81, 80, 82, 83`
- Type labels normalized:
  - `type: architecture`: #79, #81
  - `type: backend`: #80
  - `type: frontend`: #82, #83
  - `type: ops`: #84
- Current item IDs on project `PVT_kwHOACGtF84BXVW4`:
  - #79: `PVTI_lAHOACGtF84BXVW4zguMdZQ`
  - #80: `PVTI_lAHOACGtF84BXVW4zguMddQ`
  - #81: `PVTI_lAHOACGtF84BXVW4zguMdaY`
  - #82: `PVTI_lAHOACGtF84BXVW4zguMdcE`
  - #83: `PVTI_lAHOACGtF84BXVW4zguMdbQ`
  - #84: `PVTI_lAHOACGtF84BXVW4zguMdek`
- Project status field remains `Done` for all localization items due issue closure state.
