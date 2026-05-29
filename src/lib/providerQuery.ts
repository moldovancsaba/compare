import type { FilterState } from "@/components/scout/Filters";
import { discoveryFeatureFlags } from "@/lib/discoveryConfig";
import { deriveNextOccurrence, providerHasOccurrenceThisWeek, compareOccurrences } from "@/lib/providerSchedule";
import type { BoroughChoice, Category, Provider } from "@/types/provider";

export type DiscoverSort = "newest" | "oldest" | "relevance" | "upcoming";
export type DiscoverDateMode = "all" | "this-week";

export interface DiscoverQueryState {
  borough: BoroughChoice;
  neighborhood: string | null;
  filters: FilterState;
  q: string;
  sort: DiscoverSort;
  dateMode: DiscoverDateMode;
}

export interface QueryDiagnostics {
  mode: DiscoverDateMode;
  sort: DiscoverSort;
  queryLength: number;
  totalCandidates: number;
  resultCount: number;
  featuredCount: number;
}

export interface QueryProvidersResult {
  results: Provider[];
  featured: Provider[];
  diagnostics: QueryDiagnostics;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return Array.from(new Set(normalizeText(value).split(" ").filter((token) => token.length >= 2)));
}

function getProviderPublishedAt(provider: Provider) {
  return provider.publishedAt ?? new Date(0).toISOString();
}

function comparePublishedAt(left: Provider, right: Provider) {
  return getProviderPublishedAt(right).localeCompare(getProviderPublishedAt(left));
}

function scoreField(field: string, query: string, tokens: string[], weight: number) {
  if (!field) return 0;
  const normalized = normalizeText(field);
  let score = 0;
  if (normalized === query) score += weight * 8;
  if (query && normalized.includes(query)) score += weight * 4;
  for (const token of tokens) {
    if (normalized === token) score += weight * 3;
    else if (normalized.startsWith(token)) score += weight * 2.5;
    else if (normalized.split(" ").includes(token)) score += weight * 2;
    else if (normalized.includes(token)) score += weight;
  }
  return score;
}

function buildFieldList(provider: Provider) {
  return [
    { value: provider.name, weight: 14 },
    { value: provider.activityTypes.join(" "), weight: 10 },
    { value: provider.shortDescription, weight: 8 },
    { value: provider.longDescription, weight: 5 },
    { value: provider.announcementTitle ?? "", weight: 6 },
    { value: provider.announcementDescription ?? "", weight: 4 },
    { value: provider.recurringPrograms?.map((program) => `${program.title} ${program.summary ?? ""}`).join(" ") ?? "", weight: 7 },
    { value: provider.neighborhood, weight: 3 },
    { value: provider.borough, weight: 2 },
  ];
}

function scoreProvider(provider: Provider, query: string) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;
  const tokens = tokenize(normalizedQuery);
  return buildFieldList(provider).reduce((total, field) => total + scoreField(field.value, normalizedQuery, tokens, field.weight), 0);
}

function providerMatchesFilters(provider: Provider, filters: FilterState) {
  return (filters.ages.length ? provider.ageRanges.some((age) => filters.ages.includes(age)) : true)
    && (filters.times.length ? provider.dayTimeTags.some((time) => filters.times.includes(time)) : true)
    && (filters.activity ? provider.activityTypes.includes(filters.activity) : true);
}

function enrichProvider(provider: Provider, now: Date) {
  return {
    ...provider,
    nextOccurrence: provider.nextOccurrence ?? deriveNextOccurrence(provider, now),
  };
}

function compareByUpcoming(left: Provider, right: Provider) {
  if (left.nextOccurrence && right.nextOccurrence) {
    const occurrenceCmp = compareOccurrences(left.nextOccurrence, right.nextOccurrence);
    if (occurrenceCmp !== 0) return occurrenceCmp;
  } else if (left.nextOccurrence) {
    return -1;
  } else if (right.nextOccurrence) {
    return 1;
  }
  const freshnessCmp = comparePublishedAt(left, right);
  if (freshnessCmp !== 0) return freshnessCmp;
  return left.name.localeCompare(right.name);
}

function compareByRelevance(left: { provider: Provider; score: number }, right: { provider: Provider; score: number }) {
  if (right.score !== left.score) return right.score - left.score;
  const freshnessCmp = comparePublishedAt(left.provider, right.provider);
  if (freshnessCmp !== 0) return freshnessCmp;
  return left.provider.name.localeCompare(right.provider.name);
}

export function normalizeDiscoverSort(
  requestedSort: DiscoverSort | null | undefined,
  q: string,
  dateMode: DiscoverDateMode,
): DiscoverSort {
  if (requestedSort) return requestedSort;
  if (dateMode === "this-week") return "upcoming";
  if (q.trim()) return "relevance";
  return discoveryFeatureFlags.newestSortEnabled ? "newest" : "oldest";
}

export function queryProviders(
  providers: Provider[],
  category: Category | null,
  state: DiscoverQueryState,
  now = new Date(),
): QueryProvidersResult {
  const normalizedQuery = state.q.trim();
  const sort = normalizeDiscoverSort(state.sort, normalizedQuery, state.dateMode);
  const candidates = providers
    .map((provider) => enrichProvider(provider, now))
    .filter((provider) => (category ? provider.category === category : true))
    .filter((provider) => (state.borough === "All" ? true : provider.borough === state.borough))
    .filter((provider) => (state.neighborhood ? provider.neighborhood === state.neighborhood : true))
    .filter((provider) => providerMatchesFilters(provider, state.filters))
    .filter((provider) => (state.dateMode === "this-week" ? providerHasOccurrenceThisWeek(provider, now) : true));

  const ranked = normalizedQuery
    ? candidates
        .map((provider) => ({ provider, score: scoreProvider(provider, normalizedQuery) }))
        .filter((entry) => entry.score > 0)
    : candidates.map((provider) => ({ provider, score: 0 }));

  const sorted = (() => {
    if (sort === "relevance" && normalizedQuery) return ranked.sort(compareByRelevance).map((entry) => entry.provider);
    if (sort === "oldest") return ranked.map((entry) => entry.provider).sort((left, right) => comparePublishedAt(right, left));
    if (sort === "upcoming") return ranked.map((entry) => entry.provider).sort(compareByUpcoming);
    return ranked.map((entry) => entry.provider).sort(comparePublishedAt);
  })();

  const featured = state.dateMode === "all" && !normalizedQuery
    ? sorted.filter((provider) => provider.badges.includes("Featured") || provider.badges.includes("Staff Pick")).slice(0, 3)
    : [];

  return {
    results: sorted,
    featured,
    diagnostics: {
      mode: state.dateMode,
      sort,
      queryLength: normalizedQuery.length,
      totalCandidates: providers.length,
      resultCount: sorted.length,
      featuredCount: featured.length,
    },
  };
}
