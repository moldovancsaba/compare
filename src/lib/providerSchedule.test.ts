import { describe, expect, it } from "vitest";
import { deriveNextOccurrence, deriveUpcomingOccurrences, formatUpcomingOccurrenceLabel } from "@/lib/providerSchedule";
import type { Provider } from "@/types/provider";

const baseProvider: Provider = {
  id: "prov-test",
  name: "Test Provider",
  category: "Classes",
  borough: "Brooklyn",
  neighborhood: "Park Slope",
  address: "1 Test St",
  activityTypes: ["Art"],
  ageRanges: ["3–5"],
  dayTimeTags: ["Weekday"],
  pricePerClass: 30,
  shortDescription: "Test provider",
  longDescription: "A provider used for schedule tests.",
  rating: 4.8,
  reviewCount: 12,
  badges: [],
  image: "https://i.ibb.co/example/test.jpg",
  email: "",
  website: "https://example.org",
  phone: "",
};

describe("providerSchedule", () => {
  it("derives recurring occurrences inside the next seven days window", () => {
    const provider: Provider = {
      ...baseProvider,
      recurringPrograms: [
        {
          id: "rp-art",
          title: "After-school Art",
          cadence: "Weekly",
          daysOfWeek: ["Tuesday", "Thursday"],
          timeText: "3:30 PM - 4:30 PM",
        },
      ],
    };

    const occurrences = deriveUpcomingOccurrences(provider, new Date("2026-05-26T14:00:00Z"), 7);
    expect(occurrences.map((occurrence) => occurrence.startDate)).toEqual(["2026-05-26", "2026-05-28"]);
    expect(occurrences[0]?.startTime).toBe("15:30");
  });

  it("prefers explicit scheduled instances when deriving the next occurrence", () => {
    const provider: Provider = {
      ...baseProvider,
      scheduledInstances: [
        {
          id: "camp-open-house",
          title: "Camp Open House",
          startDate: "2026-05-27",
          timeText: "10:00 AM - 11:30 AM",
        },
      ],
      recurringPrograms: [
        {
          id: "rp-art",
          title: "After-school Art",
          cadence: "Weekly",
          daysOfWeek: ["Thursday"],
          timeText: "3:30 PM - 4:30 PM",
        },
      ],
    };

    const next = deriveNextOccurrence(provider, new Date("2026-05-26T14:00:00Z"));
    expect(next?.id).toBe("camp-open-house");
    expect(formatUpcomingOccurrenceLabel(next)).toMatch(/May 27/);
  });
});
