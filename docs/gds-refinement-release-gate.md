# GDS Refinement Release Gate

This checklist is the release gate for the current GDS usability and client-clarity rollout.

Use it when shipping changes that touch:

- root theme selection
- app shell and navigation
- discover-page structure
- homepage structure
- client-facing explanation copy
- accessibility-sensitive UI states

## Automated checks

Run all required commands:

```bash
npm run gds:validate-manifest
npm run gds:check
npm run lint
npm test
npm run build
```

Expected result:

- every command passes with no unresolved errors

## Manual surface checks

Review these surfaces on desktop and mobile:

1. shell and navigation
2. homepage
3. discover page
4. empty states
5. provider CTA surfaces

## Manual QA checklist

### Shell and navigation

- header density feels compact and readable
- sidebar navigation is easy to scan
- mobile nav toggle works with keyboard and touch
- active states are obvious

### Homepage

- the user can understand what ClassScout is in one short read
- category entry points are obvious
- neighborhood entry points are understandable
- CTA hierarchy is clear

### Discover

- heading hierarchy is not duplicated or noisy
- search, sort, and filters are easy to scan
- result summaries are understandable
- empty states suggest a useful next step

### Accessibility

- keyboard navigation works across shell and primary browse controls
- focus states are visible
- headings are in sensible order
- controls have clear labels
- contrast remains acceptable after theme changes

### Client-facing clarity

- trust language is concrete
- copy does not over-promise real-time coverage
- provider CTA explains what happens next
- empty states are actionable instead of dead ends

## Live smoke check

Recommended:

```bash
npm run dev
```

Then verify at least:

- `GET /`
- one category page such as `/classes`
- `/this-week`
- `/meet-up-groups`

## Rollback conditions

Do not ship if any of these are true:

- GDS compliance fails
- build or tests fail
- keyboard navigation is broken in the shell or discover flow
- spacing regressions make the shell or browse surfaces materially harder to use
- copy changes reduce clarity or create false expectations

## Rollback path

1. revert the affected refinement slice
2. rerun the full automated checklist
3. re-verify the touched UI surfaces
4. ship only after all required checks pass again

## Notes

- visual polish is not enough on its own; accessibility and clarity are part of done
- if an exception is necessary, document it in `/Users/Shared/Projects/classscout/docs/design-system-adapter.md`
