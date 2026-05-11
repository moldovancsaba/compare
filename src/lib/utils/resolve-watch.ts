import { watchCatalog } from "@/lib/data/watch-catalog";
import type { WatchSpec } from "@/types/watch";

interface RankedWatch {
  watch: WatchSpec;
  score: number;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, " ")
    .replace(/www\./g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalize(value).split(" ").filter(Boolean);
}

function buildSearchTerms(watch: WatchSpec): string[] {
  return [
    watch.brand,
    watch.model,
    watch.reference,
    watch.slug,
    watch.productUrl,
    `${watch.brand} ${watch.model}`,
    `${watch.brand} ${watch.model} ${watch.reference}`,
    ...watch.aliases
  ].map(normalize);
}

function hasEveryToken(source: Set<string>, terms: string[]): boolean {
  return terms.every((term) => source.has(term));
}

function hasEveryInputToken(inputTokens: Set<string>, terms: string[]): boolean {
  return Array.from(inputTokens).every((token) => terms.includes(token));
}

function scoreWatch(input: string, watch: WatchSpec): number {
  const normalizedInput = normalize(input);
  const inputTokens = new Set(tokenize(input));
  const searchTerms = buildSearchTerms(watch);

  if (!normalizedInput || inputTokens.size === 0) {
    return 0;
  }

  if (searchTerms.includes(normalizedInput)) {
    return 100 + inputTokens.size;
  }

  const brandTokens = tokenize(watch.brand);
  const modelTokens = tokenize(watch.model);
  const referenceTokens = tokenize(watch.reference);
  const slugTokens = tokenize(watch.slug);
  const productUrlTokens = tokenize(watch.productUrl);
  const aliasTokenSets = watch.aliases.map(tokenize);

  let score = 0;

  if (hasEveryToken(inputTokens, referenceTokens)) {
    score += 35;
  }

  if (aliasTokenSets.some((tokens) => hasEveryToken(inputTokens, tokens))) {
    score += 30;
  }

  if (hasEveryToken(inputTokens, brandTokens)) {
    score += 8;
  }

  const matchedModelTokens = modelTokens.filter((token) => inputTokens.has(token)).length;
  if (matchedModelTokens === modelTokens.length) {
    score += 24;
  } else if (matchedModelTokens > 0) {
    score += matchedModelTokens * 4;
  }

  const matchedSlugTokens = slugTokens.filter((token) => inputTokens.has(token)).length;
  score += matchedSlugTokens * 2;

  const matchedUrlTokens = productUrlTokens.filter((token) => inputTokens.has(token)).length;
  score += matchedUrlTokens;

  if (hasEveryInputToken(inputTokens, [...brandTokens, ...modelTokens, ...referenceTokens, ...slugTokens, ...productUrlTokens])) {
    score += 6;
  }

  return score;
}

export function resolveWatch(input: string): WatchSpec | null {
  const ranked: RankedWatch[] = watchCatalog
    .map((watch) => ({
      watch,
      score: scoreWatch(input, watch)
    }))
    .sort((left, right) => right.score - left.score);

  const [best, secondBest] = ranked;

  if (!best || best.score < 20) {
    return null;
  }

  if (secondBest && best.score === secondBest.score) {
    return null;
  }

  return best.watch;
}
