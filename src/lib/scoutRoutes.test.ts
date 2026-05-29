import { describe, expect, it } from "vitest";
import { getDiscoverHref, parseDiscoverState } from "@/lib/scoutRoutes";

describe("scoutRoutes", () => {
  it("serializes and parses discover state with query, sort, and date mode", () => {
    const href = getDiscoverHref("This Week", {
      borough: "Queens",
      neighborhood: "Astoria",
      filters: { ages: ["3–5"], times: ["Weekend"], activity: "Art" },
      q: "robotics",
      sort: "upcoming",
      dateMode: "this-week",
    });

    const params = new URL(href, "https://classscout.vercel.app").searchParams;
    const parsed = parseDiscoverState(params);
    expect(parsed).toMatchObject({
      borough: "Queens",
      neighborhood: "Astoria",
      q: "robotics",
      sort: "upcoming",
      dateMode: "this-week",
    });
    expect(parsed.filters).toEqual({
      ages: ["3–5"],
      times: ["Weekend"],
      activity: "Art",
    });
  });
});
