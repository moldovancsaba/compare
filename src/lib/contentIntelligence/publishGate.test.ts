import { describe, expect, it } from "vitest";
import { runRangeScoutPublishGate } from "@/lib/contentIntelligence/publishGate";
import type { Provider } from "@/types/provider";

const provider: Provider = {
  id: "prov-test-gate",
  name: "Gate Test",
  category: "Classes",
  borough: "Queens",
  neighborhood: "Astoria",
  address: "12 Test Ave",
  activityTypes: ["Music"],
  ageRanges: ["3–5"],
  dayTimeTags: ["Weekday"],
  pricePerClass: 0,
  shortDescription: "Music classes for children in Astoria.",
  longDescription: "Music classes for children in Astoria with recurring weekly scheduling and family-friendly programming.",
  rating: 0,
  reviewCount: 0,
  badges: [],
  image: "https://i.ibb.co/example-provider.jpg",
  email: "",
  website: "https://example.com/classes",
  phone: "",
  recurringPrograms: [
    {
      id: "rp-1",
      title: "After-school music",
      cadence: "Weekly",
      daysOfWeek: ["Tuesday"],
      timeText: "3:30 PM - 4:30 PM",
    },
  ],
};

describe("publish gate", () => {
  it("blocks payloads that fail curated quality checks", async () => {
    const result = await runRangeScoutPublishGate({
      entityKind: "provider",
      draftPayload: provider,
      adapterVersion: "test",
    });

    expect(result.approved).toBe(false);
    expect(result.errors.some((error) => error.code === "quality_invariant_failed")).toBe(true);
  });

  it("blocks duplicate images against the live uniqueness index", async () => {
    const result = await runRangeScoutPublishGate({
      entityKind: "provider",
      draftPayload: {
        ...provider,
        id: "prov-test-gate-2",
        longDescription:
          "Music classes for children in Astoria with recurring weekly scheduling, family-friendly programming, and source-backed details that satisfy curated quality checks.",
      },
      adapterVersion: "test",
      imageUniquenessIndex: {
        imagesByUrl: new Map([
          [
            "https://i.ibb.co/example-provider.jpg",
            [
              {
                entityKind: "provider",
                entityId: "prov-existing",
                imageField: "image",
                uploadedUrl: "https://i.ibb.co/example-provider.jpg",
                publishedAt: "2026-05-01T00:00:00.000Z",
              },
            ],
          ],
        ]),
        fingerprints: [],
      },
    });

    expect(result.approved).toBe(false);
    expect(result.errors.some((error) => error.code === "duplicate_image_exact")).toBe(true);
  });
});
