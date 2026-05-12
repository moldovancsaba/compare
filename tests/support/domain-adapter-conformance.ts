import { describe, expect, it } from "vitest";

import type {
  ComparisonDomainAdapter,
  ComparisonEntity,
  DataSourcePolicy,
  EvidenceItem,
  GenericComparisonResult
} from "@/types/comparison";

export interface DomainAdapterConformanceFixture {
  validInputs: readonly [string, string];
  duplicateInput: string;
  unresolvedInput: string;
}

function expectNonEmptyString(value: unknown): asserts value is string {
  expect(typeof value).toBe("string");
  expect((value as string).trim().length).toBeGreaterThan(0);
}

function expectEntity(entity: ComparisonEntity, domain: string) {
  expect(entity.domain).toBe(domain);
  expectNonEmptyString(entity.id);
  expectNonEmptyString(entity.label);
  expectNonEmptyString(entity.slug);
  expect(Array.isArray(entity.aliases)).toBe(true);
}

function expectDataPolicy(dataPolicy: DataSourcePolicy) {
  expectNonEmptyString(dataPolicy.summary);
  expect(dataPolicy.sourceTiers.length).toBeGreaterThan(0);
  expectNonEmptyString(dataPolicy.freshness.cadence);
  expect(dataPolicy.curationRules.length).toBeGreaterThan(0);
  expect(dataPolicy.blockedSourceTypes.length).toBeGreaterThan(0);
  expectNonEmptyString(dataPolicy.missingDataPolicy);

  for (const sourceTier of dataPolicy.sourceTiers) {
    expect([
      "official_source",
      "curated_fixture",
      "expert_rule",
      "community_signal",
      "market_signal",
      "user_supplied"
    ]).toContain(sourceTier.tier);
    expectNonEmptyString(sourceTier.description);
    expect(["high", "medium", "low"]).toContain(sourceTier.defaultConfidence);
  }
}

function expectInsightArray(items: Array<{ title: string; summary: string }>, sectionName: string) {
  expect(Array.isArray(items), `${sectionName} should be an array`).toBe(true);
  expect(items.length, `${sectionName} should not be empty`).toBeGreaterThan(0);

  for (const item of items) {
    expectNonEmptyString(item.title);
    expectNonEmptyString(item.summary);
  }
}

function expectEvidenceItem(item: EvidenceItem) {
  expectNonEmptyString(item.id);
  expect(["catalog_fact", "derived_rule", "editorial_inference", "external_source", "missing_data"]).toContain(item.kind);
  expect(["high", "medium", "low"]).toContain(item.confidence);
  expectNonEmptyString(item.label);
  expectNonEmptyString(item.detail);

  if (item.source) {
    expectNonEmptyString(item.source.label);
  }

  if (item.freshness) {
    expect(["current", "dated", "unknown"]).toContain(item.freshness);
  }
}

function expectEvidenceSummary(result: GenericComparisonResult) {
  expect(["high", "medium", "low"]).toContain(result.evidenceSummary.overallConfidence);
  expect(["high", "medium", "low"]).toContain(result.evidenceSummary.dataQuality);
  expect(result.evidenceSummary.evidence.length).toBeGreaterThan(0);
  expect(Array.isArray(result.evidenceSummary.limitations)).toBe(true);

  for (const item of result.evidenceSummary.evidence) {
    expectEvidenceItem(item);
  }
}

function expectComparisonResult(result: GenericComparisonResult, domain: string) {
  expect(result.domain).toBe(domain);
  expectEntity(result.leftEntity, domain);
  expectEntity(result.rightEntity, domain);
  expectNonEmptyString(result.canonicalInputA);
  expectNonEmptyString(result.canonicalInputB);
  expectNonEmptyString(result.verdict.bestOverall);
  expect(["clear", "contextual", "close"]).toContain(result.verdict.confidence);
  expectNonEmptyString(result.verdict.headline);
  expectNonEmptyString(result.verdict.summary);
  expect(result.verdict.picks.length).toBeGreaterThan(0);
  expectEvidenceSummary(result);

  for (const pick of result.verdict.picks) {
    expectNonEmptyString(pick.label);
    expectNonEmptyString(pick.pick);
    expectNonEmptyString(pick.reason);
  }

  expectInsightArray(result.keyDifferences, "keyDifferences");
  expectInsightArray(result.realWorldImpact, "realWorldImpact");
  expectInsightArray(result.ownershipIntelligence, "ownershipIntelligence");
  expect(result.whoShouldBuyWhich.length).toBeGreaterThan(0);

  for (const recommendation of result.whoShouldBuyWhich) {
    expectNonEmptyString(recommendation.buyerType);
    expectNonEmptyString(recommendation.pick);
    expectNonEmptyString(recommendation.reason);
  }

  expectInsightArray(result.overpricedFeatures, "overpricedFeatures");
  expectInsightArray(result.hiddenDownsides, "hiddenDownsides");
  expectInsightArray(result.signalVsFluff, "signalVsFluff");
  expect(Array.isArray(result.betterValueAlternative)).toBe(true);
}

export function describeDomainAdapterConformance(
  adapter: ComparisonDomainAdapter,
  fixture: DomainAdapterConformanceFixture
) {
  describe(`${adapter.domain} domain adapter conformance`, () => {
    it("exposes stable domain metadata and examples", () => {
      expect(adapter.domain).toMatch(/^[a-z][a-z0-9-]*$/);
      expectNonEmptyString(adapter.label);
      expectNonEmptyString(adapter.description);
      expectNonEmptyString(adapter.inputHints.leftLabel);
      expectNonEmptyString(adapter.inputHints.rightLabel);
      expectNonEmptyString(adapter.inputHints.placeholder);
      expectNonEmptyString(adapter.inputHints.helperText);
      expectDataPolicy(adapter.dataPolicy);
      expect(adapter.examples.length).toBeGreaterThanOrEqual(2);

      for (const example of adapter.examples) {
        expectNonEmptyString(example);
      }
    });

    it("resolves supported examples into generic comparison entities", () => {
      for (const input of fixture.validInputs) {
        const resolution = adapter.resolve(input);

        expect(resolution.status).toBe("resolved");
        if (resolution.status === "resolved") {
          expectEntity(resolution.entity, adapter.domain);
        }
      }
    });

    it("fails closed for unsupported input", () => {
      const resolution = adapter.resolve(fixture.unresolvedInput);

      expect(resolution.status).toBe("unresolved");
      if (resolution.status === "unresolved") {
        expectNonEmptyString(resolution.reason);
      }
    });

    it("returns deterministic generic comparison output for two resolved entities", () => {
      const leftResolution = adapter.resolve(fixture.validInputs[0]);
      const rightResolution = adapter.resolve(fixture.validInputs[1]);

      expect(leftResolution.status).toBe("resolved");
      expect(rightResolution.status).toBe("resolved");

      if (leftResolution.status !== "resolved" || rightResolution.status !== "resolved") {
        return;
      }

      const first = adapter.compare(leftResolution.entity, rightResolution.entity);
      const second = adapter.compare(leftResolution.entity, rightResolution.entity);

      expect(first).toEqual(second);
      expectComparisonResult(first, adapter.domain);
    });

    it("resolves duplicate inputs to the same generic entity", () => {
      const first = adapter.resolve(fixture.duplicateInput);
      const second = adapter.resolve(fixture.duplicateInput);

      expect(first.status).toBe("resolved");
      expect(second.status).toBe("resolved");

      if (first.status === "resolved" && second.status === "resolved") {
        expect(first.entity).toEqual(second.entity);
      }
    });
  });
}
