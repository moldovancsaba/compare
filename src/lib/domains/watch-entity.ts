import type { WatchComparisonEntity, WatchSpec } from "@/types/watch";

export function watchDisplayName(watch: WatchSpec): string {
  return `${watch.brand} ${watch.model}`;
}

export function toWatchComparisonEntity(watch: WatchSpec): WatchComparisonEntity {
  return {
    id: watch.id,
    domain: "watches",
    watchId: watch.id,
    label: watchDisplayName(watch),
    slug: watch.slug,
    aliases: watch.aliases,
    sourceUrl: watch.productUrl,
    attributes: {
      brand: watch.brand,
      model: watch.model,
      reference: watch.reference,
      priceUsd: watch.msrpUsd,
      style: watch.style,
      waterResistanceM: watch.waterResistanceM
    }
  };
}
