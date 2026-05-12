import { watchCatalog } from "@/lib/data/watch-catalog";
import type { WatchSpec } from "@/types/watch";

interface RankedWatch {
  watch: WatchSpec;
  score: number;
}

export type WatchResolution =
  | {
      status: "resolved";
      watch: WatchSpec;
    }
  | {
      status: "unresolved";
      reason: "no_match" | "ambiguous";
      suggestions: WatchSpec[];
    };

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

function editDistance(left: string, right: string): number {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);

  for (let column = 1; column <= right.length; column += 1) {
    rows[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + cost
      );
    }
  }

  return rows[left.length][right.length];
}

function isTypoMatch(inputToken: string, targetToken: string): boolean {
  if (inputToken === targetToken) {
    return true;
  }

  if (inputToken.length < 4 || targetToken.length < 4) {
    return false;
  }

  return editDistance(inputToken, targetToken) <= 1;
}

function countMatchedTokens(inputTokens: Set<string>, targetTokens: string[], typoTolerance = false): number {
  return targetTokens.filter((targetToken) =>
    typoTolerance
      ? Array.from(inputTokens).some((inputToken) => isTypoMatch(inputToken, targetToken))
      : inputTokens.has(targetToken)
  ).length;
}

function hasEveryFuzzyToken(source: Set<string>, terms: string[]): boolean {
  return terms.every((term) => Array.from(source).some((token) => isTypoMatch(token, term)));
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
  } else if (aliasTokenSets.some((tokens) => hasEveryFuzzyToken(inputTokens, tokens))) {
    score += 24;
  }

  if (hasEveryToken(inputTokens, brandTokens)) {
    score += 8;
  } else if (hasEveryFuzzyToken(inputTokens, brandTokens)) {
    score += 6;
  }

  const matchedModelTokens = countMatchedTokens(inputTokens, modelTokens, true);
  if (matchedModelTokens === modelTokens.length) {
    score += 24;
  } else if (matchedModelTokens > 0) {
    score += matchedModelTokens * 4;
  }

  const matchedSlugTokens = countMatchedTokens(inputTokens, slugTokens);
  score += matchedSlugTokens * 2;

  const matchedUrlTokens = countMatchedTokens(inputTokens, productUrlTokens);
  score += matchedUrlTokens;

  if (hasEveryInputToken(inputTokens, [...brandTokens, ...modelTokens, ...referenceTokens, ...slugTokens, ...productUrlTokens])) {
    score += 6;
  }

  return score;
}

function rankedWatches(input: string): RankedWatch[] {
  return watchCatalog
    .map((watch) => ({
      watch,
      score: scoreWatch(input, watch)
    }))
    .sort((left, right) => right.score - left.score);
}

export function resolveWatchDetailed(input: string): WatchResolution {
  const ranked = rankedWatches(input);
  const [best, secondBest] = ranked;

  if (!best || best.score < 20) {
    return {
      status: "unresolved",
      reason: "no_match",
      suggestions: ranked.filter((candidate) => candidate.score > 0).slice(0, 4).map((candidate) => candidate.watch)
    };
  }

  const closeCandidates = ranked.filter((candidate) => candidate.score >= Math.max(20, best.score - 4));

  if ((secondBest && best.score === secondBest.score) || closeCandidates.length > 1) {
    return {
      status: "unresolved",
      reason: "ambiguous",
      suggestions: closeCandidates.slice(0, 4).map((candidate) => candidate.watch)
    };
  }

  return {
    status: "resolved",
    watch: best.watch
  };
}

export function resolveWatch(input: string): WatchSpec | null {
  const resolution = resolveWatchDetailed(input);

  return resolution.status === "resolved" ? resolution.watch : null;
}
