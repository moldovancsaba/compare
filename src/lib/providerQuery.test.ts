import { describe, expect, it } from "vitest";
import { queryProviders } from "@/lib/providerQuery";
import type { Provider } from "@/types/provider";

const provider = (overrides: Partial<Provider>): Provider => ({
  id: "prov-default",
  name: "Default Provider",
  category: "Classes",
  borough: "Queens",
  neighborhood: "Astoria",
  address: "1 Example Ave",
  activityTypes: ["Art"],
  ageRanges: ["3–5"],
  dayTimeTags: ["Weekday"],
  pricePerClass: 25,
  shortDescription: "Default short description",
  longDescription: "Default long description for provider query tests.",
  rating: 4.5,
  reviewCount: 10,
  badges: [],
  image: "https://i.ibb.co/example/test.jpg",
  email: "",
  website: "https://example.org",
  phone: "",
  publishedAt: "2026-05-20T00:00:00.000Z",
  ...overrides,
});

describe("queryProviders", () => {
  it("defaults to newest-first ordering for browse results", () => {
    const results = queryProviders(
      [
        provider({ id: "prov-old", name: "Old", publishedAt: "2026-05-01T00:00:00.000Z" }),
        provider({ id: "prov-new", name: "New", publishedAt: "2026-05-25T00:00:00.000Z" }),
      ],
      "Classes",
      {
        borough: "All",
        neighborhood: null,
        filters: { ages: [], times: [], activity: null },
        q: "",
        sort: "newest",
        dateMode: "all",
      },
    );

    expect(results.results.map((entry) => entry.id)).toEqual(["prov-new", "prov-old"]);
  });

  it("ranks stronger name matches ahead of description-only matches", () => {
    const results = queryProviders(
      [
        provider({
          id: "prov-name",
          name: "Robotics Lab Kids",
          shortDescription: "Hands-on science classes",
          publishedAt: "2026-05-01T00:00:00.000Z",
        }),
        provider({
          id: "prov-description",
          name: "Future Builders",
          shortDescription: "Robotics projects and STEM challenges",
          publishedAt: "2026-05-25T00:00:00.000Z",
        }),
      ],
      "Classes",
      {
        borough: "All",
        neighborhood: null,
        filters: { ages: [], times: [], activity: null },
        q: "robotics",
        sort: "relevance",
        dateMode: "all",
      },
    );

    expect(results.results.map((entry) => entry.id)).toEqual(["prov-name", "prov-description"]);
  });

  it("limits This Week results to providers with real upcoming occurrences and sorts by upcoming date", () => {
    const results = queryProviders(
      [
        provider({
          id: "prov-thursday",
          name: "Thursday Music",
          recurringPrograms: [
            {
              id: "rp-thu",
              title: "Thursday Music",
              cadence: "Weekly",
              daysOfWeek: ["Thursday"],
              timeText: "4:00 PM - 5:00 PM",
            },
          ],
        }),
        provider({
          id: "prov-friday",
          name: "Friday Music",
          recurringPrograms: [
            {
              id: "rp-fri",
              title: "Friday Music",
              cadence: "Weekly",
              daysOfWeek: ["Friday"],
              timeText: "4:00 PM - 5:00 PM",
            },
          ],
        }),
        provider({ id: "prov-none", name: "No Schedule" }),
      ],
      null,
      {
        borough: "All",
        neighborhood: null,
        filters: { ages: [], times: [], activity: null },
        q: "",
        sort: "upcoming",
        dateMode: "this-week",
      },
      new Date("2026-05-26T14:00:00Z"),
    );

    expect(results.results.map((entry) => entry.id)).toEqual(["prov-thursday", "prov-friday"]);
  });
});
