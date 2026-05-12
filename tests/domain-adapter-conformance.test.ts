import { describe, expect, it } from "vitest";

import { serviceDomainAdapter } from "@/lib/domains/service-domain";
import { watchDomainAdapter } from "@/lib/domains/watch-domain";
import {
  compareInputs,
  getComparisonDomainAdapter,
  supportedComparisonDomainOptions,
  supportedComparisonDomains
} from "@/lib/services/compare";
import { describeDomainAdapterConformance } from "./support/domain-adapter-conformance";

describeDomainAdapterConformance(watchDomainAdapter, {
  validInputs: ["Rolex Air-King", "Rolex Explorer"],
  duplicateInput: "Rolex Explorer",
  unresolvedInput: "Definitely Not In Catalog"
});

describeDomainAdapterConformance(serviceDomainAdapter, {
  validInputs: ["Managed Customer Support", "AI Support Automation"],
  duplicateInput: "support outsourcing",
  unresolvedInput: "Definitely Not A Service"
});

describe("comparison domain registry", () => {
  it("registers the watch adapter as the default live domain and services as a second adapter", () => {
    expect(supportedComparisonDomains()).toContain("watches");
    expect(supportedComparisonDomains()).toContain("services");
    expect(getComparisonDomainAdapter()).toBe(watchDomainAdapter);
    expect(supportedComparisonDomainOptions()).toContainEqual({
      domain: "watches",
      label: "Mechanical watches",
      description: watchDomainAdapter.description,
      examples: watchDomainAdapter.examples,
      inputHints: watchDomainAdapter.inputHints
    });
    expect(supportedComparisonDomainOptions()).toContainEqual({
      domain: "services",
      label: "Business services",
      description: serviceDomainAdapter.description,
      examples: serviceDomainAdapter.examples,
      inputHints: serviceDomainAdapter.inputHints
    });
  });

  it("keeps duplicate handling in the generic compare service", () => {
    expect(
      compareInputs({
        leftInput: "Rolex Explorer",
        rightInput: "124270 explorer"
      })
    ).toEqual({
      status: "duplicate_entity",
      domain: "watches",
      entity: expect.objectContaining({
        id: "rolex-explorer-124270",
        domain: "watches",
        label: "Rolex Explorer"
      })
    });
  });

  it("compares non-watch services through the generic compare service", () => {
    const result = compareInputs({
      domain: "services",
      leftInput: "Managed Customer Support",
      rightInput: "AI Support Automation"
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "completed",
        domain: "services"
      })
    );

    if (result.status !== "completed") {
      return;
    }

    expect(result.left.domain).toBe("services");
    expect(result.right.domain).toBe("services");
    expect(result.comparison.domain).toBe("services");
    expect(result.comparison.evidenceSummary.evidence).toContainEqual(
      expect.objectContaining({
        kind: "missing_data",
        confidence: "low"
      })
    );
    expect(result.comparison.realWorldImpact.map((block) => block.title)).toContain("Switching cost");
  });
});
