import { describe, expect, it } from "vitest";

import { compareWatches } from "@/lib/services/compare-watches";
import { watchCatalog } from "@/lib/data/watch-catalog";
import { resolveWatch } from "@/lib/utils/resolve-watch";

describe("resolveWatch", () => {
  it("matches a plain watch name", () => {
    const match = resolveWatch("Rolex Explorer");

    expect(match?.id).toBe("rolex-explorer-124270");
  });

  it("matches a supported product url", () => {
    const match = resolveWatch("https://www.tudorwatch.com/en/watches/pelagos/m25407n-0001");

    expect(match?.id).toBe("tudor-pelagos-39");
  });
});

describe("compareWatches", () => {
  it("returns all required output sections", () => {
    const left = watchCatalog[0];
    const right = watchCatalog[1];
    const result = compareWatches(left, right);

    expect(result.keyDifferences.length).toBeGreaterThan(0);
    expect(result.realWorldImpact.length).toBeGreaterThan(0);
    expect(result.whoShouldBuyWhich.length).toBe(3);
    expect(result.overpricedFeatures.length).toBeGreaterThan(0);
    expect(result.hiddenDownsides.length).toBeGreaterThan(0);
    expect(result.betterValueAlternative.length).toBeGreaterThan(0);
    expect(result.signalVsFluff.length).toBe(2);
  });
});
