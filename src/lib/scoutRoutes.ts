import { ACTIVITY_TYPES, AGE_RANGES, DAY_TIME_TAGS } from "@/data/providers";
import { BOROUGHS } from "@/data/locations";
import { DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n/config";
import { localizePath, stripLocaleFromPathname } from "@/lib/i18n/paths";
import type { Borough, BoroughChoice, Category } from "@/types/provider";
import type { FilterState } from "@/components/scout/Filters";
import type { DiscoverDateMode, DiscoverSort } from "@/lib/providerQuery";

export type ScoutPageKey =
  | Category
  | "This Week"
  | "Saved"
  | "Calculator"
  | "Meet-Up Groups"
  | "Home"
  | "My Account"
  | "Neighborhood Guide";

const CATEGORY_TO_SLUG: Record<Category, string> = {
  Classes: "training",
  Camps: "ranges",
  "Competitions": "competitions",
  "Drop-In Activities": "hunting-grounds",
};

export const ROUTE_ALIASES: Record<string, Category | ScoutPageKey> = {
  ...Object.fromEntries(Object.entries(CATEGORY_TO_SLUG).map(([category, slug]) => [slug, category as Category])),
  // legacy / compatibility slugs
  classes: "Classes",
  class: "Classes",
  "kids-classes": "Classes",
  camps: "Camps",
  range: "Camps",
  competitions: "Competitions",
  "drop-in-activities": "Drop-In Activities",
  "range-scout": "Camps",
  "hunting-grounds": "Drop-In Activities",
  "meet-up-groups": "Meet-Up Groups",
  "sports-clubs": "Meet-Up Groups",
  clubs: "Meet-Up Groups",
  "this-week": "This Week",
  saved: "Saved",
  calculator: "Calculator",
  "my-account": "My Account",
  "neighborhood-guides": "Neighborhood Guide",
  // canonical aliases
  training: "Classes",
};

const SLUG_TO_CATEGORY = ROUTE_ALIASES as Record<string, Category | ScoutPageKey>;

export const PUBLIC_SLUG_ROUTES = Object.keys(SLUG_TO_CATEGORY);

const VIEW_HREFS: Record<ScoutPageKey, string> = {
  Home: "/",
  Classes: "/training",
  Camps: "/ranges",
  "Competitions": "/competitions",
  "Drop-In Activities": "/hunting-grounds",
  "This Week": "/this-week",
  "Meet-Up Groups": "/clubs",
  Saved: "/saved",
  Calculator: "/calculator",
  "My Account": "/my-account",
  "Neighborhood Guide": "/neighborhood-guides",
};

export function getHrefForView(view: ScoutPageKey, locale: AppLocale = DEFAULT_LOCALE): string {
  return getLocalizedHrefForView(view, locale);
}

export function getLocalizedHrefForView(
  view: ScoutPageKey,
  locale: AppLocale = DEFAULT_LOCALE,
  params?: URLSearchParams,
) {
  return localizePath(withSearch(VIEW_HREFS[view], params ?? new URLSearchParams()), locale);
}

export function getViewFromPathname(pathname: string): ScoutPageKey {
  const normalized = stripLocaleFromPathname(pathname).replace(/\/+$/, "") || "/";
  if (normalized === "/") return "Home";
  const slug = normalized.slice(1).toLowerCase();
  const route = SLUG_TO_CATEGORY[slug];
  if (route) return route as ScoutPageKey;
  return "Home";
}

export function isDiscoverCategory(view: ScoutPageKey): view is Category {
  return view in CATEGORY_TO_SLUG;
}

function sanitizeSort(value: string | null): DiscoverSort | null {
  if (!value) return null;
  return ["newest", "oldest", "relevance", "upcoming"].includes(value) ? (value as DiscoverSort) : null;
}

function sanitizeDateMode(value: string | null): DiscoverDateMode {
  return value === "this-week" ? "this-week" : "all";
}

function sanitizeBorough(value: string | null): BoroughChoice | null {
  if (!value) return null;
  if (value === "All") return "All";
  return BOROUGHS.includes(value as Borough) ? (value as Borough) : null;
}

function sanitizeList<T extends string>(value: string | null, allowed: readonly T[]): T[] {
  if (!value) return [];
  const parts = value
    .split(",")
    .map((item) => decodeURIComponent(item.trim()))
    .filter(Boolean);
  return parts.filter((item): item is T => allowed.includes(item as T));
}

function setListParam(params: URLSearchParams, key: string, values: string[]) {
  if (values.length === 0) {
    params.delete(key);
    return;
  }
  params.set(key, values.join(","));
}

function withSearch(baseHref: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${baseHref}?${query}` : baseHref;
}

export function getDiscoverHref(
  category: Category | "This Week",
  state?: {
    borough?: BoroughChoice | null;
    neighborhood?: string | null;
    filters?: FilterState;
    q?: string | null;
    sort?: DiscoverSort | null;
    dateMode?: DiscoverDateMode;
  },
  locale: AppLocale = DEFAULT_LOCALE,
) {
  const params = new URLSearchParams();
  if (state?.borough && state.borough !== "All") params.set("borough", state.borough);
  if (state?.borough === "All") params.delete("borough");
  if (state?.borough && state.borough !== "All" && state.neighborhood?.trim()) {
    params.set("neighborhood", state.neighborhood.trim());
  }
  if (state?.filters) {
    setListParam(params, "ages", state.filters.ages);
    setListParam(params, "times", state.filters.times);
    if (state.filters.activity?.trim()) params.set("activity", state.filters.activity.trim());
  }
  if (state?.q?.trim()) params.set("q", state.q.trim());
  if (state?.sort) params.set("sort", state.sort);
  if (state?.dateMode === "this-week") params.set("dateMode", "this-week");
  return withSearch(getHrefForView(category, locale), params);
}

export function getMeetupGroupsHref(
  state?: { borough?: BoroughChoice | null; neighborhood?: string | null },
  locale: AppLocale = DEFAULT_LOCALE,
) {
  const params = new URLSearchParams();
  if (state?.borough && state.borough !== "All") params.set("borough", state.borough);
  if (state?.borough && state.borough !== "All" && state.neighborhood?.trim()) {
    params.set("neighborhood", state.neighborhood.trim());
  }
  return withSearch(getHrefForView("Meet-Up Groups", locale), params);
}

export function getNeighborhoodGuideHref(
  state: { borough: BoroughChoice; neighborhood: string },
  locale: AppLocale = DEFAULT_LOCALE,
) {
  const params = new URLSearchParams();
  if (state.borough !== "All") params.set("borough", state.borough);
  if (state.neighborhood.trim()) params.set("neighborhood", state.neighborhood.trim());
  return withSearch(getHrefForView("Neighborhood Guide", locale), params);
}

export function parseDiscoverState(searchParams: URLSearchParams) {
  const borough = sanitizeBorough(searchParams.get("borough")) ?? "All";
  const neighborhood = borough === "All" ? null : searchParams.get("neighborhood")?.trim() || null;
  const q = searchParams.get("q")?.trim() ?? "";
  const dateMode = sanitizeDateMode(searchParams.get("dateMode"));
  const requestedSort = sanitizeSort(searchParams.get("sort"));
  const filters: FilterState = {
    ages: sanitizeList(searchParams.get("ages"), AGE_RANGES),
    times: sanitizeList(searchParams.get("times"), DAY_TIME_TAGS),
    activity: sanitizeList(searchParams.get("activity"), ACTIVITY_TYPES)[0] ?? null,
  };
  const sort = requestedSort ?? (dateMode === "this-week" ? "upcoming" : q ? "relevance" : "newest");
  return { borough, neighborhood, filters, q, sort, dateMode };
}

export function parseMeetupState(searchParams: URLSearchParams) {
  const borough = sanitizeBorough(searchParams.get("borough")) ?? "All";
  const neighborhood = borough === "All" ? null : searchParams.get("neighborhood")?.trim() || null;
  return { borough, neighborhood };
}

export function parseNeighborhoodGuideState(searchParams: URLSearchParams) {
  const borough = sanitizeBorough(searchParams.get("borough")) ?? "All";
  const neighborhood = searchParams.get("neighborhood")?.trim() || null;
  return { borough, neighborhood };
}
