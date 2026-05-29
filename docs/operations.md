# Operations

This document describes the supported local and production-facing workflows for operating and maintaining RangeScout.

Design/UI/UX policy is not defined here. The SSOT is the [General Design System repository](https://github.com/sovereignsquad/general-design-system).

For ingestion and planning direction, treat these as the current source of truth:

- [Hungarian Shooting Rulebook](/Users/Shared/Projects/compare/docs/hungarian-shooting-rulebook.md)
- [Hungarian Shooting Implementation Plan](/Users/Shared/Projects/compare/docs/hungarian-shooting-implementation-plan.md)

## Environment setup

1. Copy [`.env.example`](/Users/Shared/Projects/classscout/.env.example) to `.env` and/or `.env.local`.
2. Generate secrets:

```bash
npm run env:generate
```

3. Fill in infrastructure keys:

- `MONGODB_URI`
- optional `MONGODB_DB`
- `IMGBB_API_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `INGEST_API_KEY`

4. For curator automation, also set:

- `CURATOR_ENABLED=true`
- `SERPER_API_KEY`
- `CURATOR_OPENAI_API_KEY`
- `CRON_SECRET`

Notes:

- `.env.local` overrides `.env`.
- `INGEST_BASE_URL` is only for local helper scripts that should target a non-default deployment.
- `npm run vercel:env:push` is the supported path for syncing env vars to Vercel.

## Local development

Start dev mode:

```bash
npm run dev
```

Useful companion commands:

- `npm run lint`
- `npm test`
- `npm run test:watch`
- `npm run build`
- `npm run checklist:mission`
- `npm run catalog:watchdog`
- `npm run catalog:image-audit`
- `npm run catalog:image-backfill`
- `npm run catalog:image-remediate -- --seed`
- `npm run catalog:image-remediate -- --run --limit 25`

Recommended pre-ship verification for normal repo changes:

- `npm run lint`
- `npm test`
- `npm run build`

For the current GDS/usability/client-clarity rollout, also use:

- [`docs/gds-refinement-release-gate.md`](/Users/Shared/Projects/classscout/docs/gds-refinement-release-gate.md)

## UI migration operating rules

- ClassScout is on a Mantine-only foundation. Do not reintroduce alternate primitive systems or rebuild a large local wrapper layer.
- Before changing shared interaction behavior, read the GDS SSOT docs in the [General Design System repository](https://github.com/sovereignsquad/general-design-system).
- If a local implementation decision needs a project-specific exception, document it in [`docs/design-system-adapter.md`](/Users/Shared/Projects/classscout/docs/design-system-adapter.md) instead of inventing a parallel design rule in feature docs.
- Prefer direct `@doneisbetter/*` package contracts and Mantine composition; do not reintroduce a local parallel design-system adapter layer.
- Run `npm run check:mantine` along with normal verification when touching shared product UI.
- When shipping shell/theme/usability work, complete the release gate in [`docs/gds-refinement-release-gate.md`](/Users/Shared/Projects/classscout/docs/gds-refinement-release-gate.md).

## Database workflows

### Seed a clean local DB

```bash
npm run db:seed
```

What it does:

- clears `providers`
- clears `meetupGroups`
- reseeds canonical `locations`
- upserts default `site` content

### Restore from curated payloads

```bash
npm run db:restore-payloads
```

What it does:

- replays only the durable catalog payload corpus in `scripts/ingest-payloads/catalog`
- writes directly to Mongo via `applyIngestOperation`
- does not clear collections first

Use this after an accidental seed wipe or when rebuilding a local DB from the curated corpus.

Operational cleanup payloads belong in `scripts/ingest-payloads/operations` and are intentionally excluded from restore.

## Image workflows

### Upload bundled fallback assets

```bash
npm run imgbb:upload-assets
```

This uploads `scripts/imgbb-asset-sources/*` to ImgBB and prints `NEXT_PUBLIC_IMG_BB_*` lines to copy into env files and Vercel.

### Upload a listing image through APIs

Supported endpoints:

- `POST /api/ingest/upload`
- `POST /api/admin/upload`

Both expect multipart form data with a `file` field and return an ImgBB URL.

### Historical duplicate cleanup

Use the full runbook in [`docs/image-duplicate-remediation-runbook.md`](/Users/Shared/Projects/classscout/docs/image-duplicate-remediation-runbook.md).

Standard sequence:

```bash
npm run catalog:image-backfill
npm run catalog:image-audit
npm run catalog:image-remediate -- --seed
npm run catalog:image-remediate -- --run --limit 25
npm run catalog:image-audit
```

Purpose:

- cleans up existing duplicate images in older databases
- leaves a fresh before/after audit artifact
- identifies blocked cases that still need manual review

## Manual curated ingest

1. Start from [`scripts/cursor-curator-prompt.txt`](/Users/Shared/Projects/classscout/scripts/cursor-curator-prompt.txt).
2. Save durable listing payloads to [`scripts/ingest-payloads/catalog`](/Users/Shared/Projects/classscout/scripts/ingest-payloads/catalog). Keep one-off cleanup or migration payloads in [`scripts/ingest-payloads/operations`](/Users/Shared/Projects/classscout/scripts/ingest-payloads/operations).
3. Run the curated audit when schedule tags, badges, recurring programs, or multiple payloads changed:

```bash
npm run audit:curated
```

4. Validate and ingest the payload:

```bash
npm run ingest:listing -- scripts/ingest-payloads/catalog/<payload>.json
```

5. If the listing intentionally refreshes an existing row and duplicate guards block it:

```bash
npm run ingest:listing -- --force scripts/ingest-payloads/catalog/<payload>.json
```

Important behaviors:

- The ingest helper validates structure before POST.
- It also runs semantic curated quality checks.
- It checks public providers and meetup groups for duplicate ids or names.
- It prints a full ingest report including source URLs and API response body.
- The preferred finishing step after any non-trivial batch is `npm run curation:release-check`.

Recommended verification for curated catalog work:

1. `npm run audit:curated`
2. `npm run ingest:listing -- --dry-run scripts/ingest-payloads/catalog/<payload>.json`
3. `npm run ingest:listing -- scripts/ingest-payloads/catalog/<payload>.json`
4. `npm run curation:release-check`

## Automated curator workflow

### Run one local cycle

```bash
npm run curator:run
```

This uses the same discovery logic as the cron route.

### Production cron entry

- Route: `GET /api/cron/curator`
- Schedule source: `vercel.json`
- Auth: `Authorization: Bearer <CRON_SECRET>`

Current automated scope:

- provider rows only
- no meetup-group automation yet

## Reporting and review

### Checklist mission contract

```bash
npm run checklist:mission
```

Outputs:

- [`docs/reports/checklist-catalog-ops-mission-latest.md`](/Users/Shared/Projects/classscout/docs/reports/checklist-catalog-ops-mission-latest.md)
- [`docs/reports/checklist-catalog-ops-mission-latest.json`](/Users/Shared/Projects/classscout/docs/reports/checklist-catalog-ops-mission-latest.json)

Purpose:

- defines the continuous checklist-owned operating loop
- makes task cadence, retries, contracts, rollback behavior, and observability explicit
- prevents silent “nothing happened” periods from being treated as normal
- this is a transitional ClassScout-local artifact until the same contract is fully owned and emitted from the Checklist repo/runtime

### Catalog freshness watchdog

```bash
npm run catalog:watchdog
```

Optional thresholds:

- `--provider-silence-hours=<n>`
- `--meetup-silence-hours=<n>`
- `--stale-provider-hours=<n>`

Outputs:

- [`docs/reports/catalog-watchdog-latest.md`](/Users/Shared/Projects/classscout/docs/reports/catalog-watchdog-latest.md)
- [`docs/reports/catalog-watchdog-latest.json`](/Users/Shared/Projects/classscout/docs/reports/catalog-watchdog-latest.json)

Purpose:

- detects when no new provider rows land inside the target SLA window
- detects stale meetup coverage and stale provider backlog
- turns catalog silence into an explicit operational incident

### Mommy Poppins source harvest

### Scarcity report

```bash
npm run scarcity:report
```

Outputs:

- [`docs/reports/scarcity-report-latest.md`](/Users/Shared/Projects/classscout/docs/reports/scarcity-report-latest.md)
- [`docs/reports/scarcity-report-latest.json`](/Users/Shared/Projects/classscout/docs/reports/scarcity-report-latest.json)

Purpose:

- ranks category, borough, and neighborhood scarcity from the live public catalog
- recommends the next best slices for curation

### Live catalog audit

```bash
npm run catalog:audit
```

Output:

- [`docs/reports/catalog-audit-latest.md`](/Users/Shared/Projects/classscout/docs/reports/catalog-audit-latest.md)

Purpose:

- checks for image gaps
- checks recurring-program/tag contradictions
- flags ended recurring programs
- flags stale-year text risks
- flags curated-payload/live-row drift

### Standard curator release check

```bash
npm run curation:release-check
```

This runs the standard post-curation sequence:

1. curated payload audit
2. live catalog audit
3. scarcity report regeneration

This command is the preferred operator workflow after any batch that changes the live catalog because it leaves the generated audit and scarcity artifacts synchronized with production.

### Mommy Poppins one-time local AI feed

Run the full sequence:

```bash
npm run mommypoppins:capability-audit
npm run mommypoppins:inventory
npm run mommypoppins:lead-export -- --max-records 80
```

Purpose:

- produce a product-ideas audit from Mommy Poppins without copying UI directly
- collect a one-time lead corpus for the local AI content builder
- normalize dated and recurring events into ClassScout-compatible schedule targets

Important:

- this path creates generated artifacts only
- it is a discovery and lead-generation system, not a direct publish pipeline
- the intended steady state is for this discovery/export path to live on the Checklist side, with ClassScout only receiving prepared destination-ready writes

## Admin console workflows

Admin entry point:

- `/admin`

Auth flow:

1. `POST /api/admin/login`
2. browser stores the admin session cookie
3. subsequent admin API calls use the same origin cookie
4. `POST /api/admin/logout` clears it

The admin console can:

- create, patch, and delete providers
- create, patch, and delete meetup groups
- patch site content
- replace locations
- upload images to ImgBB

## Safe operating habits

- Do not commit `.env` or `.env.local`.
- Treat generated report files as snapshots; regenerate them instead of manually editing them.
- Keep curated payloads aligned with production when rows are intentionally removed or refreshed.
- If an official image cannot be sourced through the supported automated path, do not leave the curated row live as image-incomplete production content.
- Use `scripts/ingest-payloads/operations` only for one-off cleanup or migration actions, not for durable catalog rows.
