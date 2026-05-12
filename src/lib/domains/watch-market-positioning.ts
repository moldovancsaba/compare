import type { WatchSpec } from "@/types/watch";
import type { WatchMarketPositioningAnalysis } from "@/types/watch-market";

function labelList(items: string[]): string {
  return items.length ? items.join(", ") : "no structured signals";
}

function liquidityFor(watch: WatchSpec): string {
  const resale = watch.ownershipProfile?.resaleStability ?? "soft";
  const market = watch.marketPositioning;

  if (!market) {
    return "Liquidity context is low confidence because this catalog row has no structured market-positioning profile.";
  }

  if (resale === "strong") {
    return `${watch.brand} ${watch.model} has strong exit liquidity in this catalog because resale stability is strong and brand cachet is ${market.brandCachet}.`;
  }

  if (resale === "stable") {
    return `${watch.brand} ${watch.model} has stable but not automatic liquidity; ${market.marketSaturation} saturation means buyer depth still depends on condition, price, and configuration.`;
  }

  return `${watch.brand} ${watch.model} has softer exit liquidity, so the market-positioning upside should be treated as taste support rather than downside protection.`;
}

export function analyzeWatchMarketPositioning(watch: WatchSpec): WatchMarketPositioningAnalysis {
  const market = watch.marketPositioning;

  if (!market) {
    return {
      confidence: "low",
      hypeVsSubstance:
        "Structured market-positioning data is missing, so {compare} will not infer hype, collector reputation, or liquidity from brand stereotypes.",
      collectorReputation: "Collector reputation is unknown without a curated model-level profile.",
      liquidityContext: liquidityFor(watch),
      positioningSummary: "Market positioning unavailable.",
      warnings: ["Structured market-positioning profile is missing for this watch."]
    };
  }

  const hypeCopy =
    market.hypeLevel === "high"
      ? "high narrative heat"
      : market.hypeLevel === "moderate"
        ? "moderate enthusiasm"
        : "low hype pressure";
  const saturationCopy =
    market.marketSaturation === "high"
      ? "broad market visibility can make the watch feel less special"
      : market.marketSaturation === "moderate"
        ? "enough supply exists that patience matters"
        : "lower saturation keeps the positioning more niche";

  return {
    confidence: "medium",
    hypeVsSubstance: `${watch.brand} ${watch.model} carries ${hypeCopy}. The substance case is ${labelList(market.substanceSignals)}; the caution case is ${labelList(market.cautionSignals)}.`,
    collectorReputation: `Collector respect is ${market.collectorRespect}, while brand cachet is ${market.brandCachet}. This is a model-level read, not a blanket claim about ${watch.brand}.`,
    liquidityContext: `${liquidityFor(watch)} ${saturationCopy}.`,
    positioningSummary: market.positioningSummary,
    warnings: []
  };
}
