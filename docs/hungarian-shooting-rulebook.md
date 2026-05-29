# Hungarian Shooting Rulebook

This document is the implementation rulebook for turning RangeScout EU into a Hungary-first sport shooting operating system.

It replaces the inherited "scarcity-first kids activity curation" mindset with a source-governed collection system for:

- competitions
- club events
- training courses
- beginner classes
- federation calendars
- cups and hosted match series
- ranges
- clubs

The first delivery goal is not "collect everything."

The first delivery goal is:

1. define what can be collected safely
2. define how it is normalized
3. define which sources are trusted
4. define what qualifies for publish, review, retry, or rejection
5. make the workflow deterministic enough for Checklist automation

## Product stance

RangeScout EU should be architected for Europe, but the operational rollout starts in Hungary.

That means:

- Hungary is the first complete source-inventory market
- Hungarian federations and clubs drive the first normalization rules
- Hungarian competition and range coverage defines the MVP quality bar
- non-Hungarian coverage remains allowed, but secondary until the Hungarian rulebook is stable

## MVP entity scope

### Publish now

- `Competition`
- `Range`
- `Club`
- `Course`
- `Event`

### Design now, delay public rollout

- `Federation`
- `Discipline`
- `Gunsmith`
- `EquipmentInventory`
- `ShooterProfile`
- `ImportTravellerBoard`

These delayed entities must still shape the schema so we do not trap ourselves in a shallow listings model.

## Collection priority order

The collection system must not start from generic web search.

It must start from source classes in this order:

1. national federation sites
2. discipline-specific federation or association sites
3. official club websites and club social surfaces
4. official range websites and facility pages
5. official match-registration surfaces such as PractiScore
6. official PDF match notices, scorebooks, invitations, and rule bulletins
7. shop, sponsor, or organizer pages only when they are the primary host source
8. third-party aggregator pages only as discovery hints, never as sole publish evidence

## Hungary-first source classes

The source inventory must explicitly track these buckets:

### Federation sources

- MSSZ and discipline branches
- MDLSZ and related practical disciplines
- IPSC Hungary
- IDPA Hungary
- trap, skeet, black powder, cowboy, PRS, and hunting sport bodies where applicable

### Competition sources

- official federation calendars
- club competition pages
- PractiScore match pages
- downloadable invitations and match books
- Facebook event pages only when linked from an official organizer surface

### Club sources

- official club websites
- official membership pages
- official Facebook pages or groups when they act as the real operating surface
- federation club directories

### Range sources

- official venue websites
- venue pricing pages
- capability and rules pages
- booking pages
- Google Maps only as a verification hint, never as canonical capability evidence

### Course sources

- official instructor pages
- club training pages
- licence-preparation pages
- hunter education pages

## Source inventory contract

Every tracked source should be persisted as a source-inventory row with at least:

```ts
type SourceInventoryRow = {
  sourceId: string;
  countryCode: "HU" | string;
  sourceClass:
    | "federation"
    | "competition_surface"
    | "club_surface"
    | "range_surface"
    | "course_surface"
    | "registration_surface"
    | "document_surface";
  operatorName: string;
  operatorType?: "federation" | "club" | "range" | "trainer" | "shop" | "unknown";
  disciplineHints: string[];
  canonicalUrl: string;
  discoveryUrls: string[];
  trustTier: "official_primary" | "official_secondary" | "community_hint";
  fetchPolicy: "html" | "pdf" | "mixed" | "manual_only";
  robotsStatus: "allowed" | "blocked" | "unknown";
  requiresAuth: boolean;
  languageHints: string[];
  geoHints: string[];
  lastSeenAt?: string;
  freshnessSlaHours: number;
  notes?: string;
};
```

## Competition normalization contract

Every collected competition must normalize into a stable schema that hides source chaos.

```ts
type CompetitionRecord = {
  id: string;
  sourceId: string;
  sourceUrl: string;
  title: string;
  discipline:
    | "ipsc"
    | "idpa"
    | "prs"
    | "trap"
    | "skeet"
    | "cowboy_action"
    | "black_powder"
    | "hunting_shooting"
    | "multi";
  federation?: string;
  hostClub?: string;
  hostRange?: string;
  startAt: string;
  endAt?: string;
  timezone: "Europe/Budapest" | string;
  location: {
    countryCode: string;
    region?: string;
    city?: string;
    venueName?: string;
    addressText?: string;
  };
  registration: {
    mode: "practiscore" | "email" | "form" | "phone" | "onsite" | "unknown";
    url?: string;
    opensAt?: string;
    closesAt?: string;
    capacity?: number;
    squadBased?: boolean;
  };
  pricing: {
    currency?: string;
    feeAmount?: number;
    feeText?: string;
  };
  requirements: {
    federationMembershipRequired?: boolean;
    licenceRequired?: boolean;
    competitorIdRequired?: boolean;
    equipmentRestrictions?: string[];
  };
  documents: Array<{
    type: "invitation" | "match_book" | "rules" | "waiver" | "results" | "other";
    url: string;
  }>;
  confidence: "high" | "medium" | "low";
  reviewState: "draft" | "review_ready" | "published" | "blocked";
};
```

## Publish eligibility

### Competition publish minimum

- title present
- host organization or range present
- dated occurrence present
- registration path present or explicitly marked unavailable
- source evidence comes from an official or official-adjacent organizer surface
- discipline is explicit or defensibly inferred from source wording

### Club publish minimum

- official identity exists
- location or service area exists
- join/contact path exists
- activity fit is clearly sport shooting, hunting, or discipline training

### Range publish minimum

- official range identity exists
- location exists
- at least one verified capability exists
- contact or booking path exists

### Course publish minimum

- training identity exists
- provider identity exists
- schedule or recurring availability exists
- beginner / licensing / discipline intent is explicit

## Range capability matrix

Ranges must not be flattened into address cards.

Collection should explicitly seek:

- pistol lanes
- rifle lanes
- long-range support
- trap
- skeet
- IPSC suitability
- IDPA suitability
- PRS suitability
- cowboy / western suitability
- night shooting
- instructor availability
- rental firearms
- guest access policy
- membership requirement

When a capability is not source-backed, store it as unknown, not false.

## PractiScore policy

PractiScore is a mandatory bridge, not a replacement target.

### Allowed initial uses

- discover competition surfaces
- link registration pages
- capture match metadata
- capture squad/capacity hints where public

### Deferred uses

- account linking
- registration prefill
- unified registration abstraction

### Guardrail

PractiScore pages may enrich a competition record, but if the real host identity cannot be resolved, the record must stay review-only.

## Collection workflow

### Stage 1. Source inventory build

- create a durable inventory of official Hungarian shooting sources

### Stage 2. Surface classification

- classify each source page into federation, range, club, competition, course, or mixed operator

### Stage 3. Lead extraction

- extract candidate competitions, events, courses, clubs, and ranges

### Stage 4. Review packet generation

- produce deterministic review-ready drafts for Checklist

### Stage 5. Publish and freshness loop

- publish approved records and keep them fresh

## Extraction rules by entity

### Competitions and cups

Start from:

- federation calendars
- club event pages
- PractiScore
- invitations and match PDFs

Extract:

- title
- level / cup / qualifier hints
- discipline
- date window
- host club
- range
- location
- registration method
- fee
- required membership/licence
- linked documents

### Events

Start from:

- club calendars
- range news pages
- beginner open-day pages
- federation seminars

### Courses and classes

Start from:

- training pages
- licence-prep pages
- instructor schedules
- hunter education flows

### Clubs and groups

Start from:

- federation club directories
- official club sites
- official Facebook pages/groups if they are the de facto operating channel

## Retry, timeout, and recovery rules

- `html` source fetch timeout: 20s
- `pdf` fetch timeout: 30s
- parser retries: 2 with exponential backoff
- robots-blocked sources: mark `manual_only`, do not keep retrying automatically
- three consecutive extraction failures on the same source should open a Checklist incident
- empty batch results must not overwrite the last healthy lead export
- stale published competitions must degrade to hidden or expired state when source freshness cannot be revalidated

## Observability requirements

Every collection cycle should emit:

- source inventory counts by source class
- fetch success rate
- blocked source count
- extracted candidate count by entity type
- confidence distribution
- review-ready count
- publish success rate
- stale competition count
- unclassified source count

## Immediate implementation sequence

1. build the Hungary-first source inventory schema and artifact generator
2. define typed extraction strategies for competitions, courses, clubs, and ranges
3. replace scarcity-first discovery with source-inventory-first discovery
4. implement normalized competition and range contracts
5. add PractiScore bridge enrichment as a source adapter, not as the canonical source of truth
6. wire Checklist review packets to the new entity-specific diagnostics
7. ship public MVP around competitions, ranges, clubs, courses, and events
