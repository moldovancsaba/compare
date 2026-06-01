import { describe, expect, it } from "vitest";
import { buildScarcityReport, renderScarcityMarkdown } from "@/lib/scarcityReport";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

const providers: Provider[] = [
  {
    id: "prov-1",
    name: "Bavaria Camp",
    category: "Camps",
    borough: "Germany",
    neighborhood: "Bavaria",
    address: "1 Example St",
    activityTypes: ["Sports"],
    ageRanges: ["6–8"],
    dayTimeTags: ["Weekday", "Morning"],
    pricePerClass: 100,
    shortDescription: "Camp",
    longDescription: "Camp listing long enough for tests.",
    rating: 0,
    reviewCount: 0,
    badges: [],
    image: "",
    email: "",
    website: "https://example.org/camp",
    phone: "",
  },
  {
    id: "prov-2",
    name: "Catalonia Birthday",
    category: "Competitions",
    borough: "Spain",
    neighborhood: "Catalonia",
    address: "2 Example St",
    activityTypes: ["Art"],
    ageRanges: ["3–5"],
    dayTimeTags: ["Weekend", "Afternoon"],
    pricePerClass: 200,
    shortDescription: "Party",
    longDescription: "Birthday listing long enough for tests.",
    rating: 0,
    reviewCount: 0,
    badges: [],
    image: "",
    email: "",
    website: "https://example.org/party",
    phone: "",
  },
];

const meetups: MeetupGroup[] = [
  {
    id: "meetup-1",
    name: "Bavaria Parents",
    borough: "Germany",
    neighborhood: "Bavaria",
    groupType: "Parent Meetup",
    ageRange: "All ages",
    cadence: "Monthly",
    instagram: "",
    website: "https://example.org/meetup",
    description: "Parent meetup for local families and children.",
    initials: "QP",
    icon: "community",
    palette: "teal",
    coverImageUrl: "https://i.ibb.co/example/meetup.jpg",
  },
];

describe("scarcity report", () => {
  it("builds deterministic rankings from providers and meetups", () => {
    const report = buildScarcityReport(providers, meetups, { generatedAt: "2026-05-20T00:00:00.000Z" });

    expect(report.categories[0]?.category).toBe("Classes");
    expect(report.categories[0]?.count).toBe(0);
    expect(report.recommendedFocus).toHaveLength(5);
    expect(report.boroughRankings["Meet-Up Groups"][0]?.count).toBe(0);
  });

  it("renders markdown with recommendations", () => {
    const markdown = renderScarcityMarkdown(buildScarcityReport(providers, meetups, { generatedAt: "2026-05-20T00:00:00.000Z" }));

    expect(markdown).toContain("# RangeScout Scarcity Report");
    expect(markdown).toContain("## Recommended next focuses");
    expect(markdown).toMatch(/Classes \/ .+ \/ .+/);
  });
});
