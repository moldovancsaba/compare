import type { WatchSpec } from "@/types/watch";
import type { WatchMarketPositioningAnalysis, WatchMarketingRealityAnalysis } from "@/types/watch-market";

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

function supportedMarketingClaims(watch: WatchSpec): string[] {
  const market = watch.marketPositioning;

  if (!market) {
    return [];
  }

  return watch.marketingClaims.filter((claim) => {
    const normalizedClaim = claim.toLowerCase();

    return market.substanceSignals.some((signal) => {
      const normalizedSignal = signal.toLowerCase();
      return normalizedClaim.split(/\W+/).some((token) => token.length > 4 && normalizedSignal.includes(token));
    });
  });
}

function capabilityGap(watch: WatchSpec): string {
  const practicalSignals: string[] = [];
  const inflatedSignals: string[] = [];

  if (watch.microAdjust) {
    practicalSignals.push("bracelet adjustment");
  } else {
    inflatedSignals.push("bracelet story");
  }

  if (watch.antiMagneticGauss && watch.antiMagneticGauss >= 15000) {
    practicalSignals.push("anti-magnetism");
  }

  if (watch.caseThicknessMm <= 11.8 && watch.lugToLugMm <= 46) {
    practicalSignals.push("wearable proportions");
  }

  if (watch.waterResistanceM >= 200) {
    practicalSignals.push("real water-resistance headroom");
  } else if (watch.style === "dive") {
    inflatedSignals.push("dive-watch theater");
  }

  if (!practicalSignals.length) {
    return `${watch.brand} ${watch.model} has no obvious headline spec that should override fit, price, or service friction.`;
  }

  const caveat = inflatedSignals.length ? ` The softer claim is ${inflatedSignals.join(", ")}.` : "";
  return `${watch.brand} ${watch.model} has practical support from ${labelList(practicalSignals)}.${caveat}`;
}

export function analyzeWatchMarketingReality(watch: WatchSpec): WatchMarketingRealityAnalysis {
  const market = watch.marketPositioning;

  if (!market) {
    return {
      confidence: "low",
      mythCheck:
        "Structured positioning data is missing, so {compare} will not turn brand reputation or heritage copy into a marketing-reality claim.",
      specInflationCheck: capabilityGap(watch),
      realitySummary: watch.ownership.marketingReality,
      buyerCaution: "Treat the catalog notes as low-confidence editorial guidance until model-level positioning is curated.",
      supportedClaims: [],
      warnings: ["Structured market-positioning profile is missing for this watch."]
    };
  }

  const supportedClaims = supportedMarketingClaims(watch);
  const hypePressure =
    market.hypeLevel === "high"
      ? "high hype pressure means the story can outrun the ownership benefit"
      : market.hypeLevel === "moderate"
        ? "moderate narrative pressure means the story needs a practical reason"
        : "low hype pressure makes this less exposed to fashion-cycle disappointment";
  const saturationPressure =
    market.marketSaturation === "high"
      ? "market saturation also makes scarcity-coded language weaker"
      : market.marketSaturation === "moderate"
        ? "visible supply means patience matters more than urgency"
        : "lower saturation supports niche appeal without proving investment upside";
  const supportedCopy = supportedClaims.length
    ? `Supported claims: ${supportedClaims.join(", ")}.`
    : "No marketing claim is strong enough to raise confidence by itself.";

  return {
    confidence: "medium",
    mythCheck: `${watch.ownership.marketingReality} ${hypePressure}; ${saturationPressure}.`,
    specInflationCheck: capabilityGap(watch),
    realitySummary: `${supportedCopy} Substance signals are ${labelList(market.substanceSignals)}; caution signals are ${labelList(market.cautionSignals)}.`,
    buyerCaution: `Do not pay extra for ${watch.marketingClaims.join(", ") || "the brand story"} unless it maps to comfort, fit, reliability, liquidity, or emotional fit you will still value after the honeymoon.`,
    supportedClaims,
    warnings: []
  };
}
