import { describe, expect, it } from "vitest";
import { buildCatalogSnapshot } from "@/lib/catalogIntelligence";
import { buildRangeScoutDiscoveryTargets } from "@/lib/contentIntelligence/discoveryTargets";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

describe("buildRangeScoutDiscoveryTargets", () => {
  it("turns scarcity recommendations into official-source search targets", () => {
    const providers: Provider[] = [
      {
        id: "prov-1",
        name: "Park Slope Art",
        category: "Classes",
        borough: "Brooklyn",
        neighborhood: "Park Slope",
        address: "123 Example St",
        activityTypes: ["Art"],
        ageRanges: ["3–5"],
        dayTimeTags: ["Weekday"],
        pricePerClass: 0,
        shortDescription: "Art classes",
        longDescription: "Art classes",
        website: "https://example.com/art",
        phone: "",
        email: "",
        image: "https://i.ibb.co/example.jpg",
        badges: [],
        recurringPrograms: [],
        rating: 0,
        reviewCount: 0,
      },
    ] as Provider[];
    const meetups: MeetupGroup[] = [];
    const snapshot = buildCatalogSnapshot(providers, providers, meetups, meetups);

    const targets = buildRangeScoutDiscoveryTargets(snapshot, 3);

    expect(targets.length).toBeGreaterThan(0);
    expect(targets[0]?.query).toContain("official");
    expect(targets[0]?.scarcityTargets.some((target) => target.startsWith("category:"))).toBe(true);
  });
});
