import { describe, expect, it } from "vitest";
import { buildCatalogWatchdogReport } from "@/lib/catalogOps/watchdog";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

function provider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: "provider-1",
    name: "Provider",
    category: "Classes",
    borough: "Brooklyn",
    neighborhood: "Park Slope",
    address: "123 Main St",
    activityTypes: ["Art"],
    ageRanges: ["3–5"],
    dayTimeTags: ["Weekday"],
    pricePerClass: 30,
    shortDescription: "Short",
    longDescription: "Long",
    rating: 5,
    reviewCount: 1,
    badges: [],
    image: "https://i.ibb.co/example.jpg",
    email: "hi@example.com",
    website: "https://example.com",
    phone: "555-555-5555",
    ...overrides,
  };
}

function meetup(overrides: Partial<MeetupGroup> = {}): MeetupGroup {
  return {
    id: "park-slope-families-2026-05-27",
    name: "Park Slope Families",
    borough: "Brooklyn",
    neighborhood: "Park Slope",
    groupType: "Neighborhood Families",
    ageRange: "0–5",
    cadence: "Weekly",
    instagram: "",
    website: "",
    description: "",
    initials: "PS",
    icon: "community",
    palette: "teal",
    ...overrides,
  };
}

describe("catalog watchdog", () => {
  it("raises silence incidents when no fresh catalog content exists", () => {
    const report = buildCatalogWatchdogReport({
      nowIso: "2026-05-28T12:00:00.000Z",
      providers: [provider({ publishedAt: "2026-05-20T12:00:00.000Z", updatedAt: "2026-05-20T12:00:00.000Z" })],
      meetups: [meetup({ id: "park-slope-families-2026-05-01" })],
    });

    expect(report.incidents.map((incident) => incident.code)).toContain("no_new_provider_content");
    expect(report.incidents.map((incident) => incident.code)).toContain("no_new_meetup_content");
  });

  it("does not raise silence incidents when publish activity is fresh", () => {
    const report = buildCatalogWatchdogReport({
      nowIso: "2026-05-28T12:00:00.000Z",
      providers: [provider({ publishedAt: "2026-05-27T18:00:00.000Z", updatedAt: "2026-05-27T18:00:00.000Z" })],
      meetups: [meetup({ id: "park-slope-families-2026-05-27" })],
    });

    expect(report.incidents.map((incident) => incident.code)).not.toContain("no_new_provider_content");
    expect(report.incidents.map((incident) => incident.code)).not.toContain("no_new_meetup_content");
  });
});
