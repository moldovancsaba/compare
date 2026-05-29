# Hungarian Shooting Implementation Plan

This plan translates the Hungary-first rulebook into independently executable engineering work.

The target product is:

`RangeScout = the operating infrastructure layer for Hungarian sport shooting, with EU-scalable architecture`

## Delivery principles

- source inventory before broad scraping
- official sources before community mirrors
- deterministic normalization before AI-assisted enrichment
- Checklist-ready contracts before workflow expansion
- public MVP narrow, backend architecture wide

## Phase 1. Source and schema foundation

Outcome:

- Hungary-first source inventory exists
- core public entities have stable contracts
- ingestion can classify sources before extraction

Deliverables:

- source inventory schema
- source inventory refresh artifact
- entity contracts for competitions, ranges, clubs, courses, and events
- classification engine for source surfaces
- rulebook-backed diagnostics model

## Phase 2. Competition intelligence foundation

Outcome:

- official Hungarian competition data can be collected and normalized

Deliverables:

- federation and club competition collectors
- PractiScore enrichment bridge
- normalized competition schema
- registration and readiness metadata contract
- review packet generation for competition drafts

## Phase 3. Range and club intelligence

Outcome:

- public inventory moves beyond event listings into durable ecosystem infrastructure

Deliverables:

- range capability matrix extraction
- club profile normalization
- beginner-friendly and discipline coverage hints
- stale listing recheck logic for operator surfaces

## Phase 4. Public MVP experience

Outcome:

- users can browse Hungarian competitions, ranges, clubs, courses, and events through a GDS-only accessible UI

Deliverables:

- country and region discovery
- competition detail pages
- range capability display
- club and course detail views
- empty/loading/error/retry states
- operator-facing provenance and freshness surfaces

## Phase 5. Platform moat seeds

Design-now, delay-public pieces:

- federation profiles
- discipline discovery and onboarding
- readiness scoring
- shooter identity
- gunsmith directory
- equipment intelligence

## First collection focus

The first collection implementation should prioritize these inventory slices:

1. federation calendars and directories
2. official club sites with event pages
3. official range sites with capability pages
4. official training/course pages
5. PractiScore-linked match pages

## Board operating rule

All GitHub issues for this program should follow the canonical production-grade structure from:

`https://github.com/sovereignsquad/general-design-system/issues/81`
