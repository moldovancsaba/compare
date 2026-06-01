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
    category: "Classes",
    query: "Hungary Budapest shooting range firearms training official",
    rationale: "Empty Compare catalog launch coverage should start with source-backed Budapest training and range providers.",
  },
  {
    borough: "Hungary",
    neighborhood: "Pest",
    category: "Drop-In Activities",
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
    category: "Drop-In Activities",
    query: "Hungary Heves hunting association shooting club official",
    rationale: "Hunting and shooting association coverage fills Compare field-activity discovery.",
  },
  {
    borough: "Hungary",
    neighborhood: "Borsod-Abaúj-Zemplén",
    category: "Meet-Up Groups",
    query: "Hungary Borsod-Abaúj-Zemplén shooting club association official",
    rationale: "Club and association coverage gives Compare social/group discovery without fake rows.",
  },
  {
    borough: "Hungary",
    neighborhood: "Zala",
    category: "Camps",
    query: "Hungary Zala shooting range training venue official",
    rationale: "Western Hungary range and training coverage rounds out launch discovery.",
  },
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
  if (recommendation.category === "Meet-Up Groups") {
    return "shooting club association official";
  }

  const activity = recommendation.details?.activity.find((item) => item.count === 0)?.name ?? recommendation.details?.activity[0]?.name;
  if (activity) return activity;

  switch (recommendation.category) {
    case "Classes":
      return "shooting course firearms training";
    case "Camps":
      return "shooting range training venue";
    case "Competitions":
      return "shooting competition match calendar";
    case "Drop-In Activities":
      return "hunting shooting range club";
    default:
      return "sport shooting club";
  }
}

function queryForRecommendation(recommendation: ScarcityRecommendation) {
  const keyword = keywordForRecommendation(recommendation);
  const country = recommendation.borough;
  const region = recommendation.neighborhood;

  if (recommendation.category === "Meet-Up Groups") {
    return `${country} ${region} ${keyword}`;
  }
  return `${country} ${region} ${keyword} official`;
}

function buildScarcityTargets(recommendation: ScarcityRecommendation) {
  const targets = [
    `category:${recommendation.category}`,
    `borough:${recommendation.borough}`,
    `neighborhood:${recommendation.neighborhood}`,
  ];

  const lowAge = recommendation.details?.age.find((item) => item.count === 0)?.name ?? recommendation.details?.age[0]?.name;
  const lowDayTime =
    recommendation.details?.dayTime.find((item) => item.count === 0)?.name ?? recommendation.details?.dayTime[0]?.name;
  const lowActivity =
    recommendation.details?.activity.find((item) => item.count === 0)?.name ?? recommendation.details?.activity[0]?.name;

  if (lowAge) targets.push(`age:${lowAge}`);
  if (lowDayTime) targets.push(`dayTime:${lowDayTime}`);
  if (lowActivity) targets.push(`activity:${lowActivity}`);

  return targets;
}

export function buildRangeScoutDiscoveryTargets(snapshot: CatalogSnapshot, maxTargets = 5): DiscoveryTarget[] {
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
    if (uniqueQueries.has(query)) continue;
    uniqueQueries.add(query);
    targets.push({
      targetId: slugify(`${recommendation.category}-${recommendation.borough}-${recommendation.neighborhood}`),
      scarcityTargets: buildScarcityTargets(recommendation),
      borough: recommendation.borough,
      neighborhood: recommendation.neighborhood,
      category: recommendation.category,
      query,
      rationale: recommendation.rationale,
    });
  }

  return targets;
}
