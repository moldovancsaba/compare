# Data Source Governance

GitHub Project 16 is the SSOT for roadmap and delivery state. This document records the adapter data policy that implementation must follow.

## Source Tiers

- `official_source`: primary source controlled by the entity, vendor, venue, publisher, or institution being compared.
- `curated_fixture`: structured data maintained in a domain adapter fixture or database.
- `expert_rule`: deterministic rule authored for a domain, such as switching-cost or wearability heuristics.
- `community_signal`: aggregated owner, user, or practitioner sentiment.
- `market_signal`: pricing, resale, availability, uptime, or demand data from a timestamped market source.
- `user_supplied`: context entered or connected by the user.

## Freshness

Every adapter must define a freshness cadence. If a source does not carry a verification timestamp, evidence should use `freshness: "unknown"` and avoid high data-quality claims.

Adapters should lower confidence or add limitations when:
- pricing or availability may have changed,
- service terms, legal terms, or compliance claims are not timestamped,
- community or market signals are sampled too narrowly,
- user context needed for the recommendation is missing.

## Curation

Adapters must separate facts, deterministic rules, and editorial inference:
- facts come from source tiers such as `official_source` or `curated_fixture`,
- rules explain how facts become consequences,
- editorial inference is allowed, but must be labeled as inference in evidence metadata,
- missing data must be explicit when it affects the recommendation.

## Blocked Sources

Adapters must not use these as decision-grade evidence:
- uncited AI-generated summaries,
- affiliate-only ranking pages,
- anonymous single anecdotes treated as representative,
- scraped prices without capture timestamps,
- legal, security, or compliance claims without source documents.

## Domain Examples

Watches:
- Curated catalog specs can support fit and capability rules.
- Live market, resale, service-cost, and owner-sentiment claims need source timestamps or must be shown as missing-data limitations.

Services:
- Curated archetypes can compare delivery models, switching cost, contract risk, and implementation complexity.
- Vendor-specific prices, security claims, legal terms, and customer references need explicit source evidence before raising confidence.
