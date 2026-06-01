import { BOROUGHS, NEIGHBORHOODS } from "@/data/locations";
import type { MeetupGroup } from "@/types/meetup";
import type { AgeRange, DayTimeTag, Provider } from "@/types/provider";

export type ScarcityCategory =
  | "Classes"
  | "Camps"
  | "Competitions"
  | "Drop-In Activities"
  | "Meet-Up Groups";

export type ScarcityCountRow = { name: string; count: number };

export type ScarcityNeighborhoodRow = {
  category: ScarcityCategory;
  borough: string;
  neighborhood: string;
  count: number;
};

export type ScarcityRecommendation = ScarcityNeighborhoodRow & {
  rationale: string;
  urgency: "contractual-zero-filter" | "underrepresented";
  details?: {
    age: ScarcityCountRow[];
    dayTime: ScarcityCountRow[];
    activity: ScarcityCountRow[];
  };
};

export type ScarcityReport = {
  generatedAt: string;
  providersCount: number;
  meetupCount: number;
  categories: { category: ScarcityCategory; count: number }[];
  boroughRankings: Record<string, ScarcityCountRow[]>;
  neighborhoodRankings: Record<string, ScarcityNeighborhoodRow[]>;
  recommendedFocus: ScarcityRecommendation[];
};

const AGE_BUCKETS: AgeRange[] = ["0–2", "3–5", "6–8", "9–12", "Teens"];
const DAY_TAGS: DayTimeTag[] = ["Weekday", "Weekend", "Morning", "Afternoon", "Evening", "After-school"];
const VISITOR_FILTER_PRIORITY: ScarcityCategory[] = ["Classes", "Camps", "Competitions", "Drop-In Activities", "Meet-Up Groups"];

function byCountThenName(a: ScarcityCountRow, b: ScarcityCountRow) {
  if (a.count !== b.count) return a.count - b.count;
  return a.name.localeCompare(b.name);
}

function pushCount(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) || 0) + 1);
}

export function buildCategoryRows(providers: Provider[], meetups: MeetupGroup[]) {
  const rows: { category: ScarcityCategory; count: number }[] = [
    { category: "Classes", count: providers.filter((p) => p.category === "Classes").length },
    { category: "Camps", count: providers.filter((p) => p.category === "Camps").length },
    { category: "Competitions", count: providers.filter((p) => p.category === "Competitions").length },
    { category: "Drop-In Activities", count: providers.filter((p) => p.category === "Drop-In Activities").length },
    { category: "Meet-Up Groups", count: meetups.length },
  ];
  return rows.sort((a, b) => a.count - b.count || a.category.localeCompare(b.category));
}

export function collectNeighborhoodRows(category: ScarcityCategory, providers: Provider[], meetups: MeetupGroup[]) {
  return BOROUGHS.flatMap((borough) => {
    const supportedNeighborhoods = NEIGHBORHOODS[borough];
    return supportedNeighborhoods.map((neighborhood) => {
      const count =
        category === "Meet-Up Groups"
          ? meetups.filter((m) => m.borough === borough && m.neighborhood === neighborhood).length
          : providers.filter((p) => p.category === category && p.borough === borough && p.neighborhood === neighborhood).length;
      return { category, borough, neighborhood, count };
    });
  }).sort((a, b) => a.count - b.count || a.borough.localeCompare(b.borough) || a.neighborhood.localeCompare(b.neighborhood));
}

export function collectBoroughRows(category: ScarcityCategory, providers: Provider[], meetups: MeetupGroup[]) {
  return BOROUGHS.map((borough) => {
    const count =
      category === "Meet-Up Groups"
        ? meetups.filter((m) => m.borough === borough).length
        : providers.filter((p) => p.category === category && p.borough === borough).length;
    return { name: borough, count };
  }).sort(byCountThenName);
}

export function collectSliceDetails(
  category: Exclude<ScarcityCategory, "Meet-Up Groups">,
  borough: string,
  neighborhood: string,
  providers: Provider[],
) {
  const slice = providers.filter((p) => p.category === category && p.borough === borough && p.neighborhood === neighborhood);
  const ageCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();
  const activityCounts = new Map<string, number>();

  AGE_BUCKETS.forEach((age) => ageCounts.set(age, 0));
  DAY_TAGS.forEach((tag) => dayCounts.set(tag, 0));

  slice.forEach((p) => {
    (p.ageRanges || []).forEach((age) => pushCount(ageCounts, age));
    (p.dayTimeTags || []).forEach((tag) => pushCount(dayCounts, tag));
    (p.activityTypes || []).forEach((activity) => pushCount(activityCounts, activity));
  });

  return {
    age: [...ageCounts.entries()].map(([name, count]) => ({ name, count })).sort(byCountThenName),
    dayTime: [...dayCounts.entries()].map(([name, count]) => ({ name, count })).sort(byCountThenName),
    activity: [...activityCounts.entries()].map(([name, count]) => ({ name, count })).sort(byCountThenName),
  };
}

function categoryPriority(category: ScarcityCategory) {
  const index = VISITOR_FILTER_PRIORITY.indexOf(category);
  return index === -1 ? VISITOR_FILTER_PRIORITY.length : index;
}

function boroughPriority(borough: string) {
  const index = BOROUGHS.indexOf(borough as (typeof BOROUGHS)[number]);
  return index === -1 ? BOROUGHS.length : index;
}

function neighborhoodPriority(borough: string, neighborhood: string) {
  const index = (NEIGHBORHOODS[borough] ?? []).indexOf(neighborhood);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function byVisitorContractPriority(a: ScarcityNeighborhoodRow, b: ScarcityNeighborhoodRow) {
  return (
    categoryPriority(a.category) - categoryPriority(b.category) ||
    boroughPriority(a.borough) - boroughPriority(b.borough) ||
    neighborhoodPriority(a.borough, a.neighborhood) - neighborhoodPriority(b.borough, b.neighborhood) ||
    a.neighborhood.localeCompare(b.neighborhood)
  );
}

function recommendationKey(row: ScarcityNeighborhoodRow) {
  return `${row.category}::${row.borough}::${row.neighborhood}`;
}

function toRecommendation(row: ScarcityNeighborhoodRow, providers: Provider[]): ScarcityRecommendation {
  const urgency = row.count === 0 ? "contractual-zero-filter" : "underrepresented";
  if (row.category === "Meet-Up Groups") {
    return {
      ...row,
      urgency,
      rationale:
        urgency === "contractual-zero-filter"
          ? "Required Visitor club/group filter has no approved content in this location, so discovery must run before normal maintenance."
          : "Meet-up groups remain one of the sparsest categories, so low-count locations are still a fast coverage gain.",
    };
  }
  return {
    ...row,
    urgency,
    rationale:
      urgency === "contractual-zero-filter"
        ? "Required Visitor category/location filter has no approved content, so discovery must run before normal maintenance."
        : "This slice is underrepresented at category, borough, and neighborhood level, with additional gaps in age/day-time/activity coverage.",
    details: collectSliceDetails(row.category, row.borough, row.neighborhood, providers),
  };
}

export function buildScarcityReport(
  providers: Provider[],
  meetups: MeetupGroup[],
  options: { generatedAt?: string } = {},
): ScarcityReport {
  const categories = buildCategoryRows(providers, meetups);
  const boroughRankings: Record<string, ScarcityCountRow[]> = {};
  const neighborhoodRankings: Record<string, ScarcityNeighborhoodRow[]> = {};

  categories.forEach(({ category }) => {
    boroughRankings[category] = collectBoroughRows(category, providers, meetups);
    neighborhoodRankings[category] = collectNeighborhoodRows(category, providers, meetups);
  });

  const zeroFilterRows = VISITOR_FILTER_PRIORITY.flatMap((category) => neighborhoodRankings[category] ?? [])
    .filter((row) => row.count === 0)
    .sort(byVisitorContractPriority);
  const normalScarcityRows = categories
    .flatMap(({ category }) => (neighborhoodRankings[category] ?? []).slice(0, 3))
    .filter((row) => row.count > 0)
    .sort((a, b) => a.count - b.count || byVisitorContractPriority(a, b));
  const seen = new Set<string>();
  const recommendedFocus = [...zeroFilterRows, ...normalScarcityRows]
    .filter((row) => {
      const key = recommendationKey(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5)
    .map((row) => toRecommendation(row, providers));

  return {
    generatedAt: options.generatedAt || new Date().toISOString(),
    providersCount: providers.length,
    meetupCount: meetups.length,
    categories,
    boroughRankings,
    neighborhoodRankings,
    recommendedFocus,
  };
}

export function renderScarcityMarkdown(data: ScarcityReport) {
  const lines: string[] = [];
  lines.push("# Compare Scarcity Report");
  lines.push("");
  lines.push(`Generated: ${data.generatedAt}`);
  lines.push(`Live rows: providers=${data.providersCount}, meetupGroups=${data.meetupCount}`);
  lines.push("");
  lines.push("## Category ranking");
  data.categories.forEach((row, idx) => lines.push(`${idx + 1}. ${row.category} — ${row.count}`));
  lines.push("");
  lines.push("## Recommended next focuses");
  data.recommendedFocus.forEach((focus, idx) => {
    lines.push(`${idx + 1}. ${focus.category} / ${focus.borough} / ${focus.neighborhood} — ${focus.count}`);
    lines.push(`   Rationale: ${focus.rationale}`);
    if (focus.details) {
      lines.push(`   Lowest ages in slice: ${focus.details.age.slice(0, 3).map((x) => `${x.name} (${x.count})`).join(", ")}`);
      lines.push(`   Lowest day-time tags in slice: ${focus.details.dayTime.slice(0, 3).map((x) => `${x.name} (${x.count})`).join(", ")}`);
      lines.push(
        `   Lowest activity types in slice: ${focus.details.activity.slice(0, 5).map((x) => `${x.name} (${x.count})`).join(", ") || "(none)"}`,
      );
    }
  });
  lines.push("");
  lines.push("## Borough ranking by category");
  for (const category of data.categories.map((x) => x.category)) {
    lines.push(`### ${category}`);
    data.boroughRankings[category].forEach((row) => lines.push(`- ${row.name}: ${row.count}`));
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}
