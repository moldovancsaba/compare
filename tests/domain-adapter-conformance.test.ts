import { describe, expect, it } from "vitest";

import { watchDomainAdapter } from "@/lib/domains/watch-domain";
import { compareInputs, getComparisonDomainAdapter, supportedComparisonDomains } from "@/lib/services/compare";
import { describeDomainAdapterConformance } from "./support/domain-adapter-conformance";

describeDomainAdapterConformance(watchDomainAdapter, {
  validInputs: ["Rolex Air-King", "Rolex Explorer"],
  duplicateInput: "Rolex Explorer",
  unresolvedInput: "Definitely Not In Catalog"
});

describe("comparison domain registry", () => {
  it("registers the watch adapter as the default live domain", () => {
    expect(supportedComparisonDomains()).toContain("watches");
    expect(getComparisonDomainAdapter()).toBe(watchDomainAdapter);
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
});
