import { describe, expect, it } from "vitest";
import { buildCatalogSnapshot } from "@/lib/catalogIntelligence";
import { buildCompareDiscoveryTargets } from "@/lib/contentIntelligence/discoveryTargets";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

describe("buildCompareDiscoveryTargets", () => {
  it("turns scarcity recommendations into Compare-safe official-source search targets", () => {
    const providers: Provider[] = [
      {
        id: "prov-1",
        name: "Budapest Rifle Range",
        category: "Classes",
        borough: "Hungary",
        neighborhood: "Budapest",
        address: "123 Example St",
        activityTypes: ["Rifle"],
        ageRanges: ["Licensed Adult"],
        dayTimeTags: ["Weekday"],
        pricePerClass: 0,
        shortDescription: "Rifle training",
        longDescription: "Rifle training",
        website: "https://example.com/rifle",
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

    const targets = buildCompareDiscoveryTargets(snapshot, 3);

    expect(targets.length).toBeGreaterThan(0);
    expect(targets[0]?.query).toContain("official");
    expect(targets[0]?.query).toMatch(/\b(shooting|range|rifle|pistol|shotgun|hunting|competition|club)\b/i);
    expect(targets.map((target) => target.query).join(" ")).not.toMatch(/\b(birthday|kids|children|family|parent|travel guide)\b/i);
    expect(targets[0]?.scarcityTargets.some((target) => target.startsWith("category:"))).toBe(true);
  });

  it("falls back to Compare launch targets when existing snapshot content is not Compare-safe", () => {
    const providers: Provider[] = [
      {
        id: "prov-1",
        name: "Park Slope Birthday Party",
        category: "Classes",
        borough: "Brooklyn",
        neighborhood: "Park Slope",
        address: "123 Example St",
        activityTypes: ["Art"],
        ageRanges: ["3–5"],
        dayTimeTags: ["Weekday"],
        pricePerClass: 0,
        shortDescription: "Birthday party activities",
        longDescription: "Birthday party activities",
        website: "https://example.com/birthday",
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

    const targets = buildCompareDiscoveryTargets(snapshot, 5);

    expect(targets.length).toBe(5);
    expect(targets.map((target) => target.query).join(" ")).toMatch(/\b(shooting|range|rifle|pistol|shotgun|hunting|competition|club)\b/i);
    expect(targets.map((target) => target.query).join(" ")).not.toMatch(/\b(birthday|kids|children|family|parent|travel guide)\b/i);
  });

  it("prioritizes empty required Visitor category/location filters before normal maintenance", () => {
    const providers: Provider[] = [
      {
        id: "prov-1",
        name: "Budapest Competition Calendar",
        category: "Competitions",
        borough: "Hungary",
        neighborhood: "Budapest",
        address: "Budapest, Hungary",
        activityTypes: ["IPSC"],
        ageRanges: ["Licensed Adult"],
        dayTimeTags: ["Weekend"],
        pricePerClass: 0,
        shortDescription: "Competition calendar",
        longDescription: "Competition calendar",
        website: "https://example.com/competition",
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

    const targets = buildCompareDiscoveryTargets(snapshot, 3);

    expect(targets[0]).toMatchObject({
      borough: "Hungary",
      neighborhood: "Budapest",
      category: "Shooting Courses",
    });
    expect(targets[0]?.scarcityTargets).toContain("category:Shooting Courses");
    expect(targets[0]?.query).toContain("Hungary Budapest");
    expect(targets[0]?.query).toMatch(/\bshooting course\b/i);
  });
});
