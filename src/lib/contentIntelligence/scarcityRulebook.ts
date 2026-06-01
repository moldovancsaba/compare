import { readFile } from "node:fs/promises";
import path from "node:path";
import { NEIGHBORHOODS } from "@/data/locations";
import type { CatalogSnapshot } from "@/lib/catalogIntelligence";
import type { NormalizedListingInput } from "@/lib/contentIntelligence/rangeScoutAdapter";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

type ScarcityCategory = Provider["category"] | "Meet-Up Groups";

export interface ScarcityScoreBreakdown {
  zeroResultLift: number;
  ageGapLift: number;
  activityGapLift: number;
  geographyLift: number;
  dayTimeLift: number;
  providerDiversityLift: number;
  visualQualityLift: number;
  informationDensityLift: number;
  parentUsefulnessLift: number;
  total: number;
}

export interface ScarcityScoreResult {
  score: number;
  eligible: boolean;
  breakdown: ScarcityScoreBreakdown;
  blockingReasons: string[];
  rationale: string[];
  version: string;
}

type ZeroResultRow = {
  category: ScarcityCategory;
  borough: string;
  neighborhood: string;
  count: number;
  href?: string;
};

type ZeroResultMatrix = {
  generatedAt?: string;
  total?: number;
  rows: ZeroResultRow[];
};

const VERSION = "compare-range-scarcity-rulebook@v1";
const WEIGHTS = {
  zeroResultLift: 0.3,
  ageGapLift: 0.15,
  activityGapLift: 0.15,
  geographyLift: 0.12,
  dayTimeLift: 0.08,
  providerDiversityLift: 0.08,
  visualQualityLift: 0.05,
  informationDensityLift: 0.04,
  parentUsefulnessLift: 0.03,
} satisfies Record<keyof Omit<ScarcityScoreBreakdown, "total">, number>;

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function inferCategory(input: NormalizedListingInput): ScarcityCategory | null {
  const normalized = normalize(input.categoryHint);
  if (normalized === "classes") return "Classes";
  if (normalized === "camps") return "Camps";
  if (normalized === "birthday parties") return "Competitions";
  if (normalized === "drop-in activities") return "Drop-In Activities";
  if (input.listingKindHint === "meetupGroup") return "Meet-Up Groups";
  return null;
}

function inferDayTimeTags(input: NormalizedListingInput) {
  const tags = new Set<string>();
  for (const block of input.scheduleBlocks ?? []) {
    if (block.daysOfWeek.some((day) => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day))) {
      tags.add("Weekday");
    }
    if (block.daysOfWeek.some((day) => ["Saturday", "Sunday"].includes(day))) {
      tags.add("Weekend");
    }
    const text = `${block.startTime ?? ""} ${block.timeText ?? ""}`.toLowerCase();
    if (/\b(?:8|9|10|11)(?::\d{2})?\s*am\b/.test(text) || /\bmorning\b/.test(text)) tags.add("Morning");
    if (/\b(?:12|1|2|3|4)(?::\d{2})?\s*pm\b/.test(text) || /\bafternoon\b/.test(text)) tags.add("Afternoon");
    if (/\b(?:5|6|7|8)(?::\d{2})?\s*pm\b/.test(text) || /\bevening\b/.test(text)) tags.add("Evening");
    if (/\b(?:3|4|5)(?::\d{2})?\s*pm\b/.test(text) || /\bafter-school\b/.test(text)) tags.add("After-school");
  }
  return [...tags];
}

async function readZeroResultMatrix(): Promise<ZeroResultMatrix> {
  const filePath = path.join(process.cwd(), "docs", "reports", "zero-result-filters-latest.json");
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as ZeroResultMatrix;
    return {
      generatedAt: parsed.generatedAt,
      total: parsed.total,
      rows: Array.isArray(parsed.rows) ? parsed.rows : [],
    };
  } catch {
    return { rows: [] };
  }
}

function computeRarityScore(values: string[], counts: Record<string, number>) {
  if (values.length === 0) return 0;
  const maxCount = Math.max(0, ...Object.values(counts));
  if (maxCount <= 0) return 100;
  const average =
    values.reduce((sum, value) => {
      const count = counts[value] ?? 0;
      return sum + (1 - count / maxCount) * 100;
    }, 0) / values.length;
  return clamp(average);
}

function scoreGeography(category: ScarcityCategory, borough: string, neighborhood: string, snapshot: CatalogSnapshot) {
  const categoryRow = snapshot.scarcityReport.neighborhoodRankings[category]?.find(
    (row) => row.borough === borough && row.neighborhood === neighborhood,
  );
  const neighborhoodCount = categoryRow?.count ?? 0;
  const maxCategoryCount = Math.max(
    0,
    ...(snapshot.scarcityReport.neighborhoodRankings[category] ?? []).map((row) => row.count),
  );
  if (maxCategoryCount <= 0) return 100;
  return clamp((1 - neighborhoodCount / maxCategoryCount) * 100);
}

function scoreZeroResult(category: ScarcityCategory, borough: string, neighborhood: string, zeroMatrix: ZeroResultMatrix) {
  const hit = zeroMatrix.rows.find(
    (row) => row.category === category && row.borough === borough && row.neighborhood === neighborhood && row.count === 0,
  );
  return hit ? 100 : 0;
}

function scoreProviderDiversity(input: NormalizedListingInput, providers: Provider[], meetups: MeetupGroup[]) {
  const normalizedTitle = normalize(input.title);
  const allNames = [...providers.map((provider) => normalize(provider.name)), ...meetups.map((meetup) => normalize(meetup.name))];
  const sameName = allNames.filter((name) => name === normalizedTitle).length;
  if (sameName > 0) return 0;

  const website = normalize(input.contactFacts?.website);
  if (website) {
    const duplicateWebsite = [
      ...providers.map((provider) => normalize(provider.website)),
      ...meetups.map((meetup) => normalize(meetup.website)),
    ].includes(website);
    if (duplicateWebsite) return 15;
  }

  return 100;
}

function scoreVisualQuality(input: NormalizedListingInput) {
  const uploaded = (input.imageCandidates ?? []).some((candidate) => Boolean(candidate.uploadedUrl));
  if (uploaded) return 100;
  return (input.imageCandidates?.length ?? 0) > 0 ? 45 : 0;
}

function scoreInformationDensity(input: NormalizedListingInput) {
  let points = 0;
  if (input.descriptionFacts?.length) points += 20;
  if (input.ageRangesRaw?.length) points += 15;
  if (input.activityTypesRaw?.length) points += 15;
  if (input.scheduleBlocks?.length) points += 20;
  if (input.addressRaw) points += 10;
  if (input.contactFacts?.website) points += 10;
  if (input.contactFacts?.email || input.contactFacts?.phone) points += 10;
  return clamp(points);
}

function scoreParentUsefulness(input: NormalizedListingInput) {
  let points = 0;
  if (input.descriptionFacts?.length) points += 25;
  if (input.scheduleBlocks?.length) points += 25;
  if (input.ageRangesRaw?.length) points += 20;
  if (input.addressRaw || input.neighborhoodRaw) points += 15;
  if (input.contactFacts?.website) points += 15;
  return clamp(points);
}

export async function scoreRangeScoutCandidate(input: {
  normalizedListing: NormalizedListingInput;
  providers: Provider[];
  meetups: MeetupGroup[];
  snapshot?: CatalogSnapshot | null;
}) : Promise<ScarcityScoreResult> {
  const category = inferCategory(input.normalizedListing);
  const borough = input.normalizedListing.boroughRaw?.trim() ?? "";
  const neighborhood = input.normalizedListing.neighborhoodRaw?.trim() ?? "";
  const blockingReasons: string[] = [];
  const rationale: string[] = [];

  if (!category) blockingReasons.push("unsupported_or_missing_category");
  if (!borough) blockingReasons.push("missing_borough");
  if (!neighborhood) blockingReasons.push("missing_neighborhood");

  const zeroMatrix = await readZeroResultMatrix();
  const snapshot =
    input.snapshot ??
    ({
      scarcityReport: {
        categories: [],
        boroughRankings: {},
        neighborhoodRankings: {},
        recommendedFocus: [],
        generatedAt: new Date().toISOString(),
        providersCount: input.providers.length,
        meetupCount: input.meetups.length,
      },
      ageRangeBreakdown: {},
      activityTypeBreakdown: {},
      timeTagBreakdown: {},
    } as CatalogSnapshot);

  const inferredTags = inferDayTimeTags(input.normalizedListing);
  const zeroResultLift = category ? scoreZeroResult(category, borough, neighborhood, zeroMatrix) : 0;
  const ageGapLift = computeRarityScore(input.normalizedListing.ageRangesRaw ?? [], snapshot.ageRangeBreakdown ?? {});
  const activityGapLift = computeRarityScore(input.normalizedListing.activityTypesRaw ?? [], snapshot.activityTypeBreakdown ?? {});
  const geographyLift = category ? scoreGeography(category, borough, neighborhood, snapshot) : 0;
  const dayTimeLift = computeRarityScore(inferredTags, snapshot.timeTagBreakdown ?? {});
  const providerDiversityLift = scoreProviderDiversity(input.normalizedListing, input.providers, input.meetups);
  const visualQualityLift = scoreVisualQuality(input.normalizedListing);
  const informationDensityLift = scoreInformationDensity(input.normalizedListing);
  const parentUsefulnessLift = scoreParentUsefulness(input.normalizedListing);

  const total = clamp(
    zeroResultLift * WEIGHTS.zeroResultLift +
      ageGapLift * WEIGHTS.ageGapLift +
      activityGapLift * WEIGHTS.activityGapLift +
      geographyLift * WEIGHTS.geographyLift +
      dayTimeLift * WEIGHTS.dayTimeLift +
      providerDiversityLift * WEIGHTS.providerDiversityLift +
      visualQualityLift * WEIGHTS.visualQualityLift +
      informationDensityLift * WEIGHTS.informationDensityLift +
      parentUsefulnessLift * WEIGHTS.parentUsefulnessLift,
  );

  if (zeroResultLift > 0) rationale.push(`Directly fills a zero-result slice for ${category} in ${borough} / ${neighborhood}.`);
  if (ageGapLift >= 70 && (input.normalizedListing.ageRangesRaw?.length ?? 0) > 0) rationale.push("Improves underrepresented age coverage.");
  if (activityGapLift >= 70 && (input.normalizedListing.activityTypesRaw?.length ?? 0) > 0) rationale.push("Improves underrepresented activity coverage.");
  if (geographyLift >= 70) rationale.push("Improves low-coverage neighborhood representation.");
  if (dayTimeLift >= 70 && inferredTags.length > 0) rationale.push("Improves weak day/time availability coverage.");
  if (providerDiversityLift >= 80) rationale.push("Adds provider diversity instead of reinforcing a dominant operator.");
  if (visualQualityLift < 50) blockingReasons.push("weak_or_missing_image_signal");
  if (informationDensityLift < 45) blockingReasons.push("thin_information_density");
  if (parentUsefulnessLift < 45) blockingReasons.push("low_parent_usefulness");

  const eligible = blockingReasons.length === 0 && total >= 70;
  if (!eligible && total < 70) {
    blockingReasons.push("scarcity_score_below_threshold");
  }

  return {
    score: Math.round(total),
    eligible,
    breakdown: {
      zeroResultLift: Math.round(zeroResultLift),
      ageGapLift: Math.round(ageGapLift),
      activityGapLift: Math.round(activityGapLift),
      geographyLift: Math.round(geographyLift),
      dayTimeLift: Math.round(dayTimeLift),
      providerDiversityLift: Math.round(providerDiversityLift),
      visualQualityLift: Math.round(visualQualityLift),
      informationDensityLift: Math.round(informationDensityLift),
      parentUsefulnessLift: Math.round(parentUsefulnessLift),
      total: Math.round(total),
    },
    blockingReasons: [...new Set(blockingReasons)],
    rationale,
    version: VERSION,
  };
}

export function listCanonicalNeighborhoods() {
  return Object.entries(NEIGHBORHOODS).flatMap(([borough, neighborhoods]) =>
    neighborhoods.map((neighborhood) => ({ borough, neighborhood })),
  );
}
