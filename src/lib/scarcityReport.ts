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

  const recommendedFocus = categories
    .slice(0, 3)
    .flatMap(({ category }) =>
      neighborhoodRankings[category].slice(0, 3).map((row) => {
        if (category === "Meet-Up Groups") {
          return {
            ...row,
            rationale:
              "Meet-up groups remain one of the sparsest categories, so zero-count neighborhoods are still the fastest coverage gain.",
          };
        }
        return {
          ...row,
          rationale:
            "This slice is underrepresented at category, borough, and neighborhood level, with additional gaps in age/day-time/activity coverage.",
          details: collectSliceDetails(category, row.borough, row.neighborhood, providers),
        };
      }),
    )
    .slice(0, 5);

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
  lines.push("# RangeScout Scarcity Report");
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
