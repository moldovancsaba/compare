# Image Duplicate Remediation Runbook

This runbook is the reusable checklist for cleaning an existing database when duplicate listing images already exist.

Use it for ClassScout and for other projects that adopt the same fingerprint, audit, queue, and remediation workflow.

## Purpose

The duplicate-image system has two jobs:

1. prevent new duplicate images from being published
2. find and clean up historical duplicates that already exist in a live catalog

This runbook covers the second job.

## Preconditions

- `MONGODB_URI` is set
- `IMGBB_API_KEY` is set
- the app code includes the fingerprint registry, audit script, and remediation queue
- official source URLs exist for the rows you expect the system to remediate automatically

Recommended verification before starting:

```bash
npm run lint
npm test
npm run build
```

## Standard operator sequence

Run these steps in order.

### 1. Backfill image fingerprints

```bash
npm run catalog:image-backfill
```

Purpose:

- creates fingerprint records for older rows that predate the uniqueness system
- gives the auditor a complete base set for exact and near-duplicate matching

Expected outcome:

- every live provider and meetup row with an image has a fingerprint record

### 2. Generate the duplicate audit baseline

```bash
npm run catalog:image-audit
```

Outputs:

- [`docs/reports/image-duplicate-audit-latest.md`](/Users/Shared/Projects/classscout/docs/reports/image-duplicate-audit-latest.md)
- [`docs/reports/image-duplicate-audit-latest.json`](/Users/Shared/Projects/classscout/docs/reports/image-duplicate-audit-latest.json)

Purpose:

- identifies exact duplicates by ImgBB URL and content hash
- identifies near duplicates by perceptual hash distance
- gives the operator a before/after baseline for cleanup work

### 3. Seed the historical remediation queue

```bash
npm run catalog:image-remediate -- --seed
```

Purpose:

- converts audit findings into queue items
- preserves incumbent/newer relationships
- targets newer rows for replacement attempts

Expected outcome:

- queued remediation records exist for duplicate rows that should be reviewed or retried

### 4. Run automated remediation

```bash
npm run catalog:image-remediate -- --run --limit 25
```

Purpose:

- attempts to find an alternate official image
- uploads a new ImgBB asset when a unique official candidate is found
- patches the newer row
- updates the fingerprint registry

Recommended practice:

- use a bounded batch size such as `25`
- rerun until the queue reaches terminal states

Terminal states:

- `resolved`
- `blocked_no_unique_candidate`

### 5. Review blocked cases

Use one or both of these paths:

- review the admin remediation workspace at `/admin`
- inspect the latest audit report and remediation queue directly

Blocked cases mean the system could not find a unique official alternate image that passed the gate.

At that point choose one of these resolutions:

- replace the image manually with a different official source-backed asset
- intentionally allow shared artwork and document the exception
- retire the newer row if the listing should not remain live

### 6. Re-run the audit

```bash
npm run catalog:image-audit
```

Purpose:

- confirms the cleanup delta
- leaves a fresh report artifact for handover and project tracking

## Checklist

- [ ] fingerprints backfilled
- [ ] audit baseline generated
- [ ] remediation queue seeded
- [ ] remediation batches run to terminal states
- [ ] blocked cases reviewed
- [ ] final audit regenerated
- [ ] follow-up tickets created for unresolved clusters

## Operational guidance

### Choosing the incumbent

The system keeps the oldest published row when duplicate images conflict.

Order:

1. oldest `publishedAt`
2. oldest `updatedAt`
3. stable id ordering as the final fallback

### Shared-art source family rule

When an official source family reuses the same campaign or program art across multiple branches, do not accept the shared image as the first fallback automatically.

Use this order instead:

1. unique branch-specific official program image
2. unique branch-specific official location or facility image from the same source family
3. documented exception only if no unique official branch asset exists

This keeps the catalog visually distinct without weakening the official-source rule.

### What the system will fix automatically

- exact duplicate images where an alternate official image exists
- near duplicates where an alternate official image exists and passes the uniqueness gate

### What still needs human review

- providers where the official source exposes only generic reused artwork
- institutions that intentionally reuse brand-wide program art across branches
- rows with weak or missing source lineage
- cases where the alternate candidate is technically unique but editorially worse

## Failure handling

If the remediation batch fails:

1. inspect the queue status in admin or Mongo
2. rerun with a smaller `--limit`
3. confirm `IMGBB_API_KEY` and source fetch access are valid
4. rerun the audit after recovery

If the queue looks stale:

1. regenerate the audit
2. reseed the queue
3. rerun remediation in bounded batches

## Suggested rollout for other projects

When adopting this pattern in another repo, use this sequence:

1. land fingerprint persistence first
2. land publish-time duplicate blocking
3. backfill historical rows
4. run the first full audit
5. seed and run remediation batches
6. create cleanup issues for blocked clusters
7. add the sequence to the project’s ongoing operator checklist

## Manual verification

```bash
npm run catalog:image-backfill
npm run catalog:image-audit
npm run catalog:image-remediate -- --seed
npm run catalog:image-remediate -- --run --limit 10
npm run catalog:image-audit
```

Expected results:

- audit artifacts are generated successfully
- queue items move from `queued` to terminal states
- resolved rows receive new ImgBB URLs
- duplicate counts drop or remain stable with blocked cases clearly documented

## Handover notes

Record these values after each cleanup run:

- total exact duplicate groups before and after
- total near-duplicate pairs before and after
- remediation queue totals by status
- unresolved clusters that need manual review
- any intentional exceptions approved by the team
