import { analyzeWatchSecondaryMarket } from "@/lib/domains/watch-secondary-market";
import { formatUsd } from "@/lib/utils/format";
import type { EvidenceItem } from "@/types/comparison";
import type { WatchSpec } from "@/types/watch";

export function displayName(watch: WatchSpec): string {
  return `${watch.brand} ${watch.model}`;
}

export function catalogEvidence(watch: WatchSpec, id: string, detail: string): EvidenceItem {
  return {
    id: `${watch.id}:${id}`,
    kind: "catalog_fact",
    confidence: "high",
    label: `${displayName(watch)} catalog facts`,
    detail,
    source: {
      label: `${displayName(watch)} canonical product reference`,
      url: watch.productUrl
    },
    freshness: "unknown",
    appliesTo: [watch.id]
  };
}

export function derivedRuleEvidence(id: string, label: string, detail: string, watches: WatchSpec[]): EvidenceItem {
  return {
    id,
    kind: "derived_rule",
    confidence: "medium",
    label,
    detail,
    freshness: "current",
    appliesTo: watches.map((watch) => watch.id)
  };
}

export function editorialEvidence(id: string, label: string, detail: string, watches: WatchSpec[]): EvidenceItem {
  return {
    id,
    kind: "editorial_inference",
    confidence: "medium",
    label,
    detail,
    freshness: "current",
    appliesTo: watches.map((watch) => watch.id)
  };
}

export function missingDataEvidence(id: string, label: string, detail: string, watches: WatchSpec[]): EvidenceItem {
  return {
    id,
    kind: "missing_data",
    confidence: "low",
    label,
    detail,
    freshness: "unknown",
    appliesTo: watches.map((watch) => watch.id)
  };
}

export function ownershipProfileEvidence(watch: WatchSpec): EvidenceItem {
  if (!watch.ownershipProfile) {
    return missingDataEvidence(
      `${watch.id}:missing-ownership-profile`,
      "Missing structured ownership profile",
      "This watch has qualitative ownership notes but is missing structured ownership profile metadata.",
      [watch]
    );
  }

  return catalogEvidence(
    watch,
    "structured-ownership-profile",
    "Structured ownership profile covers comfort, service burden, durability, reliability, resale, bracelet quality, and strap versatility."
  );
}

export function marketPositioningEvidence(watch: WatchSpec): EvidenceItem {
  if (!watch.marketPositioning) {
    return missingDataEvidence(
      `${watch.id}:missing-market-positioning`,
      "Missing structured market-positioning profile",
      "This watch is missing model-level hype, collector respect, saturation, brand cachet, and substance/caution signals.",
      [watch]
    );
  }

  return catalogEvidence(
    watch,
    "structured-market-positioning",
    "Structured market-positioning profile covers hype level, collector respect, saturation, brand cachet, substance signals, and caution signals."
  );
}

export function secondaryMarketEvidence(watch: WatchSpec): EvidenceItem {
  if (!watch.secondaryMarket) {
    return missingDataEvidence(
      `${watch.id}:missing-secondary-market`,
      "Missing secondary-market snapshot",
      "This watch is missing a manually curated dated secondary-market snapshot.",
      [watch]
    );
  }

  return {
    id: `${watch.id}:secondary-market-snapshot`,
    kind: "external_source",
    confidence: watch.secondaryMarket.confidence,
    label: `${displayName(watch)} secondary-market snapshot`,
    detail: `Estimated market price is ${formatUsd(watch.secondaryMarket.estimatedMarketPriceUsd)} as of ${watch.secondaryMarket.marketPriceDate}.`,
    source: {
      label: watch.secondaryMarket.sourceLabel,
      url: watch.secondaryMarket.sourceUrl,
      accessedAt: watch.secondaryMarket.marketPriceDate
    },
    freshness: analyzeWatchSecondaryMarket(watch).freshness,
    appliesTo: [watch.id]
  };
}
