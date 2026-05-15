import { describe, expect, it } from "vitest";

import {
  buildSavedComparisonMetadata,
  buildSavedComparisonStructuredData
} from "@/lib/metadata/saved-comparison";
import { compareInputs } from "@/lib/services/compare";
import type { SavedComparisonPage } from "@/lib/services/saved-comparisons";

describe("saved comparison metadata", () => {
  it("builds route-specific SEO and social metadata from the saved comparison result", () => {
    const comparisonResult = compareInputs({
      domain: "watches",
      leftInput: "Rolex Air-King",
      rightInput: "Rolex Explorer"
    });

    expect(comparisonResult.status).toBe("completed");

    if (comparisonResult.status !== "completed") {
      throw new Error("Expected comparison fixture to resolve.");
    }

    const savedComparison: SavedComparisonPage = {
      comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
      publicSlug: "rolex-air-king-126900-vs-rolex-explorer-124270",
      deterministicResult: comparisonResult.comparison,
      brainResult: null,
      traceRef: null,
      submissionCount: 3,
      firstSubmittedAt: "2026-05-15T00:00:00.000Z",
      lastSubmittedAt: "2026-05-15T01:00:00.000Z"
    };

    const metadata = buildSavedComparisonMetadata(savedComparison);

    expect(metadata.title).toBe("Rolex Air-King vs Rolex Explorer comparison | {compare}");
    expect(metadata.description).toContain("Rolex Explorer is the stronger recommendation for most buyers.");
    expect(metadata.description).toContain("Stronger choice: Rolex Explorer.");
    expect(metadata.alternates?.canonical).toBe("/compare/rolex-air-king-126900-vs-rolex-explorer-124270");
    expect(metadata.openGraph).toMatchObject({
      title: "Rolex Air-King vs Rolex Explorer comparison | {compare}",
      url: "/compare/rolex-air-king-126900-vs-rolex-explorer-124270",
      type: "article",
      siteName: "{compare}"
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary",
      title: "Rolex Air-King vs Rolex Explorer comparison | {compare}"
    });
  });

  it("builds structured data for the saved comparison page", () => {
    const comparisonResult = compareInputs({
      domain: "watches",
      leftInput: "Rolex Air-King",
      rightInput: "Rolex Explorer"
    });

    expect(comparisonResult.status).toBe("completed");

    if (comparisonResult.status !== "completed") {
      throw new Error("Expected comparison fixture to resolve.");
    }

    const savedComparison: SavedComparisonPage = {
      comparisonRef: "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
      publicSlug: "rolex-air-king-126900-vs-rolex-explorer-124270",
      deterministicResult: comparisonResult.comparison,
      brainResult: null,
      traceRef: null,
      submissionCount: 3,
      firstSubmittedAt: "2026-05-15T00:00:00.000Z",
      lastSubmittedAt: "2026-05-15T01:00:00.000Z"
    };

    const structuredData = buildSavedComparisonStructuredData(savedComparison);

    expect(structuredData).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Rolex Air-King vs Rolex Explorer comparison | {compare}",
      url: "http://localhost:3000/compare/rolex-air-king-126900-vs-rolex-explorer-124270",
      mainEntity: {
        "@type": "ItemList"
      }
    });
  });
});
