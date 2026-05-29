import { describe, expect, it } from "vitest";
import { isObsoleteFamilyMeetup, isObsoleteFamilyProvider } from "@/lib/catalogContentPolicy";

describe("catalog content policy", () => {
  it("marks legacy kid provider records as obsolete", () => {
    expect(
      isObsoleteFamilyProvider({
        id: "prov-kid-club",
        name: "Little Stars Kids Studio",
        category: "Classes",
        borough: "Brooklyn",
        neighborhood: "Park Slope",
        address: "123 Learning Ave",
        activityTypes: ["Art"],
        ageRanges: ["3–5"],
        dayTimeTags: ["Weekday"],
        pricePerClass: 10,
        shortDescription: "Fun art classes for children.",
        longDescription: "A playful class for toddlers and young children with guided activities.",
        rating: 4.6,
        reviewCount: 2,
        badges: [],
        image: "https://i.ibb.co/example/one.jpg",
        email: "parent@example.org",
        website: "https://example.org",
        phone: "",
      }),
    ).toBe(true);
  });

  it("keeps provider rows that look like shooting listings", () => {
    expect(
      isObsoleteFamilyProvider({
        id: "prov-rifle-range",
        name: "Downtown Rifle Range",
        category: "Camps",
        borough: "Manhattan",
        neighborhood: "SoHo",
        address: "77 Range Street",
        activityTypes: ["Rifle", "Competition"],
        ageRanges: ["Beginner", "Licensed Adult"],
        dayTimeTags: ["Weekend"],
        pricePerClass: 35,
        shortDescription: "Indoor rifle training and coaching.",
        longDescription: "Practice sessions for licensed adults with certified safety coaching and coaching.",
        rating: 4.7,
        reviewCount: 11,
        badges: ["Competition Ready"],
        image: "https://i.ibb.co/example/two.jpg",
        email: "range@example.org",
        website: "https://example.org",
        phone: "",
      }),
    ).toBe(false);
  });

  it("marks legacy family meetups as obsolete", () => {
    expect(
      isObsoleteFamilyMeetup({
        id: "group-families",
        name: "Park Families Meetup",
        borough: "Queens",
        neighborhood: "Astoria",
        groupType: "Neighborhood Families",
        ageRange: "All ages",
        cadence: "Monthly",
        instagram: "",
        website: "https://example.org",
        description: "Monthly parents-and-kids social meetups in Queens.",
        initials: "PF",
        icon: "community",
        palette: "teal",
      }),
    ).toBe(true);
  });

  it("keeps sport-shooting meetups", () => {
    expect(
      isObsoleteFamilyMeetup({
        id: "group-shooting",
        name: "Bronx Airgun Academy",
        borough: "Bronx",
        neighborhood: "Fordham",
        groupType: "Airgun Academy",
        ageRange: "Licensed Adult",
        cadence: "Weekly",
        instagram: "",
        website: "https://example.org",
        description: "Weekly training and safety updates for airgun competitors.",
        initials: "BA",
        icon: "target",
        palette: "beige",
      }),
    ).toBe(false);
  });
});
