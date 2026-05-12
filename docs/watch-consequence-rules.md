# Watch Consequence Rules

GitHub Project 16 remains the SSOT for task state. This document records the deterministic watch heuristics used by the current adapter.

## Rule Scope

These rules translate watch attributes into practical ownership implications. They are not medical, ergonomic, financial, or investment advice.

## Current Heuristics

- Wrist presence: case diameter and lug-to-lug estimate whether a watch is compact, balanced, or noticeably present.
- Cuff fit: thickness estimates whether the watch slides under cuffs, works with casual cuffs, or sits proud under fitted sleeves.
- Wrist-size sensitivity: lug-to-lug estimates how risky the watch is on smaller wrists.
- Service friction: structured ownership metadata maps service burden into long-term budget expectations.
- Versatility: style taxonomy estimates whether the watch suits office, travel, casual, or sport-first use.
- Travel readiness: power reserve and water resistance estimate rotation forgiveness and normal-trip confidence.

## Confidence

The rules are deterministic and intentionally narrow. If a watch lacks structured ownership metadata, comparison copy must surface that limitation with low-confidence missing-data evidence.

## Tradeoff Simulator Weights

The watch tradeoff simulator is a local what-if overlay on the baseline verdict. It does not replace the deterministic recommendation.

Controls:
- `budgetSensitivity`: rewards lower MSRP bands.
- `wristComfort`: rewards compact diameter, thinness, shorter lug-to-lug, micro-adjust, and lighter weight feel.
- `dressVersatility`: rewards explorer and dress-sport roles, thinner cases, no-date dials, and high strap versatility.
- `resaleImportance`: rewards structured resale-stability metadata.
- `ruggedness`: rewards water resistance, tool durability, micro-adjust, and anti-magnetism.
- `brandNeutrality`: rewards lower status-signaling pressure from structured market-positioning metadata.

Scenario state serializes as six digits in control order, each `0` to `5`. For example, `543210` means strict budget sensitivity, high wrist comfort, neutral dress versatility, lower resale importance, low ruggedness, and no brand-neutrality pressure.

Scenario telemetry records only control numbers, compared entity IDs, scenario pick ID, and whether the pick changed from baseline.

## Transparent Value Score

The watch adapter exposes a deterministic value score in comparison output. The score is a decision aid, not a resale estimate or investment rating.

Weights:
- comfort: 25%
- capability: 20%
- versatility: 20%
- ownership: 20%
- price discipline: 15%

Component inputs come from curated watch fields such as case size, thickness, lug-to-lug, micro-adjust, water resistance, power reserve, structured ownership metadata, market positioning, and MSRP bands.

## Secondary-Market Ownership

Secondary-market intelligence uses manually curated dated snapshots. It does not scrape live listings and must not be framed as investment advice.

Required fields when present:
- estimated market price in USD
- market-price date
- one-year trend percentage
- liquidity tier
- source label and URL
- confidence label

The adapter shows premium/discount to retail, trend, liquidity, freshness, source, and uncertainty only when enough data exists. Stale snapshots lower confidence and surface warnings.
