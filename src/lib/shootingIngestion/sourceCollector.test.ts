import { describe, expect, it } from "vitest";
import type { ClassifiedSource } from "@/lib/shootingIngestion/types";
import { collectCompetitionLeads, collectEventLeads, collectArtifactsFromClassifiedSources } from "@/lib/shootingIngestion/sourceCollector";
import { findTypedMatches } from "@/lib/shootingIngestion/collectionRulebook";

const baseSource = (overrides: Partial<ClassifiedSource> = {}): ClassifiedSource => ({
  sourceId: "mssz-competition-001",
  canonicalUrl: "https://www.mssz.hu/versenyek/2026-cup-series",
  sourceClass: "competition_surface",
  extractorHint: "competition_calendar",
  routedExtractor: "shooting-competition-collector",
  confidence: "high",
  features: ["official-operator", "disciplines:2", "geo:HU"],
  manualReviewRequired: false,
  notes: [],
  ...overrides,
});

describe("shooting source collector", () => {
  it("collects competition leads from competition source surfaces", async () => {
    const sources: ClassifiedSource[] = [
      baseSource({ sourceId: "mssz-cup-lead", sourceClass: "competition_surface", canonicalUrl: "https://www.mssz.hu/versenyek/world-cup-series" }),
      baseSource({ sourceId: "mssz-event", sourceClass: "competition_surface", extractorHint: "competition_notice" }),
    ];

    const report = await collectCompetitionLeads({ sources, maxRecordsPerSource: 1 });

    expect(report.totalCandidates).toBe(2);
    expect(report.rows.every((row) => row.confidence === "high" || row.confidence === "medium")).toBe(true);
    expect(new Set(report.rows.map((row) => row.sourceId)).size).toBe(2);
  });

  it("collects event and group leads from club surfaces", async () => {
    const sources: ClassifiedSource[] = [
      {
        sourceId: "club-weekly-events",
        canonicalUrl: "https://www.example-huntclub.hu/events/schedule",
        sourceClass: "club_surface",
        extractorHint: "club_events",
        routedExtractor: "shooting-club-collector",
        confidence: "medium",
        features: ["official-operator", "age:Youth", "geo:HU"],
        manualReviewRequired: false,
        notes: [],
      },
      {
        sourceId: "club-profile",
        canonicalUrl: "https://www.example-huntclub.hu/club/about",
        sourceClass: "club_surface",
        extractorHint: "club_profile",
        routedExtractor: "shooting-club-collector",
        confidence: "medium",
        features: ["official-operator", "geo:HU"],
        manualReviewRequired: false,
        notes: [],
      },
    ];

    const report = await collectEventLeads({ sources, maxRecordsPerSource: 1 });

    expect(report.totalCandidates).toBeGreaterThan(0);
    expect(report.events).toEqual(expect.arrayContaining([expect.objectContaining({ leadType: expect.any(String) })]));
    expect(report.byType.event_series + report.byType.event_instance + report.byType.group).toBe(report.events.length);
  });

  it("respects rulebook signal ordering and max-record limits for competition/cup sources", async () => {
    const cupSource = baseSource({
      sourceId: "mssz-hun-2026-cup-series",
      canonicalUrl: "https://www.mssz.hu/versenyek/2026-world-cup-hun-cup/",
      features: ["official-operator", "geo:HU"],
      extractorHint: "competition_calendar",
      sourceClass: "competition_surface",
      sourceId: "mssz-hun-cup-2026",
    });
    const rules = findTypedMatches(cupSource);
    const ids = rules.map((rule) => rule.id);
    expect(ids).toEqual(expect.arrayContaining(["shooting-rulebook-cup-from-competition-hints", "shooting-rulebook-competition-calendar"]));

    const competitionReport = await collectCompetitionLeads({ sources: [cupSource], maxRecordsPerSource: 2 });
    expect(competitionReport.totalCandidates).toBe(2);
    expect(competitionReport.rows[0].squadSystem).toBe("Series");
  });

  it("builds a unified entity lead export with class/range/group semantics", async () => {
    const sources: ClassifiedSource[] = [
      baseSource({
        sourceId: "course-foundation",
        sourceClass: "course_surface",
        canonicalUrl: "https://academy.example.hu/course/junior-safe-rifles",
        extractorHint: "course_offer",
      }),
      {
        sourceId: "range-root",
        canonicalUrl: "https://example-range.hu/range/listings",
        sourceClass: "range_surface",
        extractorHint: "range_profile",
        routedExtractor: "shooting-range-collector",
        confidence: "low",
        features: ["geo:HU"],
        manualReviewRequired: false,
        notes: [],
      },
      {
        sourceId: "club-collective",
        canonicalUrl: "https://example-club.hu/club",
        sourceClass: "club_surface",
        extractorHint: "club_profile",
        routedExtractor: "shooting-club-collector",
        confidence: "medium",
        features: ["geo:HU", "official-operator"],
        manualReviewRequired: false,
        notes: [],
      },
    ];

    const report = await collectArtifactsFromClassifiedSources(sources, "2026-05-29T20:00:00.000Z", "Europe/Budapest");

    expect(report.entityLeads.totalCandidates).toBeGreaterThanOrEqual(3);
    const types = new Set(report.entityLeads.rows.map((row) => row.leadType));
    expect(types.has("class")).toBe(true);
    expect(types.has("range")).toBe(true);
    expect(types.has("club")).toBe(true);
  });
});
