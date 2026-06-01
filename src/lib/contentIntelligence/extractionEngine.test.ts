import { describe, expect, it } from "vitest";
import { extractRangeScoutCandidate } from "@/lib/contentIntelligence/extractionEngine";

describe("extractRangeScoutCandidate", () => {
  it("builds normalized listing facts, provenance, and media request from a discovery artifact", () => {
    const result = extractRangeScoutCandidate({
      artifactId: "cand-1",
      targetId: "target-1",
      searchQuery: "Queens Astoria NYC kids music class official",
      sourceUrl: "https://example.org/classes",
      sourceHost: "example.org",
      title: "Astoria Kids Music Classes",
      snippet: "Official weekly music lessons for children in Astoria.",
      authorityGrade: "official",
      listingKindHint: "provider",
      categoryHint: "Classes",
      boroughGuess: "Queens",
      neighborhoodGuess: "Astoria",
      activityTypesRaw: ["Music"],
      ageRangesRaw: ["3–5"],
      ogImageUrl: "https://example.org/image.jpg",
      rawText:
        "Astoria Kids Music Classes offers weekly music classes for children ages 3-5 and 6-8 in Astoria, Queens. Classes run Saturday 10:00 AM to 11:00 AM. Contact hello@example.org or 718-555-0101.",
      officialnessScore: 95,
      kidsRelevanceScore: 100,
      prefilterReasons: [],
      scarcityTargets: ["category:Classes", "borough:Queens", "neighborhood:Astoria"],
      rationale: ["Improves underrepresented activity coverage."],
      scoreResult: {
        score: 82,
        eligible: true,
        breakdown: {
          zeroResultLift: 100,
          ageGapLift: 70,
          activityGapLift: 80,
          geographyLift: 75,
          dayTimeLift: 65,
          providerDiversityLift: 90,
          visualQualityLift: 80,
          informationDensityLift: 75,
          parentUsefulnessLift: 80,
          total: 82,
        },
        blockingReasons: [],
        rationale: [],
        version: "test",
      },
    });

    expect(result.normalizedListing.title).toBe("Astoria Kids Music Classes");
    expect(result.normalizedListing.boroughRaw).toBe("Queens");
    expect(result.normalizedListing.neighborhoodRaw).toBe("Astoria");
    expect(result.normalizedListing.ageRangesRaw).toContain("3–5");
    expect(result.normalizedListing.scheduleBlocks?.[0]?.daysOfWeek).toContain("Saturday");
    expect(result.mediaRequest?.sourceImageUrl).toBe("https://example.org/image.jpg");
    expect(result.normalizedListing.imageCandidates?.[0]?.sourceUrl).toBe("https://example.org/image.jpg");
    expect(result.evidenceMap.title?.[0]?.sourceUrl).toBe("https://example.org/classes");
  });
});
