import { describe, expect, it } from "vitest";
import { resolveRangeScoutDraft } from "@/lib/contentIntelligence/rangeScoutAdapter";

describe("RangeScout adapter resolver", () => {
  it("builds a provider draft with recurring programs and time tags", () => {
    const result = resolveRangeScoutDraft({
      title: "Astoria Music Club",
      listingKindHint: "provider",
      categoryHint: "Classes",
      boroughRaw: "Queens",
      neighborhoodRaw: "Astoria",
      addressRaw: "34 Steinway St, Astoria, NY",
      activityTypesRaw: ["Music"],
      ageRangesRaw: ["3–5", "6–8"],
      descriptionFacts: ["Weekly music classes for kids in Astoria."],
      contactFacts: {
        website: "https://example.com/classes",
        email: "hello@example.com",
        phone: "555-0101",
      },
      imageCandidates: [{ uploadedUrl: "https://i.ibb.co/example-provider.jpg" }],
      scheduleBlocks: [
        {
          daysOfWeek: ["Tuesday", "Thursday"],
          startTime: "3:30 PM",
          endTime: "4:30 PM",
          title: "After-school music",
        },
      ],
    });

    expect(result.entityKind).toBe("provider");
    if (result.entityKind !== "provider") return;
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.draft.dayTimeTags).toContain("Weekday");
    expect(result.draft.dayTimeTags).toContain("After-school");
    expect(result.draft.recurringPrograms?.[0]?.daysOfWeek).toEqual(["Tuesday", "Thursday"]);
  });

  it("builds a meetup draft and flags missing image uploads", () => {
    const result = resolveRangeScoutDraft({
      title: "Astoria Family Circle",
      listingKindHint: "meetupGroup",
      boroughRaw: "Queens",
      neighborhoodRaw: "Astoria",
      descriptionFacts: ["A weekly neighborhood meetup for Astoria families."],
      contactFacts: {
        website: "https://example.com/meetup",
      },
      ageRangesRaw: ["0–2"],
      scheduleBlocks: [{ daysOfWeek: ["Saturday"], timeText: "Saturday mornings" }],
    });

    expect(result.entityKind).toBe("meetupGroup");
    expect(result.blockingIssues.some((issue) => issue.code === "missing_uploaded_image")).toBe(true);
  });

  it("does not infer afternoon tags from morning schedules", () => {
    const result = resolveRangeScoutDraft({
      title: "Park Slope Morning Art",
      listingKindHint: "provider",
      categoryHint: "Classes",
      boroughRaw: "Brooklyn",
      neighborhoodRaw: "Park Slope",
      descriptionFacts: ["Saturday morning art class in Park Slope."],
      contactFacts: {
        website: "https://example.com/morning-art",
      },
      imageCandidates: [{ uploadedUrl: "https://i.ibb.co/example-provider.jpg" }],
      ageRangesRaw: ["3–5"],
      scheduleBlocks: [{ daysOfWeek: ["Saturday"], timeText: "10:00 AM - 11:00 AM" }],
    });

    expect(result.entityKind).toBe("provider");
    if (result.entityKind !== "provider") return;
    expect(result.draft.dayTimeTags).toContain("Morning");
    expect(result.draft.dayTimeTags).not.toContain("Afternoon");
  });
});
