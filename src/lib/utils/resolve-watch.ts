import { watchCatalog } from "@/lib/data/watch-catalog";
import type { WatchSpec } from "@/types/watch";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, " ")
    .replace(/www\./g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreWatch(input: string, watch: WatchSpec): number {
  const haystacks = [watch.brand, watch.model, watch.reference, watch.slug, watch.productUrl, ...watch.aliases]
    .map(normalize)
    .join(" ");
  const tokens = normalize(input).split(" ").filter(Boolean);

  return tokens.reduce((score, token) => {
    if (haystacks.includes(token)) {
      return score + 2;
    }

    return score;
  }, 0);
}

export function resolveWatch(input: string): WatchSpec | null {
  const ranked = watchCatalog
    .map((watch) => ({
      watch,
      score: scoreWatch(input, watch)
    }))
    .sort((left, right) => right.score - left.score);

  const [best] = ranked;

  if (!best || best.score < 2) {
    return null;
  }

  return best.watch;
}
