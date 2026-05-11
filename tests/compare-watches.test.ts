import { beforeEach, describe, expect, it } from "vitest";

import { GET as GET_BRAIN } from "@/app/api/compare/brain/route";
import { POST as POST_FEEDBACK } from "@/app/api/compare/feedback/route";
import { POST } from "@/app/api/compare/route";
import { compareRateLimit, resetRateLimitForTests } from "@/lib/security/rate-limit";
import { compareWatches } from "@/lib/services/compare-watches";
import { watchCatalog } from "@/lib/data/watch-catalog";
import { resolveWatch } from "@/lib/utils/resolve-watch";

function compareRequest(body: unknown, ip = "203.0.113.10"): Request {
  return new Request("http://localhost/api/compare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip
    },
    body: JSON.stringify(body)
  });
}

function feedbackRequest(body: unknown): Request {
  return new Request("http://localhost/api/compare/feedback", {
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

  it("matches a reference even when the brand is omitted", () => {
    const match = resolveWatch("124270 explorer");

    expect(match?.id).toBe("rolex-explorer-124270");
  });

  it("does not resolve generic brand-only input", () => {
    const match = resolveWatch("Rolex");

    expect(match).toBeNull();
  });

  it("does not pick a watch when the model input is ambiguous", () => {
    const match = resolveWatch("Tudor Black Bay");

    expect(match).toBeNull();
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
  beforeEach(() => {
    resetRateLimitForTests();
  });

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
    expect(payload.brain).toEqual({
      status: "disabled",
      comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
      message: "Trinity Brain is not enabled for this environment."
    });
  });

  it("keeps compare available when Trinity worker mode has no MongoDB connection", async () => {
    const previousProvider = process.env.COMPARE_BRAIN_PROVIDER;
    const previousMongoUri = process.env.MONGODB_URI;

    try {
      process.env.COMPARE_BRAIN_PROVIDER = "trinity_worker";
      delete process.env.MONGODB_URI;

      const response = await POST(
        compareRequest(
          {
            leftInput: "Rolex Air-King",
            rightInput: "Rolex Explorer"
          },
          "203.0.113.11"
        )
      );

      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.comparison.left.id).toBe("rolex-air-king-126900");
      expect(payload.brain).toEqual({
        status: "unavailable",
        comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
        message: "Trinity Brain needs MongoDB Atlas before it can enrich this result."
      });
    } finally {
      if (previousProvider === undefined) {
        delete process.env.COMPARE_BRAIN_PROVIDER;
      } else {
        process.env.COMPARE_BRAIN_PROVIDER = previousProvider;
      }

      if (previousMongoUri === undefined) {
        delete process.env.MONGODB_URI;
      } else {
        process.env.MONGODB_URI = previousMongoUri;
      }
    }
  });

  it("returns disabled Brain status when polling without Trinity worker mode", async () => {
    const response = await GET_BRAIN(
      new Request(
        "http://localhost/api/compare/brain?comparisonRef=compare:rolex-air-king-126900:vs:rolex-explorer-124270"
      )
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.brain).toEqual({
      status: "disabled",
      comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
      message: "Trinity Brain is not enabled for this environment."
    });
  });

  it("rejects Brain polling without a comparison ref", async () => {
    const response = await GET_BRAIN(new Request("http://localhost/api/compare/brain"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("comparisonRef");
  });

  it("accepts feedback without blocking when MongoDB is unavailable", async () => {
    const previousMongoUri = process.env.MONGODB_URI;

    try {
      delete process.env.MONGODB_URI;

      const response = await POST_FEEDBACK(
        feedbackRequest({
          comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
          leftWatchId: "rolex-air-king-126900",
          rightWatchId: "rolex-explorer-124270",
          traceRef: null,
          signal: "helpful"
        })
      );

      const payload = await response.json();

      expect(response.status).toBe(202);
      expect(payload.feedback).toEqual({
        status: "unavailable",
        message: "Feedback needs MongoDB Atlas before it can be stored."
      });
    } finally {
      if (previousMongoUri === undefined) {
        delete process.env.MONGODB_URI;
      } else {
        process.env.MONGODB_URI = previousMongoUri;
      }
    }
  });

  it("rejects invalid feedback payloads", async () => {
    const response = await POST_FEEDBACK(
      feedbackRequest({
        comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
        leftWatchId: "rolex-air-king-126900",
        rightWatchId: "rolex-explorer-124270",
        signal: "liked_the_blue_one"
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("feedback payload was invalid");
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
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.15"
        },
        body: "{"
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("comparison request was invalid");
  });

  it("rate limits repeated comparison requests from the same client", async () => {
    const requestBody = {
      leftInput: "Rolex Air-King",
      rightInput: "Rolex Explorer"
    };

    for (let index = 0; index < compareRateLimit.limit; index += 1) {
      const response = await POST(compareRequest(requestBody, "203.0.113.200"));

      expect(response.status).toBe(200);
    }

    const limitedResponse = await POST(compareRequest(requestBody, "203.0.113.200"));
    const payload = await limitedResponse.json();

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.headers.get("Retry-After")).toBeTruthy();
    expect(payload.error).toContain("Too many comparison requests");
  });
});
