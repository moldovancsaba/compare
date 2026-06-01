import { describe, expect, it } from "vitest";
import { getDiscoverHref, getHrefForView, getViewFromPathname, parseDiscoverState } from "@/lib/scoutRoutes";
import { locales } from "@/lib/i18n/config";
import { PUBLIC_SLUG_ROUTES } from "@/lib/scoutRoutes";

describe("scoutRoutes", () => {
  it("serializes and parses discover state with query, sort, and date mode", () => {
    const href = getDiscoverHref("This Week", {
      borough: "Hungary",
      neighborhood: "Budapest",
      filters: { ages: ["Beginner"], times: ["Weekend"], activity: "Rifle" },
      q: "robotics",
      sort: "upcoming",
      dateMode: "this-week",
    });

    const params = new URL(href, "https://compare.example.com").searchParams;
    const parsed = parseDiscoverState(params);
    expect(parsed).toMatchObject({
      borough: "Hungary",
      neighborhood: "Budapest",
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
    expect(getViewFromPathname("/en/class")).toBe("Classes");
    expect(getViewFromPathname("/competitions")).toBe("Competitions");
    expect(getViewFromPathname("/en/range")).toBe("Camps");
    expect(getViewFromPathname("/MEET-UP-GROUPS")).toBe("Meet-Up Groups");
    expect(getViewFromPathname("/en/this-week")).toBe("This Week");
    expect(getViewFromPathname("/en/range-scout")).toBe("Camps");
  });

  it("supports every supported locale for all route aliases", () => {
    for (const locale of locales) {
      expect(getHrefForView("Classes", locale).startsWith(`/${locale}`)).toBe(true);
      expect(getHrefForView("Camps", locale).startsWith(`/${locale}`)).toBe(true);
      expect(getHrefForView("Competitions", locale).startsWith(`/${locale}`)).toBe(true);
      expect(getHrefForView("Drop-In Activities", locale).startsWith(`/${locale}`)).toBe(true);
      expect(getHrefForView("This Week", locale).startsWith(`/${locale}`)).toBe(true);
      expect(getHrefForView("Saved", locale).startsWith(`/${locale}`)).toBe(true);
      expect(getHrefForView("Calculator", locale).startsWith(`/${locale}`)).toBe(true);
      expect(getHrefForView("My Account", locale).startsWith(`/${locale}`)).toBe(true);
      for (const slug of PUBLIC_SLUG_ROUTES) {
        expect(getViewFromPathname(`/${locale}/${slug}`)).not.toBe("Home");
      }
    }
  });
});
