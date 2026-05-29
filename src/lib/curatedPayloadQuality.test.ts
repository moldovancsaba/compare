import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const curatedPayloadQuality = require("../../scripts/lib/curated-payload-quality.cjs");

const { checkPayloadQuality, deriveTagsFromRecurringPrograms } = curatedPayloadQuality as {
  checkPayloadQuality: (payload: unknown, options?: { label?: string }) => string[];
  deriveTagsFromRecurringPrograms: (programs: unknown[]) => Set<string> | string[];
};

describe("curated payload quality", () => {
  it("derives weekday and after-school tags from recurring programs", () => {
    const tags = Array.from(
      deriveTagsFromRecurringPrograms([
        {
          id: "rp-1",
          title: "After-school Art",
          cadence: "Weekly",
          daysOfWeek: ["Tuesday"],
          timeText: "3:30 PM - 5:00 PM",
        },
      ]),
    );

    expect(tags).toContain("Weekday");
    expect(tags).toContain("After-school");
    expect(tags).toContain("Afternoon");
  });

  it("flags missing schedule-derived tags and weak meetup relevance", () => {
    const issues = checkPayloadQuality(
      {
        operations: [
          {
            resource: "provider",
            action: "upsert",
            document: {
              id: "prov-test",
              dayTimeTags: ["Weekday"],
              badges: [],
              image: "https://i.ibb.co/example/provider.jpg",
              recurringPrograms: [
                {
                  id: "rp-1",
                  title: "After-school Art",
                  cadence: "Weekly",
                  daysOfWeek: ["Tuesday"],
                  timeText: "3:30 PM - 5:00 PM",
                },
              ],
            },
          },
          {
            resource: "meetupGroup",
            action: "upsert",
            document: {
              id: "meetup-test",
              description: "A public community gathering for residents.",
              groupType: "Parent Meetup",
              cadence: "Monthly",
              coverImageUrl: "https://i.ibb.co/example/meetup.jpg",
            },
          },
        ],
      },
      { label: "test-payload" },
    );

    expect(issues.some((issue) => issue.includes('missing top-level dayTimeTag "Afternoon"'))).toBe(true);
    expect(issues.some((issue) => issue.includes('missing top-level dayTimeTag "After-school"'))).toBe(true);
    expect(issues.some((issue) => issue.includes("meetup description does not clearly support family / parent / child relevance"))).toBe(true);
  });
});
