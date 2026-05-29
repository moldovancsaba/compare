# Curator Learnings

This file records the recurring curator rules, the mistakes that already reached production, and the cleanup patterns we now treat as standard.

## Stable rules

1. Derive `dayTimeTags` from the listing's own published schedule, not venue-wide hours.
2. Any source-backed Monday-Friday slot means `Weekday`.
3. Any source-backed Saturday/Sunday slot means `Weekend`.
4. Only add `Morning`, `Afternoon`, `Evening`, or `After-school` when the published times support them.
5. Only use `Weekend Friendly` when the listing itself has real source-backed weekend availability.
6. Use `recurringPrograms` when the provider has clearly repeating source-backed schedule detail that would otherwise be lost.
7. Curated production rows should not remain live with empty provider images or empty meetup cover images.
8. If a refreshed curated row cannot meet the image policy or source-strength bar, remove it instead of preserving a weak record.
9. For meetups, family relevance must be explicit enough to survive review. Generic community groups, adult support groups, or membership clubs are not automatically valid just because families may attend.

## Operating workflow

Before or after a meaningful curated batch:

1. Run `npm run audit:curated`.
2. Ingest with `npm run ingest:listing`.
3. Re-run `npm run catalog:audit`.
4. Re-run `npm run scarcity:report` if the live catalog changed.
5. Keep the curated payload corpus aligned with production when rows are intentionally removed or materially rewritten.

## Mistakes already seen

### Missing schedule-derived tags

- Example: a listing had a Friday slot but lacked `Weekday`.
- Fix pattern: correct `dayTimeTags`, re-run payload audit, then reingest with `--force` if needed.
- Lesson: schedule-derived tags are not optional flavor text; they are part of the structured data contract.

### `Weekend Friendly` on weekday-only listings

- Example: several listings were marked `Weekend Friendly` even though their actual listing schedules were weekday-only.
- Fix pattern: remove the badge or add `Weekend` only if the listing itself truly supports it.
- Lesson: tags and badges must agree with each other and with the source.

### Curated rows left live without official images

- Example: Brooklyn Public Library rows stayed live with empty provider images because automated image recovery was blocked.
- Fix pattern: delete the rows if the official image cannot be safely recovered through the supported flow.
- Lesson: curated production quality is higher than the permissive raw schema.

### Weak family-fit meetups

- Example: community pages centered on bereavement/support groups or family membership clubs were initially ingested as meetups.
- Fix pattern: remove the row when the family/kids fit is too weak or too indirect.
- Lesson: scarcity pressure is not a license to lower the ClassScout relevance bar.

### Stale source-backed claims

- Example: a row depended on an old PDF for detailed schedule or pricing even though the current landing page was less specific.
- Fix pattern: either rewrite the row to only use current defensible claims or delete it until fresher branch-specific evidence exists.
- Lesson: current evidence quality matters more than keeping coverage counts inflated.

## Cleanup patterns now considered normal

- Patch a live row when the source is still strong and the problem is wording or tag consistency.
- Delete a live row when the source is stale, the image path is blocked, or the family-fit case is too weak.
- Update or remove the original curated payload so the local corpus does not drift away from production.

## Review standard

The goal is not merely “ingest succeeded.” The steady-state target is:

- curated payload audit passes
- live catalog audit reports `No findings.`
- scarcity expansion remains source-first rather than count-first
