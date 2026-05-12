import { beforeEach, describe, expect, it } from "vitest";

import { GET as GET_BRAIN } from "@/app/api/compare/brain/route";
import { POST as POST_FEEDBACK } from "@/app/api/compare/feedback/route";
import { POST } from "@/app/api/compare/route";
import { hashLogValue, sanitizeLogContext } from "@/lib/observability/logger";
import { recordTelemetryEvent, sanitizeTelemetryProperties } from "@/lib/observability/telemetry";
import { compareRateLimit, resetRateLimitForTests } from "@/lib/security/rate-limit";
import { readComparisonResponse, requestComparison } from "@/lib/services/compare-client";
import { compareWatches } from "@/lib/services/compare-watches";
import {
  buildSavedComparisonSlug,
  parseSavedComparisonSlug,
  persistSubmittedComparison
} from "@/lib/services/saved-comparisons";
import { watchCatalog } from "@/lib/data/watch-catalog";
import { serviceCatalog } from "@/lib/data/service-catalog";
import {
  analyzeWatchCollectionGaps,
  analyzeWatchUpgradePath,
  calculateWatchCollectionBalance,
  normalizeWatchCollectionProfile
} from "@/lib/domains/watch-collection";
import { buildWatchConsequenceProfile } from "@/lib/domains/watch-consequences";
import { toServiceComparisonEntity } from "@/lib/domains/service-entity";
import { toWatchComparisonEntity } from "@/lib/domains/watch-entity";
import { compareInputs } from "@/lib/services/compare";
import { resolveWatch, resolveWatchDetailed } from "@/lib/utils/resolve-watch";
import { validateComparisonInputs } from "@/lib/utils/validate-comparison-inputs";
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
  expectedBestOverall: string;
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
    expectedBestOverall: "Rolex Explorer",
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
    expectedBestOverall: "Tudor Black Bay 54",
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
    expectedBestOverall: "Tudor Pelagos 39",
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
    expectedBestOverall: "Rolex Explorer",
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
    {
      title: result.verdict.headline,
      summary: result.verdict.summary
    },
    ...result.verdict.picks.map((pick) => ({
      title: `${pick.label} ${pick.pick}`,
      summary: pick.reason
    })),
    ...result.keyDifferences,
    ...result.realWorldImpact,
    ...result.ownershipIntelligence,
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

  it("tolerates a single typo in a distinctive model token", () => {
    const match = resolveWatch("Rolex Explrer");

    expect(match?.id).toBe("rolex-explorer-124270");
  });

  it("tolerates a single typo in a distinctive alias token", () => {
    const match = resolveWatch("Tudor Pelgos 39");

    expect(match?.id).toBe("tudor-pelagos-39");
  });

  it("does not resolve generic brand-only input", () => {
    const match = resolveWatch("Rolex");

    expect(match).toBeNull();
  });

  it("does not pick a watch when the model input is ambiguous", () => {
    const match = resolveWatch("Tudor Black Bay");

    expect(match).toBeNull();
  });

  it("returns disambiguation suggestions for ambiguous model families", () => {
    const resolution = resolveWatchDetailed("Tudor Black Bay");

    expect(resolution).toEqual({
      status: "unresolved",
      reason: "ambiguous",
      suggestions: expect.arrayContaining([
        expect.objectContaining({ id: "tudor-black-bay-54" }),
        expect.objectContaining({ id: "tudor-black-bay-58" })
      ])
    });
  });

  it("keeps ambiguous family inputs unresolved even with typo-tolerant scoring", () => {
    const match = resolveWatch("Tudor Blak Bay");

    expect(match).toBeNull();
  });
});

describe("compareWatches", () => {
  it("translates watch specs into deterministic consequence profiles", () => {
    expect(buildWatchConsequenceProfile(watchById("rolex-explorer-124270"))).toEqual(
      expect.objectContaining({
        wristPresence: "compact and forgiving on smaller wrists",
        cuffFit: "slides under cuffs with little drama",
        wristSizeSensitivity: "low wrist-size sensitivity"
      })
    );
    expect(buildWatchConsequenceProfile(watchById("omega-aqua-terra-38"))).toEqual(
      expect.objectContaining({
        cuffFit: "will sit proud enough to matter with fitted cuffs",
        travelReadiness: "travel-capable, though shorter no-wear windows make rotation less forgiving"
      })
    );
    expect(buildWatchConsequenceProfile(watchById("rolex-air-king-126900"))).toEqual(
      expect.objectContaining({
        wristPresence: "noticeably present, especially on sub-17cm wrists",
        serviceFriction: "service access is strong, but long-term cost expectations remain luxury-grade"
      })
    );
  });

  it("requires structured ownership metadata for catalog watches", () => {
    for (const watch of watchCatalog) {
      expect(watch.ownershipProfile).toEqual({
        serviceExpectation: expect.stringMatching(/^(low|medium|high)$/),
        comfort: expect.stringMatching(/^(compact|balanced|substantial)$/),
        durability: expect.stringMatching(/^(dress|everyday|tool)$/),
        reliability: expect.stringMatching(/^(standard|strong|exceptional)$/),
        resaleStability: expect.stringMatching(/^(soft|stable|strong)$/),
        braceletQuality: expect.stringMatching(/^(basic|solid|excellent)$/),
        strapVersatility: expect.stringMatching(/^(limited|moderate|high)$/)
      });
    }
  });

  it("returns all required output sections", () => {
    const left = watchCatalog[0];
    const right = watchCatalog[1];
    const result = compareWatches(left, right);

    expect(result.keyDifferences.length).toBeGreaterThan(0);
    expect(result.verdict.bestOverall).toBeTruthy();
    expect(result.verdict.strongerChoice).toBeTruthy();
    expect(result.verdict.exceptionCase).toContain("still");
    expect(result.verdict.confidenceRationale).toBeTruthy();
    expect(result.sectionLabels).toEqual({
      keyDifferences: "Decision Drivers",
      realWorldImpact: "Daily Wear Experience",
      ownershipIntelligence: "Ownership Tradeoffs",
      whoShouldBuyWhich: "Best For",
      overpricedFeatures: "Overpriced Features",
      hiddenDownsides: "Hidden Downsides",
      betterValueAlternative: "Better Value Alternative",
      signalVsFluff: "Marketing vs Reality"
    });
    expect(result.verdict.picks.map((pick) => pick.label)).toEqual([
      "Best overall",
      "Best daily wear",
      "Best one-watch choice",
      "Best tool watch",
      "Best movement/ownership story",
      "Best value"
    ]);
    expect(result.recommendationSignals.map((signal) => signal.kind)).toEqual([
      "best_overall",
      "best_daily",
      "best_value",
      "best_collector",
      "avoid_if"
    ]);
    expect(result.recommendationSignals).toContainEqual(
      expect.objectContaining({
        kind: "best_overall",
        pick: "Rolex Explorer"
      })
    );
    expect(result.realWorldImpact.length).toBeGreaterThan(0);
    expect(result.ownershipIntelligence.map((block) => block.title)).toEqual([
      "Daily ownership",
      "Emotional fit",
      "Service and resale reality",
      "Scratch anxiety",
      "Enthusiast bias check"
    ]);
    expect(result.ownershipIntelligence[0]?.summary).toContain("Structured profile:");
    expect(result.ownershipIntelligence[2]?.summary).toContain("service burden");
    expect(result.ownershipIntelligence[3]?.summary).toContain("durability");
    expect(flattenedComparisonCopy(result)).toContain("slides under cuffs");
    expect(flattenedComparisonCopy(result)).toContain("wrist-size sensitivity");
    expect(result.whoShouldBuyWhich.length).toBe(3);
    expect(result.overpricedFeatures.length).toBeGreaterThan(0);
    expect(result.hiddenDownsides.length).toBeGreaterThan(0);
    expect(result.betterValueAlternative.length).toBeGreaterThan(0);
    expect(result.signalVsFluff.length).toBe(2);
    expect(result.evidenceSummary.overallConfidence).toBe("medium");
    expect(result.evidenceSummary.dataQuality).toBe("medium");
  });

  it("emits mixed evidence types including low-confidence missing data", () => {
    const result = compareWatches(watchById("rolex-air-king-126900"), watchById("rolex-explorer-124270"));
    const evidenceKinds = result.evidenceSummary.evidence.map((item) => item.kind);

    expect(evidenceKinds).toEqual(
      expect.arrayContaining(["catalog_fact", "derived_rule", "editorial_inference", "missing_data"])
    );
    expect(result.evidenceSummary.evidence).toContainEqual(
      expect.objectContaining({
        kind: "missing_data",
        confidence: "low"
      })
    );
    expect(result.evidenceSummary.limitations.join(" ")).toContain("No live market pricing");
    expect(result.keyDifferences.flatMap((block) => block.evidence ?? [])).toContainEqual(
      expect.objectContaining({
        kind: "derived_rule",
        label: "Wearability rule"
      })
    );
  });

  it("can flip recommendations by buyer priority instead of forcing one universal answer", () => {
    const result = compareWatches(watchById("rolex-air-king-126900"), watchById("rolex-explorer-124270"));

    expect(result.verdict.bestOverall).toBe("Rolex Explorer");
    expect(result.recommendationSignals).toContainEqual(
      expect.objectContaining({
        kind: "best_overall",
        pick: "Rolex Explorer"
      })
    );
    expect(result.recommendationSignals).toContainEqual(
      expect.objectContaining({
        kind: "avoid_if",
        pick: "Rolex Air-King"
      })
    );
    expect(result.whoShouldBuyWhich).toContainEqual(
      expect.objectContaining({
        buyerType: "Tool-watch enthusiast",
        pick: "Rolex Air-King"
      })
    );
  });

  it("uses saved collection context when present", () => {
    const result = compareWatches(watchById("rolex-air-king-126900"), watchById("rolex-explorer-124270"), {
      preferredBrands: ["Rolex"],
      items: [
        {
          watchId: "rolex-explorer-124270",
          status: "owned"
        }
      ]
    });

    expect(result.ownershipIntelligence[0]).toEqual(
      expect.objectContaining({
        title: "Collection context",
        summary: expect.stringContaining("Rolex Explorer is marked owned")
      })
    );
    expect(result.ownershipIntelligence[1]).toEqual(
      expect.objectContaining({
        title: "Upgrade path guidance",
        summary: expect.stringContaining("poor-value path")
      })
    );
    expect(result.whoShouldBuyWhich).toContainEqual(
      expect.objectContaining({
        buyerType: "Collection-aware buyer",
        pick: "Rolex Air-King"
      })
    );
    expect(result.recommendationSignals).toContainEqual(
      expect.objectContaining({
        kind: "best_collector",
        label: "Collection-aware pick",
        pick: "Rolex Air-King"
      })
    );
  });

  it("degrades visibly when structured ownership metadata is missing", () => {
    const left = watchById("rolex-air-king-126900");
    const right = {
      ...watchById("rolex-explorer-124270"),
      ownershipProfile: undefined
    };
    const result = compareWatches(left, right);

    expect(flattenedComparisonCopy(result)).toContain("Structured ownership metadata is incomplete");
    expect(result.ownershipIntelligence.flatMap((block) => block.evidence ?? [])).toContainEqual(
      expect.objectContaining({
        kind: "missing_data",
        label: "Missing structured ownership profile"
      })
    );
  });

  it.each(comparisonRegressionFixtures)(
    "keeps regression-critical output stable for $name",
    ({
      leftId,
      rightId,
      expectedBestOverall,
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
      expect(result.ownershipIntelligence.map((block) => block.title)).toEqual([
        "Daily ownership",
        "Emotional fit",
        "Service and resale reality",
        "Scratch anxiety",
        "Enthusiast bias check"
      ]);
      expect(result.signalVsFluff.map((block) => block.title)).toEqual([
        "Meaningful difference",
        "Mostly marketing"
      ]);
      expect(result.verdict.picks).toContainEqual(
        expect.objectContaining({
          label: "Best overall",
          pick: expectedBestOverall
        })
      );

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

describe("generic comparison foundation", () => {
  it("compares through the domain registry instead of the API importing watch-specific rules", () => {
    const result = compareInputs({
      leftInput: "Rolex Air-King",
      rightInput: "Rolex Explorer"
    });

    expect(result.status).toBe("completed");
    if (result.status !== "completed") {
      return;
    }

    expect(result.domain).toBe("watches");
    expect(result.left.label).toBe("Rolex Air-King");
    expect(result.right.label).toBe("Rolex Explorer");
    expect(result.comparison.leftEntity).toEqual(expect.objectContaining({ domain: "watches" }));
  });

  it("rejects unsupported domains before touching a product-specific resolver", () => {
    expect(
      compareInputs({
        domain: "unknown-domain",
        leftInput: "Service A",
        rightInput: "Service B"
      })
    ).toEqual({
      status: "unsupported_domain",
      domain: "unknown-domain",
      supportedDomains: ["watches", "services"]
    });
  });

  it("passes adapter-owned collection context through generic comparison", () => {
    const result = compareInputs({
      leftInput: "Rolex Air-King",
      rightInput: "Rolex Explorer",
      context: {
        watchCollectionProfile: {
          items: [{ watchId: "rolex-explorer-124270", status: "owned" }],
          preferredBrands: ["Rolex"]
        }
      }
    });

    expect(result.status).toBe("completed");
    if (result.status !== "completed") {
      return;
    }

    expect(result.comparison.ownershipIntelligence[0]?.title).toBe("Collection context");
  });
});

describe("watch collection profiles", () => {
  it("normalizes accountless watch collection profile input", () => {
    expect(
      normalizeWatchCollectionProfile({
        preferredBrands: [" Rolex ", "Rolex", "Omega"],
        items: [
          { watchId: "rolex-explorer-124270", status: "owned", note: "Daily watch" },
          { watchId: "rolex-explorer-124270", status: "wishlist" },
          { watchId: "unknown", status: "owned" },
          { watchId: "rolex-air-king-126900", status: "invalid" }
        ]
      })
    ).toEqual({
      preferredBrands: ["Rolex", "Omega"],
      items: [
        {
          watchId: "rolex-explorer-124270",
          status: "wishlist"
        }
      ]
    });
  });

  it("produces cited gap and overlap insights for a multi-watch collection", () => {
    const insights = analyzeWatchCollectionGaps({
      preferredBrands: ["Rolex"],
      items: [
        { watchId: "tudor-black-bay-54", status: "owned" },
        { watchId: "tudor-black-bay-58", status: "owned" },
        { watchId: "tudor-pelagos-39", status: "owned" }
      ]
    });

    expect(insights.length).toBeGreaterThanOrEqual(3);
    expect(insights).toContainEqual(
      expect.objectContaining({
        title: "Missing wearing roles",
        traits: expect.arrayContaining(["missing-style:dress-sport"])
      })
    );
    expect(insights).toContainEqual(
      expect.objectContaining({
        title: "Style overlap",
        citedWatchIds: expect.arrayContaining(["tudor-black-bay-54", "tudor-black-bay-58", "tudor-pelagos-39"])
      })
    );
    expect(insights).toContainEqual(
      expect.objectContaining({
        title: "Brand concentration",
        traits: expect.arrayContaining(["brand:Tudor"])
      })
    );
  });

  it("degrades gracefully for empty and tiny collections", () => {
    expect(analyzeWatchCollectionGaps({ preferredBrands: [], items: [] })).toEqual([
      expect.objectContaining({
        title: "No owned watches saved yet",
        citedWatchIds: []
      })
    ]);

    expect(
      analyzeWatchCollectionGaps({
        preferredBrands: [],
        items: [{ watchId: "rolex-explorer-124270", status: "owned" }]
      })
    ).toEqual([
      expect.objectContaining({
        title: "Single-watch baseline",
        citedWatchIds: ["rolex-explorer-124270"]
      }),
      expect.objectContaining({
        title: "Add contrast before optimizing"
      })
    ]);
  });

  it("classifies upgrade path verdicts with changed traits", () => {
    const meaningful = analyzeWatchUpgradePath(watchById("tudor-black-bay-54"), {
      preferredBrands: [],
      items: [{ watchId: "tudor-black-bay-58", status: "owned" }]
    });
    const lateral = analyzeWatchUpgradePath(watchById("tudor-black-bay-58"), {
      preferredBrands: [],
      items: [{ watchId: "tudor-black-bay-54", status: "owned" }]
    });
    const emotional = analyzeWatchUpgradePath(watchById("rolex-air-king-126900"), {
      preferredBrands: ["Rolex"],
      items: [{ watchId: "tudor-black-bay-54", status: "owned" }]
    });
    const poorValue = analyzeWatchUpgradePath(watchById("rolex-air-king-126900"), {
      preferredBrands: [],
      items: [{ watchId: "rolex-explorer-124270", status: "owned" }]
    });

    expect(meaningful).toEqual(
      expect.objectContaining({
        classification: "meaningful",
        changedTraits: expect.arrayContaining(["bracelet adjustment", "smaller diameter"])
      })
    );
    expect(lateral).toEqual(
      expect.objectContaining({
        classification: "lateral",
        changedTraits: expect.arrayContaining(["similar role"])
      })
    );
    expect(emotional).toEqual(
      expect.objectContaining({
        classification: "emotional",
        changedTraits: ["brand/status step-up"]
      })
    );
    expect(poorValue).toEqual(
      expect.objectContaining({
        classification: "poor_value",
        changedTraits: expect.arrayContaining(["same-brand overlap"])
      })
    );
  });

  it("scores balanced and redundant collections with contributors", () => {
    const balanced = calculateWatchCollectionBalance({
      preferredBrands: [],
      items: [
        { watchId: "rolex-explorer-124270", status: "owned" },
        { watchId: "tudor-black-bay-54", status: "owned" },
        { watchId: "omega-aqua-terra-38", status: "owned" }
      ]
    });
    const redundant = calculateWatchCollectionBalance({
      preferredBrands: [],
      items: [
        { watchId: "tudor-black-bay-54", status: "owned" },
        { watchId: "tudor-black-bay-58", status: "owned" },
        { watchId: "tudor-pelagos-39", status: "owned" }
      ]
    });

    expect(balanced.overallScore).toBeGreaterThan(redundant.overallScore);
    expect(balanced.scores).toHaveLength(5);
    expect(balanced.scores).toContainEqual(
      expect.objectContaining({
        dimension: "versatility",
        contributors: expect.arrayContaining(["3 of 4 style roles covered"])
      })
    );
    expect(redundant.scores).toContainEqual(
      expect.objectContaining({
        dimension: "redundancy",
        score: expect.any(Number),
        contributors: expect.arrayContaining(["1 brands represented"])
      })
    );
  });

  it("keeps balance scoring non-authoritative for empty collections", () => {
    expect(calculateWatchCollectionBalance({ preferredBrands: [], items: [] })).toEqual({
      overallScore: 0,
      summary: expect.stringContaining("not a collection judgment"),
      scores: [
        expect.objectContaining({
          dimension: "versatility",
          contributors: ["No owned watches saved"]
        })
      ]
    });
  });
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
        comparisonPersisted: true,
        hasNote: true,
        leftInput: "Rolex Air-King",
        nested: { raw: "private" } as never,
        remainingRequests: 12,
        traceAttached: false
      })
    ).toEqual({
      brainStatus: "queued",
      comparisonPersisted: true,
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

describe("submitted comparison persistence", () => {
  it("builds stable saved-comparison slugs from catalog slugs", () => {
    const left = watchById("rolex-air-king-126900");
    const right = watchById("rolex-explorer-124270");

    expect(buildSavedComparisonSlug(toWatchComparisonEntity(left), toWatchComparisonEntity(right))).toBe(
      "rolex-air-king-126900-vs-rolex-explorer-124270"
    );
    expect(parseSavedComparisonSlug("rolex-air-king-126900-vs-rolex-explorer-124270")).toEqual({
      leftWatchId: "rolex-air-king-126900",
      rightWatchId: "rolex-explorer-124270"
    });
    expect(parseSavedComparisonSlug("rolex-explorer-124270-vs-rolex-explorer-124270")).toBeNull();
    expect(parseSavedComparisonSlug("not-a-comparison")).toBeNull();
  });

  it("builds domain-prefixed slugs for non-watch comparisons", () => {
    const left = serviceCatalog[0];
    const right = serviceCatalog[1];

    expect(buildSavedComparisonSlug(toServiceComparisonEntity(left), toServiceComparisonEntity(right))).toBe(
      "services-managed-customer-support-vs-services-ai-support-automation"
    );
  });

  it("does not require MongoDB to keep comparison requests available", async () => {
    const previousMongoUri = process.env.MONGODB_URI;
    const left = watchById("rolex-air-king-126900");
    const right = watchById("rolex-explorer-124270");

    try {
      delete process.env.MONGODB_URI;

      await expect(
        persistSubmittedComparison({
          left: toWatchComparisonEntity(left),
          right: toWatchComparisonEntity(right),
          deterministicResult: compareWatches(left, right),
          clientKeyHash: hashLogValue("203.0.113.40")
        })
      ).resolves.toEqual({
        comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
        publicSlug: "rolex-air-king-126900-vs-rolex-explorer-124270",
        persisted: false
      });
    } finally {
      if (previousMongoUri === undefined) {
        delete process.env.MONGODB_URI;
      } else {
        process.env.MONGODB_URI = previousMongoUri;
      }
    }
  });
});

describe("compare input validation", () => {
  it("accepts two different resolvable watches", () => {
    expect(validateComparisonInputs("Rolex Air-King", "Rolex Explorer")).toEqual({
      valid: true
    });
  });

  it("rejects exact duplicate text before the API round trip", () => {
    expect(validateComparisonInputs("Rolex Explorer", "rolex explorer")).toEqual({
      valid: false,
      message: "Choose two different things so the comparison surfaces meaningful tradeoffs."
    });
  });

  it("rejects near-duplicates that resolve to the same catalog watch", () => {
    expect(validateComparisonInputs("Rolex Explorer", "124270 explorer")).toEqual({
      valid: false,
      message: "Both inputs resolve to Rolex Explorer. Choose something different for the second input."
    });
  });

  it("does not block unsupported inputs so the API can return recovery examples", () => {
    expect(validateComparisonInputs("Grand Seiko Snowflake", "Rolex Explorer")).toEqual({
      valid: true
    });
  });

  it("rejects unsupported comparison domains before the API round trip", () => {
    expect(validateComparisonInputs("Rolex Air-King", "Rolex Explorer", "unknown-domain")).toEqual({
      valid: false,
      message: "Choose a supported comparison domain."
    });
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
    expect(payload.savedComparison).toEqual({
      publicSlug: "rolex-air-king-126900-vs-rolex-explorer-124270",
      path: "/compare/rolex-air-king-126900-vs-rolex-explorer-124270",
      persisted: expect.any(Boolean)
    });
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
          leftEntityId: "rolex-air-king-126900",
          rightEntityId: "rolex-explorer-124270",
          leftDomain: "watches",
          rightDomain: "watches",
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

  it("accepts optional feedback notes without blocking when MongoDB is unavailable", async () => {
    const previousMongoUri = process.env.MONGODB_URI;

    try {
      delete process.env.MONGODB_URI;

      const response = await POST_FEEDBACK(
        feedbackRequest({
          comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
          leftEntityId: "rolex-air-king-126900",
          rightEntityId: "rolex-explorer-124270",
          leftDomain: "watches",
          rightDomain: "watches",
          traceRef: null,
          signal: "missing_context",
          note: "I needed more bracelet fit context."
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

  it("rejects feedback notes above the supported length", async () => {
    const response = await POST_FEEDBACK(
      feedbackRequest({
        comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
        leftEntityId: "rolex-air-king-126900",
          rightEntityId: "rolex-explorer-124270",
          leftDomain: "watches",
          rightDomain: "watches",
        signal: "missing_context",
        note: "x".repeat(1001)
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("feedback payload was invalid");
  });

  it("rejects invalid feedback payloads", async () => {
    const response = await POST_FEEDBACK(
      feedbackRequest({
        comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
        leftEntityId: "rolex-air-king-126900",
          rightEntityId: "rolex-explorer-124270",
          leftDomain: "watches",
          rightDomain: "watches",
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
    expect(payload.error).toContain("could not resolve one or both inputs");
    expect(payload.leftSuggestions).toEqual([
      "Rolex Air-King",
      "Rolex Explorer",
      "Tudor Black Bay 54",
      "Tudor Black Bay 58",
      "Omega Seamaster Aqua Terra 38",
      "Tudor Pelagos 39"
    ]);
    expect(payload.rightSuggestions).toEqual([]);
    expect(payload.supportedInputs).toEqual([
      "Rolex Air-King",
      "Rolex Explorer",
      "Tudor Black Bay 54",
      "Tudor Black Bay 58",
      "Omega Seamaster Aqua Terra 38",
      "Tudor Pelagos 39"
    ]);
  });

  it("returns resolver suggestions for ambiguous watch inputs", async () => {
    const response = await POST(
      compareRequest({
        leftInput: "Tudor Black Bay",
        rightInput: "Rolex Explorer"
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.leftSuggestions).toEqual(["Tudor Black Bay 54", "Tudor Black Bay 58"]);
    expect(payload.supportedInputs.slice(0, 2)).toEqual(["Tudor Black Bay 54", "Tudor Black Bay 58"]);
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
    expect(payload.error).toContain("Choose two different things");
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
    const payload = await requestComparison("Rolex Air-King", "Rolex Explorer", undefined, async () => {
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
