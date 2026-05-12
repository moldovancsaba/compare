# {compare} User Manual

Version: `v0.2.0`

## Overview

{compare} helps users compare supported things by decision consequences instead of raw spec tables. The current live domains are mechanical watches and business services.

## Running A Comparison

1. Choose a comparison domain.
2. Enter or select two supported items.
3. Submit the comparison.
4. Read the instant verdict first, then use the evidence, recommendation signals, and detailed sections to understand the tradeoffs.

The app rejects duplicate, unsupported, or ambiguous inputs. For ambiguous watch families, it returns suggestions rather than silently choosing a variant.

## Result Sections

Comparison results include:
- Instant verdict
- Recommendation signals
- Evidence and confidence
- Decision drivers
- Real-world impact
- Ownership or adoption tradeoffs
- Best-fit buyer lenses
- Hidden downsides
- Better-value or adjacent alternatives
- Marketing-vs-reality analysis
- Market-positioning analysis when the active adapter has structured positioning data

The labels can vary by domain because each adapter owns its presentation language.

## Watch Collection Profiles

For mechanical watches, users can maintain an accountless collection profile in the browser.

Supported profile fields:
- owned watches
- wishlist watches
- sold watches
- preferred brands
- optional short notes

The profile is stored in `localStorage` on the current browser. It is not synced across devices and does not require an account.

When a watch comparison is submitted, the browser sends this local profile as context for that request. The watch adapter can then show collection-aware buyer guidance, gap/overlap insights, upgrade-path advice, and balance scoring.

Avoid putting sensitive personal details in profile notes.

## Watch Collector Intelligence

The watch profile panel can show:
- missing wearing roles
- redundant style coverage
- brand concentration
- size balance gaps
- date/no-date balance
- upgrade-path verdicts
- balance guidance across versatility, redundancy, formality, complication diversity, and ownership risk
- single-watch should-I-buy guidance
- conservative five-year ownership simulation for service planning, durability risk, exit liquidity, and ownership friction
- model-level market positioning for hype versus substance, collector respect, saturation, brand cachet, and liquidity context

Scores are decision aids, not grades. They are meant to reveal concentration and missing contrast before a purchase.

## Should-I-Buy Guidance

The watch profile panel includes a single-watch purchase check. Choose a supported watch and run the check to get:
- a `buy`, `consider`, or `skip` verdict
- value assessment
- collection overlap analysis
- emotional-fit notes
- ownership-risk notes
- five-year ownership simulation with service-cost bands, interval assumptions, confidence, freshness, and warnings
- market-positioning notes with provenance-aware hype/substance and collector-reputation framing
- alternatives when the candidate is weak or redundant

The report uses the saved local collection profile when available. If no profile exists, the report still works, but collection-overlap confidence is lower.

Ownership simulations use curated catalog metadata and broad ranges. They do not use live dealer listings, regional service quotes, taxes, insurance, or resale guarantees.

Market-positioning notes use curated model-level traits. They intentionally avoid live forum scraping and blanket brand stereotypes.

## Persistence

MongoDB is optional.

Without MongoDB:
- comparisons still work
- collection profiles stay local in the browser
- saved comparison pages are not persisted

With MongoDB:
- submitted comparisons can be saved
- stable `/compare/[slug]` pages can be served
- feedback can be recorded
- telemetry can be written
- Brain enrichment jobs can be queued

## Feedback

Result pages include feedback controls. Feedback is optional and is used to improve future comparison reasoning when persistence is configured.
