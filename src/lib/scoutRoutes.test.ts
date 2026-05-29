import { describe, expect, it } from "vitest";
import { getDiscoverHref, getViewFromPathname, parseDiscoverState } from "@/lib/scoutRoutes";

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

  it("maps legacy and mixed-case route slugs to stable views", () => {
    expect(getViewFromPathname("/competitions")).toBe("Birthday Parties");
    expect(getViewFromPathname("/MEET-UP-GROUPS")).toBe("Meet-Up Groups");
    expect(getViewFromPathname("/en/this-week")).toBe("This Week");
    expect(getViewFromPathname("/en/range-scout")).toBe("Camps");
  });
});
