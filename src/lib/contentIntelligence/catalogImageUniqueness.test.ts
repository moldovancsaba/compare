import { describe, expect, it } from "vitest";
import { buildCatalogImageUniquenessIndex, computePerceptualHashDistance, evaluateCatalogImageUniqueness } from "@/lib/contentIntelligence/catalogImageUniqueness";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

const provider: Provider = {
  id: "prov-1",
  name: "Provider One",
  category: "Classes",
  borough: "Queens",
  neighborhood: "Astoria",
  address: "1 Main St",
  activityTypes: ["Art"],
  ageRanges: ["3–5"],
  dayTimeTags: ["Weekday"],
  pricePerClass: 0,
  shortDescription: "Art class.",
  longDescription: "Art class with weekday availability.",
  rating: 0,
  reviewCount: 0,
  badges: [],
  image: "https://i.ibb.co/shared.jpg",
  email: "",
  website: "https://example.com/a",
  phone: "",
  publishedAt: "2026-05-01T10:00:00.000Z",
  updatedAt: "2026-05-02T10:00:00.000Z",
};

const meetup: MeetupGroup = {
  id: "meet-1",
  name: "Meetup One",
  borough: "Brooklyn",
  neighborhood: "Park Slope",
  groupType: "Parent Meetup",
  ageRange: "0–5",
  cadence: "Weekly",
  instagram: "",
  website: "https://example.com/m",
  description: "Parent meetup",
  initials: "MO",
  icon: "community",
  palette: "teal",
  coverImageUrl: "https://i.ibb.co/meet.jpg",
};

describe("catalog image uniqueness", () => {
  it("flags exact duplicate uploaded urls across entity kinds", () => {
    const index = buildCatalogImageUniquenessIndex({
      providers: [provider],
      meetups: [],
    });

    const result = evaluateCatalogImageUniqueness({
      entityKind: "meetupGroup",
      entityId: "meet-2",
      uploadedUrl: "https://i.ibb.co/shared.jpg",
      index,
    });

    expect(result.status).toBe("duplicate_exact");
    expect(result.incumbent?.entityId).toBe("prov-1");
  });

  it("flags near duplicates from perceptual hashes", () => {
    const index = buildCatalogImageUniquenessIndex({
      providers: [],
      meetups: [meetup],
      fingerprints: [
        {
          entityKind: "meetupGroup",
          entityId: "meet-1",
          imageField: "coverImageUrl",
          uploadedUrl: "https://i.ibb.co/meet.jpg",
          perceptualHash: "1111000011110000111100001111000011110000111100001111000011110000",
          createdAt: "2026-05-01T00:00:00.000Z",
          refreshedAt: "2026-05-01T00:00:00.000Z",
        },
      ],
    });

    const result = evaluateCatalogImageUniqueness({
      entityKind: "provider",
      entityId: "prov-2",
      uploadedUrl: "https://i.ibb.co/other.jpg",
      perceptualHash: "1111000011110000111100001111000011110000111100001111000011110001",
      index,
      nearDuplicateThreshold: 2,
    });

    expect(result.status).toBe("duplicate_near");
    expect(result.matches[0]?.distance).toBe(1);
  });

  it("computes simple hamming distance for perceptual hashes", () => {
    expect(computePerceptualHashDistance("1010", "1011")).toBe(1);
  });
});
