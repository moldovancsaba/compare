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
    return "shooting group meetup";
  }

  const activity = recommendation.details?.activity.find((item) => item.count === 0)?.name ?? recommendation.details?.activity[0]?.name;
  if (activity) return activity;

  switch (recommendation.category) {
    case "Classes":
      return "shooting course training";
    case "Camps":
      return "shooting range competition venue";
    case "Birthday Parties":
      return "competition cup match entry";
    case "Drop-In Activities":
      return "hunting ground group session";
    default:
      return "sport shooting program";
  }
}

function queryForRecommendation(recommendation: ScarcityRecommendation) {
  const keyword = keywordForRecommendation(recommendation);
  if (recommendation.category === "Meet-Up Groups") {
    return `${recommendation.borough} ${recommendation.neighborhood} hunting club shooting ${keyword} official`;
  }
  return `${recommendation.borough} ${recommendation.neighborhood} competition ${keyword} official`;
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
  const recommendations = snapshot.scarcityReport.recommendedFocus.slice(0, maxTargets);
  const uniqueQueries = new Set<string>();
  const targets: DiscoveryTarget[] = [];

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
