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
- `resolve(input)`: maps user input to a generic `ComparisonEntity` or fails closed with an unresolved result.
- `compare(left, right)`: returns a deterministic `GenericComparisonResult`.

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
- supported inputs resolve to generic entities
- unsupported inputs fail closed
- comparison output is deterministic
- result shape contains all required generic sections
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
- resolver rules
- domain-specific scoring and tradeoff rules
- adapter examples
- adapter-owned UI copy for domain selector descriptions and input hints
- section copy that depends on domain expertise
- domain regression fixtures

Core platform owns:
- API request/response flow
- duplicate entity rejection
- domain selector rendering from adapter metadata
- persistence contracts
- Brain queue contracts
- feedback contracts
- generic result rendering
- conformance requirements

## Adding A Domain

1. Create a domain data source or curated fixture set.
2. Implement a domain entity mapper.
3. Implement the domain resolver.
4. Implement deterministic comparison rules.
5. Register the adapter in `src/lib/services/compare.ts`.
6. Add the conformance test.
7. Add adapter-specific regression tests.
8. Document data source governance, confidence assumptions, and missing-data behavior.

Do not add a domain by branching on domain names inside `/api/compare` or shared UI components. If a shared component needs new behavior, expose it through the generic contract or adapter metadata.
