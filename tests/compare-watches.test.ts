import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/compare/route";
import { compareWatches } from "@/lib/services/compare-watches";
import { watchCatalog } from "@/lib/data/watch-catalog";
import { resolveWatch } from "@/lib/utils/resolve-watch";

function compareRequest(body: unknown): Request {
  return new Request("http://localhost/api/compare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

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

describe("POST /api/compare", () => {
  it("returns a comparison for two supported watches", async () => {
    const response = await POST(
      compareRequest({
        leftInput: "Rolex Air-King",
        rightInput: "Rolex Explorer"
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.comparison.left.id).toBe("rolex-air-king-126900");
    expect(payload.comparison.right.id).toBe("rolex-explorer-124270");
    expect(payload.comparison.keyDifferences.length).toBeGreaterThan(0);
  });

  it("rejects unsupported watches", async () => {
    const response = await POST(
      compareRequest({
        leftInput: "Grand Seiko Snowflake",
        rightInput: "Rolex Explorer"
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toContain("curated mechanical watch catalog");
  });

  it("rejects duplicate watch comparisons", async () => {
    const response = await POST(
      compareRequest({
        leftInput: "Rolex Explorer",
        rightInput: "124270 explorer"
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Choose two different watches");
  });

  it("rejects invalid request fields", async () => {
    const response = await POST(
      compareRequest({
        leftInput: "R",
        rightInput: "Rolex Explorer"
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("comparison request was invalid");
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: "{"
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("comparison request was invalid");
  });
});
