import { describe, expect, it } from "vitest";
import { getDiscoverHref, parseDiscoverState } from "@/lib/scoutRoutes";

describe("scoutRoutes", () => {
  it("serializes and parses discover state with query, sort, and date mode", () => {
    const href = getDiscoverHref("This Week", {
      borough: "Germany",
      neighborhood: "Bavaria",
      filters: { ages: ["Beginner"], times: ["Weekend"], activity: "Rifle" },
      q: "robotics",
      sort: "upcoming",
      dateMode: "this-week",
    });

    const params = new URL(href, "https://rangescout.example.com").searchParams;
    const parsed = parseDiscoverState(params);
    expect(parsed).toMatchObject({
      borough: "Germany",
      neighborhood: "Bavaria",
      q: "robotics",
      sort: "upcoming",
      dateMode: "this-week",
    });
    expect(parsed.filters).toEqual({
      ages: ["Beginner"],
      times: ["Weekend"],
      activity: "Rifle",
    });
  });
});
