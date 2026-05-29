# High-Confidence Backfill Targets

This document is the working queue for scarcity-driven catalog expansion. It should track the latest generated scarcity report rather than preserving older one-off batch plans.

Current source of truth:

- [`docs/reports/scarcity-report-latest.md`](/Users/Shared/Projects/classscout/docs/reports/scarcity-report-latest.md)

## Selection threshold

Only target slices where the next candidate is likely to have all of the following:

- an official source page on the organization or venue domain
- a credible NYC borough and canonical neighborhood fit
- a clearly child- or family-relevant audience
- enough schedule detail to support `dayTimeTags`
- enough detail to support supported enums without guessing
- an official image that can be uploaded to ImgBB

If the strictest scarcity slice fails those checks, skip it and move to the next highest-confidence slice.

## Current top queue

1. `Drop-In Activities / Bronx / Concourse`
   Reason: now the highest-ranked strict scarcity target after the latest production ingest, still sitting at zero coverage with room for strong official museum, garden, or family-program sources.

2. `Drop-In Activities / Bronx / Highbridge`
   Reason: another zero-count Bronx drop-in slice with cleaner odds of source-backed schedules than weaker meetup candidates.

3. `Drop-In Activities / Bronx / Hunts Point`
   Reason: still empty at the neighborhood slice and likely to support strong family programming from trusted local organizations.

4. `Camps / Bronx / Concourse`
   Reason: classes improved enough that Bronx camp coverage now outranks them in the strict scarcity report.

5. `Camps / Bronx / Highbridge`
   Reason: another zero-count camp slice with room for official, season-specific Bronx programs once current-year pages are available.

## Deprioritized targets

Avoid or delay:

- meetup slices where the likely candidates are generic civic groups, adult support groups, or membership clubs with weak family fit
- rows whose official source is too stale for the structured claims we need
- targets blocked on image recovery when no official ImgBB-compliant media path exists
- slices where the source is too vague to support age ranges, day/time tags, or recurring programs accurately

## Update rule

After meaningful production ingest or cleanup:

1. Run `npm run scarcity:report`.
2. Re-read the latest report.
3. Refresh this file if the top queue changed materially.

Do not leave outdated scarcity priorities in this document after the report has moved on.
