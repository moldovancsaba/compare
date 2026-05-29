# Mommy Poppins Capability Audit

Generated: 2026-05-28T15:12:35.044Z

## Recommended shortlist
1. Date-first event browsing — ADOPT
   Source: events (https://mommypoppins.com/events/1670/anywhere/all/tag/all/age/all/all/all/type/0/deals/0/near/all)
   Gap: missing
   Scope: medium
   Why: High family-discovery value with bounded implementation scope if built as a GDS-compliant public browse extension.
2. Event deals and free filters — ADOPT
   Source: events (https://mommypoppins.com/events/1670/anywhere/all/tag/all/age/all/all/all/type/0/deals/0/near/all)
   Gap: missing
   Scope: medium
   Why: Useful for parent planning, but should only land after a real event surface exists.
3. Structured route taxonomy for search surfaces — MAYBE
   Source: navigation (https://mommypoppins.com/)
   Gap: missing
   Scope: small
   Why: Useful mainly as an internal data/operations idea, not a direct end-user feature.
4. Structured provider self-submission funnel — MAYBE
   Source: submission (https://mommypoppins.com/mommy-poppins-business-listings)
   Gap: missing
   Scope: large
   Why: Operationally valuable for future supply growth, but only after moderation and quality gates are explicit.
5. Map-backed directory discovery — MAYBE
   Source: directory (https://mommypoppins.com/directory/1670/anywhere/all/type/all/age/0/deals/all)
   Gap: partial
   Scope: large
   Why: Potentially useful, but lower priority than event/date browsing because ClassScout already has limited map support.
6. Editorial-to-discovery article search — MAYBE
   Source: find (https://mommypoppins.com/find/1670/anywhere/all/cat/all/age/all)
   Gap: partial
   Scope: large
   Why: Useful once ClassScout accumulates enough editorial volume; not a near-term priority over catalog operations.

## Full findings
### Date-first event browsing
- Recommendation: adopt
- Gap status: missing
- ClassScout equivalent: ClassScout has `This Week` and upcoming rendering but not a first-class date-bar event browser.
- Observed behavior: Mommy Poppins exposes an event date bar with forward date browsing and calendar pickers for event discovery.
- Scores: user=0.90, gap=1.00, delivery=0.70, ops=0.80, total=0.87

### Event deals and free filters
- Recommendation: adopt
- Gap status: missing
- ClassScout equivalent: ClassScout does not expose price-sensitive event filters as a first-class discovery control.
- Observed behavior: Mommy Poppins exposes explicit route-level filters for free events and deals inside the calendar surface.
- Scores: user=0.80, gap=1.00, delivery=0.55, ops=0.75, total=0.79

### Structured route taxonomy for search surfaces
- Recommendation: maybe
- Gap status: missing
- ClassScout equivalent: ClassScout has discovery feature flags and scarcity targets but not a documented route-taxonomy contract for external source capture.
- Observed behavior: Mommy Poppins publishes explicit route-level search targets and region maps in client-side settings.
- Scores: user=0.35, gap=1.00, delivery=0.90, ops=0.95, total=0.71

### Structured provider self-submission funnel
- Recommendation: maybe
- Gap status: missing
- ClassScout equivalent: ClassScout has ingest/admin tooling but no public provider self-submission funnel.
- Observed behavior: Mommy Poppins Business Listings | Mommy Poppins - Things to Do with Kids Sorry, you need to enable JavaScript to visit this website.
- Scores: user=0.70, gap=1.00, delivery=0.45, ops=0.60, total=0.71

### Map-backed directory discovery
- Recommendation: maybe
- Gap status: partial
- ClassScout equivalent: ClassScout has provider map support inside profiles, but not map-first directory discovery.
- Observed behavior: Mommy Poppins directory pages ship map-marker payloads for browseable business discovery.
- Scores: user=0.65, gap=0.65, delivery=0.35, ops=0.55, total=0.57

### Editorial-to-discovery article search
- Recommendation: maybe
- Gap status: partial
- ClassScout equivalent: ClassScout has neighborhood-guide pages but not a dedicated editorial search surface.
- Observed behavior: Mommy Poppins provides a dedicated article/search surface with paged discovery and filtered guides.
- Scores: user=0.45, gap=0.65, delivery=0.30, ops=0.70, total=0.51

