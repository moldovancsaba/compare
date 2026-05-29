import { describe, expect, it } from "vitest";
import { normalizeLeadEvent } from "@/lib/mommyPoppins/localAiFeed";
import type { ExternalLead } from "@/lib/mommyPoppins/types";

describe("mommyPoppins local ai feed event normalization", () => {
  it("normalizes one-off event instances into scheduledInstances mapping", () => {
    const lead: ExternalLead = {
      leadId: "lead-storytime",
      leadType: "event_instance",
      sourceSystem: "mommypoppins",
      canonicalSourceUrl: "https://mommypoppins.com/new-york-city/event/foo",
      supportingUrls: ["https://mommypoppins.com/new-york-city/event/foo"],
      titleHint: "Nature Storytime",
      boroughHint: "Brooklyn",
      neighborhoodHint: "DUMBO",
      classScoutCategoryHint: "Drop-In Activities",
      activityHints: ["Art"],
      ageHints: ["0–2", "3–5"],
      scheduleHints: ["Weekend", "Afternoon"],
      locationHints: ["Brooklyn", "DUMBO"],
      contactHints: { website: "https://mommypoppins.com/new-york-city/event/foo" },
      evidenceSnippets: ["Saturday 2026-06-13 1:00 PM to 3:00 PM free drop-in storytime for kids."],
      confidence: "high",
      confidenceScore: 0.91,
      status: "exported",
      dedupeKeys: ["nature storytime"],
      generatedAt: "2026-05-28T00:00:00.000Z",
    };

    const result = normalizeLeadEvent(lead);
    expect(result.eventType).toBe("event_instance");
    expect(result.listingMapping.targetScheduleField).toBe("scheduledInstances");
    expect(result.startDate).toBe("2026-06-13");
  });

  it("normalizes recurring series into recurringPrograms mapping", () => {
    const lead: ExternalLead = {
      leadId: "lead-open-play",
      leadType: "event_series",
      sourceSystem: "mommypoppins",
      canonicalSourceUrl: "https://mommypoppins.com/new-york-city/event/bar",
      supportingUrls: ["https://mommypoppins.com/new-york-city/event/bar"],
      titleHint: "Weekend Open Play",
      boroughHint: "Queens",
      neighborhoodHint: "Astoria",
      classScoutCategoryHint: "Drop-In Activities",
      activityHints: ["Indoor Play"],
      ageHints: ["0–2", "3–5"],
      scheduleHints: ["Weekend", "Morning"],
      locationHints: ["Queens", "Astoria"],
      contactHints: { website: "https://mommypoppins.com/new-york-city/event/bar" },
      evidenceSnippets: ["Every Saturday and Sunday at 9:30 AM for toddlers and preschoolers."],
      confidence: "high",
      confidenceScore: 0.85,
      status: "exported",
      dedupeKeys: ["weekend open play"],
      generatedAt: "2026-05-28T00:00:00.000Z",
    };

    const result = normalizeLeadEvent(lead);
    expect(result.eventType).toBe("event_series");
    expect(result.recurrenceDays).toEqual(["Saturday", "Sunday"]);
    expect(result.listingMapping.targetScheduleField).toBe("recurringPrograms");
  });
});
