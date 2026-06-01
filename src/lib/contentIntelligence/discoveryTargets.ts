import type { CatalogSnapshot } from "@/lib/catalogIntelligence";
import type { ScarcityRecommendation } from "@/lib/scarcityReport";

export interface DiscoveryTarget {
  targetId: string;
  scarcityTargets: string[];
  borough: string;
  neighborhood: string;
  category: string;
  query: string;
  rationale: string;
}

const EMPTY_COMPARE_LAUNCH_TARGETS: Array<Pick<DiscoveryTarget, "borough" | "neighborhood" | "category" | "query" | "rationale">> = [
  {
    borough: "Hungary",
    neighborhood: "Budapest",
    category: "Shooting Courses",
    query: "Hungary Budapest shooting range firearms training official",
    rationale: "Empty Compare catalog launch coverage should start with source-backed Budapest training and range providers.",
  },
  {
    borough: "Hungary",
    neighborhood: "Pest",
    category: "Shooting Ranges",
    query: "Hungary Pest county shooting club hunting range official",
    rationale: "Pest county coverage is important for real regional Compare discovery outside central Budapest.",
  },
  {
    borough: "Hungary",
    neighborhood: "Bács-Kiskun",
    category: "Competitions",
    query: "Hungary Bács-Kiskun shooting competition match calendar official",
    rationale: "Competition and match calendar evidence should be collected as a Compare activity signal.",
  },
  {
    borough: "Hungary",
    neighborhood: "Heves",
    category: "Hunting Associations",
    query: "Hungary Heves hunting association shooting club official",
    rationale: "Hunting and shooting association coverage fills Compare field-activity discovery.",
  },
  {
    borough: "Hungary",
    neighborhood: "Borsod-Abaúj-Zemplén",
    category: "Sport Shooting Clubs",
    query: "Hungary Borsod-Abaúj-Zemplén shooting club association official",
    rationale: "Club and association coverage gives Compare social/group discovery without fake rows.",
  },
  {
    borough: "Hungary",
    neighborhood: "Zala",
    category: "Shooting Ranges",
    query: "Hungary Zala shooting range training venue official",
    rationale: "Western Hungary range and training coverage rounds out launch discovery.",
  },
];

const COMPARE_FORBIDDEN_TARGET_TERMS = [
  "birthday",
  "birthdays",
  "kids",
  "children",
  "child",
  "family",
  "families",
  "parent",
  "parents",
  "toddler",
  "camp",
  "after-school",
  "play",
  "travel guide",
  "nomadicmatt",
];

const COMPARE_DOMAIN_TERMS = [
  "shooting",
  "range",
  "rifle",
  "pistol",
  "shotgun",
  "firearms",
  "sport shooting",
  "hunting",
  "hunter",
  "competition",
  "match",
  "club",
  "association",
  "expo",
  "ipsc",
  "idpa",
  "lőtér",
  "lövészet",
  "vadász",
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function keywordForRecommendation(recommendation: ScarcityRecommendation) {
  const activity = recommendation.details?.activity.find((item) => item.count === 0)?.name ?? recommendation.details?.activity[0]?.name;
  const normalizedActivity = String(activity ?? "").trim().toLowerCase();
  if (normalizedActivity && isCompareSafeTargetText(normalizedActivity)) return `${normalizedActivity} official`;

  switch (recommendation.category) {
    case "Classes":
      return "shooting course firearms training official";
    case "Camps":
      return "shooting range training venue official";
    case "Competitions":
      return "shooting competition match calendar official";
    case "Drop-In Activities":
      return "hunting shooting range club official";
    case "Meet-Up Groups":
      return "shooting club association official";
    default:
      return "sport shooting club official";
  }
}

function isCompareSafeTargetText(value: string) {
  const normalized = value.toLowerCase();
  if (COMPARE_FORBIDDEN_TARGET_TERMS.some((term) => normalized.includes(term))) return false;
  return COMPARE_DOMAIN_TERMS.some((term) => normalized.includes(term));
}

function normalizeCompareCategory(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("competition") || normalized.includes("match")) return "Competitions";
  if (normalized.includes("hunt")) return "Hunting Associations";
  if (normalized.includes("club") || normalized.includes("association") || normalized.includes("meet")) return "Sport Shooting Clubs";
  if (normalized.includes("course") || normalized.includes("class") || normalized.includes("training")) return "Shooting Courses";
  return "Shooting Ranges";
}

function queryForRecommendation(recommendation: ScarcityRecommendation) {
  const keyword = keywordForRecommendation(recommendation);
  const country = recommendation.borough;
  const region = recommendation.neighborhood;
  return `${country} ${region} ${keyword}`;
}

export function buildCompareDiscoveryTargets(snapshot: CatalogSnapshot, maxTargets = 5): DiscoveryTarget[] {
  const emptyCatalog = snapshot.providerCountPrivate === 0 && snapshot.meetupCountPrivate === 0;
  const uniqueQueries = new Set<string>();
  const targets: DiscoveryTarget[] = [];

  if (emptyCatalog) {
    return EMPTY_COMPARE_LAUNCH_TARGETS.slice(0, maxTargets).map((target) => ({
      ...target,
      targetId: slugify(`${target.category}-${target.borough}-${target.neighborhood}`),
      scarcityTargets: [
        `category:${target.category}`,
        `borough:${target.borough}`,
        `neighborhood:${target.neighborhood}`,
      ],
    }));
  }

  const recommendations = snapshot.scarcityReport.recommendedFocus.slice(0, maxTargets);

  for (const recommendation of recommendations) {
    const query = queryForRecommendation(recommendation);
    if (!isCompareSafeTargetText(query)) continue;
    if (uniqueQueries.has(query)) continue;
    uniqueQueries.add(query);
    const category = normalizeCompareCategory(query);
    targets.push({
      targetId: slugify(`${category}-${recommendation.borough}-${recommendation.neighborhood}`),
      scarcityTargets: [
        `category:${category}`,
        `borough:${recommendation.borough}`,
        `neighborhood:${recommendation.neighborhood}`,
      ],
      borough: recommendation.borough,
      neighborhood: recommendation.neighborhood,
      category,
      query,
      rationale: recommendation.rationale,
    });
  }

  if (targets.length > 0) return targets;

  return EMPTY_COMPARE_LAUNCH_TARGETS.slice(0, maxTargets).map((target) => ({
    ...target,
    targetId: slugify(`${target.category}-${target.borough}-${target.neighborhood}`),
    scarcityTargets: [
      `category:${target.category}`,
      `borough:${target.borough}`,
      `neighborhood:${target.neighborhood}`,
    ],
  }));
}
