# Domain Adapter SDK

{compare} is generic in infrastructure and specific in reasoning. New comparison domains must be added as adapters, not as conditionals in the API, UI shell, persistence, or feedback paths.

## Adapter Contract

Every adapter implements `ComparisonDomainAdapter` from `src/types/comparison.ts`.

Required fields:
- `domain`: stable lowercase slug, such as `watches` or `services`.
- `label`: human-readable domain name.
- `description`: short UI description of what the adapter can compare.
- `examples`: supported example inputs used by recovery UI and tests.
- `inputHints`: adapter-owned left/right labels, placeholder, and helper text for the comparison form.
- `dataPolicy`: adapter-owned governance for source tiers, freshness, curation, blocked sources, and missing data.
- `resolve(input)`: maps user input to a generic `ComparisonEntity` or fails closed with an unresolved result.
- `compare(left, right, context?)`: returns a deterministic `GenericComparisonResult`.
- Optional comparison context: adapters may read their own context keys, such as the watch adapter's local collection profile and decision-intent profile, but shared platform code should treat context as opaque.

Resolver requirements:
- Resolve exact supported names, aliases, references, and source URLs when an adapter supports them.
- Tolerate only bounded typos that still produce one clear best match.
- Return `status: "unresolved"` with `suggestions` when input is ambiguous or unsupported.
- Never silently choose between close variants; ambiguity must produce a recovery path.

Data-policy requirements:
- Define every source tier the adapter may use, such as `official_source`, `curated_fixture`, `expert_rule`, `community_signal`, `market_signal`, or `user_supplied`.
- Assign a default confidence level to each tier.
- State the freshness cadence and optional stale-after window.
- Record manual curation rules that prevent claims from drifting into uncited facts.
- Block low-trust sources that should never drive recommendations.
- Standardize missing-data behavior and map it to low-confidence evidence when decision-relevant.

Result evidence requirements:
- `sectionLabels`: adapter-owned presentation labels for each generic section so domain language stays precise.
- `verdict.strongerChoice`: the recommended option stated directly.
- `verdict.exceptionCase`: when the other option is still the better fit.
- `verdict.confidenceRationale`: why the recommendation has clear, contextual, or close confidence.
- `evidenceSummary.overallConfidence`: coarse confidence in the final recommendation.
- `evidenceSummary.dataQuality`: coarse quality of the underlying adapter data.
- `evidenceSummary.evidence`: at least one evidence item explaining what the result is based on.
- `evidenceSummary.limitations`: explicit known gaps, especially missing live data or low-confidence assumptions.
- `recommendationSignals`: adapter-owned decisive guidance with best-overall, daily-use, value, depth/collector, avoid-if, or no-clear-winner signals.
- Optional `evidence` arrays on verdict picks, insight blocks, and buyer recommendations for claim-level provenance.

Evidence item kinds:
- `catalog_fact`: fixture-backed, database-backed, or otherwise structured facts controlled by the adapter.
- `derived_rule`: deterministic rules that translate data into consequences.
- `editorial_inference`: qualitative interpretation from curated metadata or expert rules.
- `external_source`: a cited external source reference.
- `missing_data`: an explicit absence that lowers confidence or limits the recommendation.

Confidence levels are `high`, `medium`, or `low`. Use `low` for known gaps and subjective claims that should not be presented as facts.

Entity requirements:
- `id`: stable entity id inside the domain.
- `domain`: the adapter domain.
- `label`: display name.
- `slug`: stable URL-safe slug.
- `aliases`: alternate names, references, or nicknames.
- `sourceUrl`: optional canonical source.
- `attributes`: optional structured facts used by adapter-specific rules.

## Required Tests

Every adapter must pass the shared conformance helper in `tests/support/domain-adapter-conformance.ts`.

The conformance suite verifies:
- stable metadata and examples
- adapter-owned UI description and input hints
- adapter-owned data policy for source tiers, freshness, curation, blocked sources, and missing data
- supported inputs resolve to generic entities
- unsupported inputs fail closed
- ambiguous inputs return suggestions instead of guessing when the adapter can identify close candidates
- comparison output is deterministic
- result shape contains all required generic sections
- verdict includes stronger choice, exception case, confidence rationale, and adapter-owned section labels
- recommendation signals include explicit picks, avoid-if guidance, and confidence wording
- result evidence includes valid confidence, data quality, evidence kinds, and limitations
- duplicate inputs resolve to the same entity so the generic compare service can reject them

Example:

```ts
import { describeDomainAdapterConformance } from "@/tests/support/domain-adapter-conformance";
import { serviceDomainAdapter } from "@/lib/domains/service-domain";

describeDomainAdapterConformance(serviceDomainAdapter, {
  validInputs: ["Service A", "Service B"],
  duplicateInput: "Service A",
  unresolvedInput: "Unknown Service"
});
```

## Registration

Register adapters in `src/lib/services/compare.ts`.

The registry is the only place that should know which domains are live. `/api/compare`, saved comparisons, Brain jobs, feedback, telemetry, and the result UI must continue to consume generic entity/domain fields.

## Adapter Boundaries

Adapters own:
- domain data
- data source governance and freshness assumptions
- resolver rules
- domain-specific scoring and tradeoff rules
- domain-specific discovery and alternative-ranking rules
- adapter examples
- adapter-owned UI copy for domain selector descriptions and input hints
- section copy that depends on domain expertise
- section labels and verdict framing for domain-specific decision confidence
- domain regression fixtures

Core platform owns:
- API request/response flow
- duplicate entity rejection
- domain selector rendering from adapter metadata
- persistence contracts
- Brain queue contracts
- feedback contracts
- generic result rendering
- opaque context transport from client/API to adapters
- conformance requirements

## Adding A Domain

1. Create a domain data source or curated fixture set.
2. Implement a domain entity mapper.
3. Implement the domain resolver.
4. Implement deterministic comparison rules.
5. Register the adapter in `src/lib/services/compare.ts`.
6. Add adapter-owned `dataPolicy`.
7. Add the conformance test.
8. Add adapter-specific regression tests.
9. Emit evidence metadata for facts, rules, inferences, sources, and missing data.
10. Document data source governance, confidence assumptions, and missing-data behavior.

## Governance Examples

Watch adapters should treat curated specs and canonical product URLs as facts, but live market price, service cost, resale, and owner-sentiment claims must either have source timestamps or appear as missing-data limitations.

Service adapters should treat service archetypes as curated fixtures unless a specific vendor source is verified. Vendor marketing, legal, compliance, uptime, and security claims need explicit source evidence before they can raise confidence.

Watch ownership metadata should use structured traits for service burden, comfort, durability, reliability, resale stability, bracelet quality, and strap versatility. If a watch is missing that profile, comparison copy must visibly lower confidence with missing-data evidence instead of pretending qualitative notes are complete.

Do not add a domain by branching on domain names inside `/api/compare` or shared UI components. If a shared component needs new behavior, expose it through the generic contract or adapter metadata.
