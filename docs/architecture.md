# Architecture

This document is the repo-level source of truth for the current ClassScout application shape.

For design, UI, and UX rules, this file is not authoritative. The SSOT is the [General Design System repository](https://github.com/sovereignsquad/general-design-system), and [`docs/design-system-adapter.md`](/Users/Shared/Projects/classscout/docs/design-system-adapter.md) is the local implementation adapter.

## Runtime stack

- Framework: Next.js App Router
- Database: MongoDB
- Stored raster media: ImgBB
- Validation: provider schema validation, meetup schema validation, curated semantic payload checks, and ImgBB URL policy checks
- Optional automation: scarcity-aware curator discovery and ingest

## UI architecture status

Current UI foundation:

- Mantine root runtime in [`src/app/providers.tsx`](/Users/Shared/Projects/classscout/src/app/providers.tsx)
- shared `@doneisbetter/gds-theme` provider/runtime consumed from the public GDS `gds-v2.6.4` release asset tarballs
- official `createPublicBrandTheme({ flatSurfaces: true })` lane in [`src/theme/mantineTheme.ts`](/Users/Shared/Projects/classscout/src/theme/mantineTheme.ts)
- direct `@doneisbetter/gds-core` / `@doneisbetter/gds-admin` package consumption for docs shells, state surfaces, stats summaries, public footer composition, admin page sections, responsive data views, and the primary discovery shell/navigation stack
- global product tokens and base styles in [`src/app/globals.css`](/Users/Shared/Projects/classscout/src/app/globals.css), with Mantine and the published GDS packages as the only active UI runtime authority

Target UI foundation:

- Mantine-only for product UI, as defined by the GDS Foundation, Governance, Theme Governance, and Adoption docs in the [General Design System repository](https://github.com/sovereignsquad/general-design-system)
- no local shell, navigation system, or raw theme-fork layer when GDS already ships the canonical primitive

## Core collections

ClassScout persists four main MongoDB collections:

- `providers`
- `meetupGroups`
- `locations`
- `site`

The collection names are wired through [`src/lib/mongodb.ts`](/Users/Shared/Projects/classscout/src/lib/mongodb.ts).

## Main entity shapes

### Provider

Defined in [`src/types/provider.ts`](/Users/Shared/Projects/classscout/src/types/provider.ts).

Key points:

- Categories are limited to `Classes`, `Camps`, `Birthday Parties`, and `Drop-In Activities`.
- Schedule classification lives in top-level `dayTimeTags`.
- Repeating schedules can additionally be expressed in `recurringPrograms`.
- Stored provider image fields must be ImgBB-hosted HTTPS URLs when non-empty.

### Meetup group

Defined in [`src/types/meetup.ts`](/Users/Shared/Projects/classscout/src/types/meetup.ts).

Key points:

- Meetups are modeled separately from providers.
- `groupType`, `cadence`, `ageRange`, `icon`, and `palette` are all enum-like constrained values.
- `coverImageUrl` is optional at the raw type level, but curated production rows should keep it populated.

### Site document

Defined in [`src/types/site.ts`](/Users/Shared/Projects/classscout/src/types/site.ts).

Key points:

- The site content document is stored as `_id: "main"`.
- `mergeSiteDocument` fills in defaults when DB content is partial or missing.
- Site-managed content includes hero copy, guides, trust blocks, newsletter copy, and account/dashboard copy.

## API layers

### Public APIs

Route files:

- [`src/app/api/public/providers/route.ts`](/Users/Shared/Projects/classscout/src/app/api/public/providers/route.ts)
- [`src/app/api/public/meetup-groups/route.ts`](/Users/Shared/Projects/classscout/src/app/api/public/meetup-groups/route.ts)
- [`src/app/api/public/locations/route.ts`](/Users/Shared/Projects/classscout/src/app/api/public/locations/route.ts)
- [`src/app/api/public/site/route.ts`](/Users/Shared/Projects/classscout/src/app/api/public/site/route.ts)

Behavior:

- Public providers and meetups require MongoDB and return `503` when DB is unavailable.
- Public locations and site can fall back to bundled defaults when DB content is absent.

### Ingest APIs

Route files:

- [`src/app/api/ingest/route.ts`](/Users/Shared/Projects/classscout/src/app/api/ingest/route.ts)
- [`src/app/api/ingest/upload/route.ts`](/Users/Shared/Projects/classscout/src/app/api/ingest/upload/route.ts)

Behavior:

- `GET /api/ingest` returns an authenticated capability summary for clients and scripts.
- Auth is via `Authorization: Bearer <INGEST_API_KEY>` or `X-Ingest-Key`.
- `POST /api/ingest` supports batched reads and writes over providers, meetup groups, site, and locations.
- Batch requests are limited to 100 operations.
- Bulk collection writes support `upsertMany`, `replaceAll`, and `deleteMany` with explicit size limits enforced in `applyIngestOperation`.
- `POST /api/ingest/upload` uploads a multipart `file` to ImgBB.

The operation semantics are implemented in [`src/lib/ingestOperations.ts`](/Users/Shared/Projects/classscout/src/lib/ingestOperations.ts).

### Admin APIs

Route files:

- [`src/app/api/admin/login/route.ts`](/Users/Shared/Projects/classscout/src/app/api/admin/login/route.ts)
- [`src/app/api/admin/logout/route.ts`](/Users/Shared/Projects/classscout/src/app/api/admin/logout/route.ts)
- [`src/app/api/admin/providers/route.ts`](/Users/Shared/Projects/classscout/src/app/api/admin/providers/route.ts)
- [`src/app/api/admin/meetup-groups/route.ts`](/Users/Shared/Projects/classscout/src/app/api/admin/meetup-groups/route.ts)
- [`src/app/api/admin/site/route.ts`](/Users/Shared/Projects/classscout/src/app/api/admin/site/route.ts)
- [`src/app/api/admin/locations/route.ts`](/Users/Shared/Projects/classscout/src/app/api/admin/locations/route.ts)
- [`src/app/api/admin/upload/route.ts`](/Users/Shared/Projects/classscout/src/app/api/admin/upload/route.ts)

Behavior:

- Admin auth is cookie-based.
- Admin routes mostly mirror ingest write capabilities, but are oriented around browser console use.
- Admin meetup writes now enforce the same meetup shape validation as ingest writes.

## Validation and policy

### Provider validation

- Runtime validation entry point: [`src/lib/providerValidation.ts`](/Users/Shared/Projects/classscout/src/lib/providerValidation.ts)
- Backing schema: [`src/lib/curator/providerSchema.ts`](/Users/Shared/Projects/classscout/src/lib/curator/providerSchema.ts)

Important:

- Provider validation is strict and rejects unsupported enum values or malformed recurring programs.
- Image validation is enforced separately through [`src/lib/imgbbUrl.ts`](/Users/Shared/Projects/classscout/src/lib/imgbbUrl.ts).

### Curated payload quality

Semantic curated checks live in:

- [`scripts/lib/curated-payload-quality.cjs`](/Users/Shared/Projects/classscout/scripts/lib/curated-payload-quality.cjs)
- [`scripts/audit-curated-payloads.cjs`](/Users/Shared/Projects/classscout/scripts/audit-curated-payloads.cjs)

These checks enforce requirements the raw schema does not fully express, such as:

- recurring-program-derived day/time tags
- `Weekend Friendly` consistency
- family-fit quality for meetups
- non-empty curated production images

They are intentionally stricter than the permissive raw app types because curated production rows are expected to meet a higher data-quality bar.

### Meetup validation

- Runtime validation entry point: [`src/lib/meetupValidation.ts`](/Users/Shared/Projects/classscout/src/lib/meetupValidation.ts)
- Backing schema: [`src/lib/meetupSchema.ts`](/Users/Shared/Projects/classscout/src/lib/meetupSchema.ts)

Meetup upserts, patches, and bulk writes are now shape-validated in both ingest and admin paths, instead of only validating image hosts.

That means unsupported meetup enums and malformed curated meetup documents are rejected before they reach MongoDB.

## Curator automation

Automation entry points:

- Cron route: [`src/app/api/cron/curator/route.ts`](/Users/Shared/Projects/classscout/src/app/api/cron/curator/route.ts)
- Local runner: [`scripts/run-curator-once.ts`](/Users/Shared/Projects/classscout/scripts/run-curator-once.ts)
- Checklist catalog-ops mission spec: [`src/lib/catalogOps/contracts.ts`](/Users/Shared/Projects/classscout/src/lib/catalogOps/contracts.ts)
- Catalog freshness watchdog: [`src/lib/catalogOps/watchdog.ts`](/Users/Shared/Projects/classscout/src/lib/catalogOps/watchdog.ts)

Current scope:

- Automated discovery produces provider documents only.
- Manual curation can produce both providers and meetup groups.
- Checklist is now the intended owner for the broader continuous loop:
  source inventory refresh, lead export generation, local AI draft build, review packet submission, publish freshness detection, stale listing rechecks, and webapp quality audits.
- ClassScout should be treated as the thin destination reader over prepared Mongo rows.
- `src/lib/catalogOps/*`, `src/lib/mommyPoppins/*`, and the legacy content-intelligence bridge code are transitional support surfaces, not the long-term orchestration home.

## Competitive source harvest artifacts

The Mommy Poppins competitive-source path is implemented as generated artifacts, not live content replication:

- inventory builder: [`src/lib/mommyPoppins/sourceInventory.ts`](/Users/Shared/Projects/classscout/src/lib/mommyPoppins/sourceInventory.ts)
- capability audit: [`src/lib/mommyPoppins/capabilityAudit.ts`](/Users/Shared/Projects/classscout/src/lib/mommyPoppins/capabilityAudit.ts)
- local AI lead export: [`src/lib/mommyPoppins/localAiFeed.ts`](/Users/Shared/Projects/classscout/src/lib/mommyPoppins/localAiFeed.ts)

Output artifacts:

- [`docs/reports/mommypoppins-capability-audit-latest.json`](/Users/Shared/Projects/classscout/docs/reports/mommypoppins-capability-audit-latest.json)
- [`docs/reports/mommypoppins-nyc-source-inventory-latest.json`](/Users/Shared/Projects/classscout/docs/reports/mommypoppins-nyc-source-inventory-latest.json)
- [`docs/reports/mommypoppins-local-ai-leads-latest.ndjson`](/Users/Shared/Projects/classscout/docs/reports/mommypoppins-local-ai-leads-latest.ndjson)
- [`docs/reports/mommypoppins-normalized-events-latest.json`](/Users/Shared/Projects/classscout/docs/reports/mommypoppins-normalized-events-latest.json)

## Media policy

All stored raster media should be ImgBB-hosted HTTPS URLs when non-empty:

- provider `image`
- provider `galleryImages`
- meetup `coverImageUrl`
- site image fields

Curated production work should not treat empty image fields as an acceptable steady-state outcome.

## Current generated artifacts

These files are generated artifacts and should be treated as snapshots, not hand-edited documentation:

- [`docs/reports/scarcity-report-latest.md`](/Users/Shared/Projects/classscout/docs/reports/scarcity-report-latest.md)
- [`docs/reports/scarcity-report-latest.json`](/Users/Shared/Projects/classscout/docs/reports/scarcity-report-latest.json)
- [`docs/reports/catalog-audit-latest.md`](/Users/Shared/Projects/classscout/docs/reports/catalog-audit-latest.md)

## Payload corpus policy

The curated payload filesystem now has two roles:

- `scripts/ingest-payloads/catalog`: durable listing payload corpus that can be replayed into Mongo
- `scripts/ingest-payloads/operations`: one-off cleanup and migration payloads that must not be replayed by restore tooling
