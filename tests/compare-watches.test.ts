import { beforeEach, describe, expect, it } from "vitest";

import { GET as GET_BRAIN } from "@/app/api/compare/brain/route";
import { POST as POST_FEEDBACK } from "@/app/api/compare/feedback/route";
import { POST } from "@/app/api/compare/route";
import { hashLogValue, sanitizeLogContext } from "@/lib/observability/logger";
import { recordTelemetryEvent, sanitizeTelemetryProperties } from "@/lib/observability/telemetry";
import { compareRateLimit, resetRateLimitForTests } from "@/lib/security/rate-limit";
import { readComparisonResponse, requestComparison } from "@/lib/services/compare-client";
import { compareWatches } from "@/lib/services/compare-watches";
import { watchCatalog } from "@/lib/data/watch-catalog";
import { resolveWatch } from "@/lib/utils/resolve-watch";
import type { ComparisonResult, WatchSpec } from "@/types/watch";

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

function watchById(id: string): WatchSpec {
  const watch = watchCatalog.find((candidate) => candidate.id === id);

  if (!watch) {
    throw new Error(`Missing watch fixture: ${id}`);
  }

  return watch;
}

type ComparisonRegressionFixture = {
  name: string;
  leftId: string;
  rightId: string;
  expectedBuyerPicks: Record<string, string>;
  expectedBetterValueAlternative: string;
  expectedHiddenDownsideTitles: string[];
  expectedFragments: string[];
};

const comparisonRegressionFixtures: ComparisonRegressionFixture[] = [
  {
    name: "Rolex Air-King 126900 vs Rolex Explorer 124270",
    leftId: "rolex-air-king-126900",
    rightId: "rolex-explorer-124270",
    expectedBuyerPicks: {
      "One-watch owner": "Rolex Explorer",
      "Tool-watch enthusiast": "Rolex Air-King",
      "Value-focused collector": "Rolex Explorer"
    },
    expectedBetterValueAlternative: "Omega Seamaster Aqua Terra 38",
    expectedHiddenDownsideTitles: [
      "Rolex Air-King dial personality tradeoff",
      "Rolex Explorer size expectation tradeoff"
    ],
    expectedFragments: ["40 mm", "48 mm", "11.5 mm", "$200", "aviation heritage"]
  },
  {
    name: "Tudor Black Bay 54 vs Tudor Black Bay 58",
    leftId: "tudor-black-bay-54",
    rightId: "tudor-black-bay-58",
    expectedBuyerPicks: {
      "One-watch owner": "Tudor Black Bay 58",
      "Tool-watch enthusiast": "Tudor Black Bay 54",
      "Value-focused collector": "Tudor Black Bay 54"
    },
    expectedBetterValueAlternative: "Tudor Pelagos 39",
    expectedHiddenDownsideTitles: ["Tudor Black Bay 58 fit downside"],
    expectedFragments: ["39 mm", "47.5 mm", "11.2 mm", "$300", "heritage riveted bracelet"]
  },
  {
    name: "Omega Seamaster Aqua Terra 38 vs Tudor Pelagos 39",
    leftId: "omega-aqua-terra-38",
    rightId: "tudor-pelagos-39",
    expectedBuyerPicks: {
      "One-watch owner": "Omega Seamaster Aqua Terra 38",
      "Tool-watch enthusiast": "Tudor Pelagos 39",
      "Value-focused collector": "Tudor Pelagos 39"
    },
    expectedBetterValueAlternative: "Tudor Black Bay 54",
    expectedHiddenDownsideTitles: [
      "Omega Seamaster Aqua Terra 38 fit downside",
      "Omega Seamaster Aqua Terra 38 profile downside",
      "Omega Seamaster Aqua Terra 38 dial tradeoff"
    ],
    expectedFragments: ["39 mm", "47 mm", "11.8 mm", "$1,700", "Master Chronometer"]
  },
  {
    name: "Rolex Explorer 124270 vs Omega Seamaster Aqua Terra 38",
    leftId: "rolex-explorer-124270",
    rightId: "omega-aqua-terra-38",
    expectedBuyerPicks: {
      "One-watch owner": "Rolex Explorer",
      "Tool-watch enthusiast": "Omega Seamaster Aqua Terra 38",
      "Value-focused collector": "Omega Seamaster Aqua Terra 38"
    },
    expectedBetterValueAlternative: "Tudor Black Bay 54",
    expectedHiddenDownsideTitles: [
      "Rolex Explorer size expectation tradeoff",
      "Omega Seamaster Aqua Terra 38 fit downside",
      "Omega Seamaster Aqua Terra 38 profile downside",
      "Omega Seamaster Aqua Terra 38 dial tradeoff"
    ],
    expectedFragments: ["38 mm", "45 mm", "11.5 mm", "$650", "mountain expedition DNA"]
  }
];

function flattenedComparisonCopy(result: ComparisonResult): string {
  return [
    ...result.keyDifferences,
    ...result.realWorldImpact,
    ...result.overpricedFeatures,
    ...result.hiddenDownsides,
    ...result.betterValueAlternative,
    ...result.signalVsFluff
  ]
    .map((block) => `${block.title} ${block.summary}`)
    .join("\n");
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

  it.each(comparisonRegressionFixtures)(
    "keeps regression-critical output stable for $name",
    ({
      leftId,
      rightId,
      expectedBuyerPicks,
      expectedBetterValueAlternative,
      expectedHiddenDownsideTitles,
      expectedFragments
    }) => {
      const result = compareWatches(watchById(leftId), watchById(rightId));
      const copy = flattenedComparisonCopy(result);

      expect(result.keyDifferences.map((block) => block.title)).toEqual([
        "Wrist presence",
        "Use-case bias",
        "Capability gap",
        "Price delta"
      ]);
      expect(result.realWorldImpact.map((block) => block.title)).toEqual([
        "All-day comfort",
        "Temperature and swelling",
        "Perceived heft"
      ]);
      expect(result.signalVsFluff.map((block) => block.title)).toEqual([
        "Meaningful difference",
        "Mostly marketing"
      ]);

      for (const [buyerType, pick] of Object.entries(expectedBuyerPicks)) {
        expect(result.whoShouldBuyWhich).toContainEqual(
          expect.objectContaining({
            buyerType,
            pick
          })
        );
      }

      expect(result.betterValueAlternative[0]?.title).toBe(expectedBetterValueAlternative);
      expect(result.hiddenDownsides.map((block) => block.title)).toEqual(expectedHiddenDownsideTitles);

      for (const fragment of expectedFragments) {
        expect(copy).toContain(fragment);
      }
    }
  );
});

describe("Trinity feedback summaries", () => {
  it("rolls visitor feedback into durable signal counts", async () => {
    // The worker helper is plain Node ESM so the runtime script can execute without a TS build step.
    // @ts-expect-error TypeScript does not resolve declarations for this local .mjs worker helper.
    const { applyFeedbackSignal } = await import("../scripts/trinity-feedback-summary.mjs");
    const firstSummary = applyFeedbackSignal(null, {
      signal: "helpful",
      createdAt: "2026-05-11T18:00:00.000Z",
      traceRef: "trace-1"
    });
    const secondSummary = applyFeedbackSignal(firstSummary, {
      signal: "chose_right",
      createdAt: "2026-05-11T18:05:00.000Z",
      note: "Explorer fit better."
    });

    expect(secondSummary.total).toBe(2);
    expect(secondSummary.bySignal).toEqual({
      helpful: 1,
      chose_right: 1
    });
    expect(secondSummary.choiceCounts).toEqual({
      left: 0,
      right: 1
    });
    expect(secondSummary.sentimentScore).toBe(2);
    expect(secondSummary.latestSignal).toBe("chose_right");
    expect(secondSummary.latestNote).toBe("Explorer fit better.");
  });
});

describe("structured logging", () => {
  it("redacts sensitive context before logs are written", () => {
    const sanitized = sanitizeLogContext({
      comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
      leftInput: "Rolex Air-King",
      mongodbUri: "mongodb+srv://user:pass@example.mongodb.net/compare",
      authorization: "Bearer secret",
      nested: {
        note: "private user note",
        watchId: "rolex-explorer-124270"
      },
      error: new Error("database password rejected")
    });

    expect(sanitized).toEqual({
      comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
      leftInput: "[redacted]",
      mongodbUri: "[redacted]",
      authorization: "[redacted]",
      nested: {
        note: "[redacted]",
        watchId: "rolex-explorer-124270"
      },
      error: {
        name: "Error"
      }
    });
  });

  it("uses stable hashes for client identifiers", () => {
    expect(hashLogValue("203.0.113.10")).toBe(hashLogValue("203.0.113.10"));
    expect(hashLogValue("203.0.113.10")).not.toBe("203.0.113.10");
  });
});

describe("telemetry", () => {
  it("keeps only allowlisted scalar telemetry properties", () => {
    expect(
      sanitizeTelemetryProperties({
        brainStatus: "queued",
        hasNote: true,
        leftInput: "Rolex Air-King",
        nested: { raw: "private" } as never,
        remainingRequests: 12,
        traceAttached: false
      })
    ).toEqual({
      brainStatus: "queued",
      hasNote: true,
      remainingRequests: 12,
      traceAttached: false
    });
  });

  it("does not require MongoDB to record telemetry", async () => {
    const previousMongoUri = process.env.MONGODB_URI;

    try {
      delete process.env.MONGODB_URI;

      await expect(
        recordTelemetryEvent({
          event: "compare.completed",
          comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
          clientKeyHash: hashLogValue("203.0.113.30"),
          status: "completed"
        })
      ).resolves.toBe(false);
    } finally {
      if (previousMongoUri === undefined) {
        delete process.env.MONGODB_URI;
      } else {
        process.env.MONGODB_URI = previousMongoUri;
      }
    }
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

  it("handles network failures as controlled client errors", async () => {
    const payload = await requestComparison("Rolex Air-King", "Rolex Explorer", async () => {
      throw new Error("network down");
    });

    expect(payload).toEqual({
      error: "The comparison request failed. Try again."
    });
  });

  it("handles non-json error responses as controlled client errors", async () => {
    const payload = await readComparisonResponse(
      new Response("<html>server error</html>", {
        status: 500,
        headers: {
          "Content-Type": "text/html"
        }
      })
    );

    expect(payload).toEqual({
      error: "The comparison request failed. Try again."
    });
  });

  it("handles malformed successful comparison payloads as controlled client errors", async () => {
    const payload = await readComparisonResponse(
      Response.json(
        {
          comparison: null
        },
        { status: 200 }
      )
    );

    expect(payload).toEqual({
      error: "The comparison request failed. Try again."
    });
  });
});
