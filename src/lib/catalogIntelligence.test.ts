import { describe, expect, it } from "vitest";
import { buildCatalogSnapshot, buildDedupeSupportIndex } from "@/lib/catalogIntelligence";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

const provider: Provider = {
  id: "prov-test-music",
  name: "Test Music",
  category: "Classes",
  borough: "Queens",
  neighborhood: "Astoria",
  address: "12 Music Ave, Astoria, NY",
  activityTypes: ["Music"],
  ageRanges: ["3–5"],
  dayTimeTags: ["Weekday", "Afternoon"],
  pricePerClass: 40,
  shortDescription: "Small-group music classes for preschoolers.",
  longDescription: "Small-group music classes for preschoolers with a weekly afternoon schedule in Astoria.",
  rating: 4.8,
  reviewCount: 12,
  badges: ["Popular"],
  image: "https://i.ibb.co/example.jpg",
  email: "hello@example.com",
  website: "https://example.com/music",
  phone: "555-0100",
  recurringPrograms: [
    {
      id: "weekly-music",
      title: "Weekly Music",
      cadence: "Weekly",
      daysOfWeek: ["Tuesday"],
      timeText: "3:30 PM",
    },
  ],
};

const meetup: MeetupGroup = {
  id: "meetup-test-astoria",
  name: "Astoria Families",
  borough: "Queens",
  neighborhood: "Astoria",
  groupType: "Neighborhood Families",
  ageRange: "0–5",
  cadence: "Weekly",
  instagram: "@astoriafamilies",
  website: "https://example.com/meetup",
  description: "Weekly neighborhood meetup for Astoria families.",
  initials: "AF",
  icon: "community",
  palette: "teal",
  coverImageUrl: "https://i.ibb.co/meetup.jpg",
};

describe("catalog intelligence", () => {
  it("builds a snapshot with drift details and scarcity data", () => {
    const snapshot = buildCatalogSnapshot([provider], [], [meetup], [], "2026-05-26T00:00:00.000Z");

    expect(snapshot.providerCountPrivate).toBe(1);
    expect(snapshot.providerCountPublic).toBe(0);
    expect(snapshot.meetupCountPrivate).toBe(1);
    expect(snapshot.driftSummary.total).toBe(2);
    expect(snapshot.recurringProgramCoverage.providerCountWithRecurringPrograms).toBe(1);
    expect(snapshot.activityTypeBreakdown.Music).toBe(1);
    expect(snapshot.scarcityReport.providersCount).toBe(1);
  });

  it("builds a normalized dedupe support index", () => {
    const index = buildDedupeSupportIndex([provider], [meetup]);
    expect(index.providerNames).toContain("test music");
    expect(index.addresses).toContain("12 music ave, astoria, ny");
    expect(index.websites).toContain("https://example.com/music");
  });
});
