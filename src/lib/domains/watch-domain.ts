import { watchCatalog } from "@/lib/data/watch-catalog";
import { toWatchComparisonEntity, watchDisplayName } from "@/lib/domains/watch-entity";
import { compareWatches } from "@/lib/services/compare-watches";
import { resolveWatch } from "@/lib/utils/resolve-watch";
import type { ComparisonDomainAdapter } from "@/types/comparison";
import type { WatchComparisonEntity } from "@/types/watch";

export const watchDomainAdapter: ComparisonDomainAdapter<WatchComparisonEntity> = {
  domain: "watches",
  label: "Mechanical watches",
  examples: watchCatalog.map(watchDisplayName),
  resolve(input) {
    const watch = resolveWatch(input);

    if (!watch) {
      return {
        status: "unresolved",
        reason: "No supported watch matched this input.",
        suggestions: watchCatalog.slice(0, 6).map(watchDisplayName)
      };
    }

    return {
      status: "resolved",
      entity: toWatchComparisonEntity(watch)
    };
  },
  compare(left, right) {
    const leftWatch = watchCatalog.find((watch) => watch.id === left.watchId);
    const rightWatch = watchCatalog.find((watch) => watch.id === right.watchId);

    if (!leftWatch || !rightWatch) {
      throw new Error("Resolved watch entity is missing from the catalog.");
    }

    return compareWatches(leftWatch, rightWatch);
  }
};
