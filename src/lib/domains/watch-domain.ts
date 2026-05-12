import { watchCatalog } from "@/lib/data/watch-catalog";
import { toWatchComparisonEntity, watchDisplayName } from "@/lib/domains/watch-entity";
import { compareWatches } from "@/lib/services/compare-watches";
import { resolveWatch } from "@/lib/utils/resolve-watch";
import type { ComparisonDomainAdapter } from "@/types/comparison";
import type { WatchComparisonEntity } from "@/types/watch";

export const watchDomainAdapter: ComparisonDomainAdapter<WatchComparisonEntity> = {
  domain: "watches",
  label: "Mechanical watches",
  description: "Curated mechanical watch comparisons with ownership, wearability, and tradeoff reasoning.",
  examples: watchCatalog.map(watchDisplayName),
  inputHints: {
    leftLabel: "First watch",
    rightLabel: "Second watch",
    placeholder: "Rolex Air-King or a supported source URL",
    helperText: "This adapter supports curated mechanical watch names, references, aliases, and matching source URLs."
  },
  dataPolicy: {
    summary:
      "The watch adapter uses a curated fixture catalog plus deterministic ownership rules. Live market data is intentionally absent until freshness and source verification are automated.",
    sourceTiers: [
      {
        tier: "curated_fixture",
        description: "Structured watch specs, aliases, retail prices, and ownership notes maintained in the adapter catalog.",
        defaultConfidence: "medium"
      },
      {
        tier: "official_source",
        description: "Canonical product URLs attached to catalog entities when available.",
        defaultConfidence: "high"
      },
      {
        tier: "expert_rule",
        description: "Deterministic rules that convert specifications into wearability, ownership, and value consequences.",
        defaultConfidence: "medium"
      }
    ],
    freshness: {
      cadence: "Review curated fixtures before expanding the catalog or changing recommendation rules.",
      staleAfterDays: 180
    },
    curationRules: [
      "Do not present retail price, service, or market claims as live evidence unless they have a verified source timestamp.",
      "Keep subjective ownership notes deterministic and label them as editorial inference in evidence metadata.",
      "Resolver aliases must stay conservative enough to avoid selecting ambiguous watch families."
    ],
    blockedSourceTypes: [
      "uncited AI-generated reviews",
      "affiliate-only ranking pages",
      "single forum anecdotes treated as facts",
      "live marketplace prices without capture timestamp"
    ],
    missingDataPolicy:
      "Missing live pricing, service quotes, owner telemetry, or freshness timestamps must appear as low-confidence missing-data evidence and result limitations."
  },
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
