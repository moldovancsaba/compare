# Client-Facing Positioning

This document explains how ClassScout should be described to families, providers, and partners.

## Product definition

ClassScout is a curated NYC discovery app for family activities.

It helps families browse:

- classes
- camps
- birthday parties
- drop-in activities
- meet-up groups

The product should be described as:

- curated
- local
- source-backed
- easy to browse

It should not be described as:

- a real-time marketplace
- a generic national directory
- a user-generated listing wall

## Family-facing explanation

The family user should understand:

- the app is focused on New York City
- the content is curated for usefulness
- browsing can start by category, neighborhood, or timing
- the product is meant to save time, not overwhelm them

Short positioning line:

`Curated local family finds across New York City.`

Longer explanation:

`Browse source-backed classes, camps, parties, and meet-ups by borough, neighborhood, and family need.`

## Provider-facing explanation

Provider or partner visitors should understand:

- ClassScout is a curated discovery surface
- listings are not implied to be instant or self-serve by default
- contact or listing CTAs lead to a human or operational follow-up path

Recommended language:

- `List your program`
- `Reach more NYC families with a featured listing`
- `Tell us about your classes, camps, or events`

Avoid suggesting:

- instant live publishing unless that flow actually exists
- open self-serve marketplace semantics unless the product truly supports them

## Trust positioning

Trust messaging should reinforce:

- local focus
- curated usefulness
- source-backed information

Avoid:

- promising complete coverage
- promising real-time freshness
- exposing internal pipeline details

## Architecture-safe explanation

Client-facing messaging should stay aligned with the actual product boundary:

- Checklist owns the intelligence and continuous operations loop
- ClassScout is the fast destination and viewer layer

This architecture should influence how we describe the product:

- smart because of preparation and curation
- fast because the webapp reads prepared data

It should not appear in the UI as technical implementation detail unless the user explicitly needs that information.

## Website usage explanation

High-level flow to communicate:

1. choose a category or location
2. refine with neighborhood, timing, or filters
3. save useful finds
4. compare options when planning

That is the main user story the website should support.

## Review checklist

Before shipping client-facing messaging, confirm:

- a first-time visitor can explain the product back in one sentence
- the copy does not over-promise freshness or coverage
- the trust language is concrete
- provider CTAs are explicit about what happens next
