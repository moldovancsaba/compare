import { watchCatalog } from "@/lib/data/watch-catalog";
import { formatHours, formatMm, formatUsd } from "@/lib/utils/format";
import type { BuyerRecommendation, ComparisonResult, InsightBlock, WatchSpec } from "@/types/watch";

function displayName(watch: WatchSpec): string {
  return `${watch.brand} ${watch.model}`;
}

function pickStyleMeaning(style: WatchSpec["style"]): string {
  switch (style) {
    case "field":
      return "leans more casual and instrument-like";
    case "explorer":
      return "wears like a one-watch minimalist sports piece";
    case "dive":
      return "reads as a sport watch first, even with formal clothes";
    case "dress-sport":
      return "bridges office and weekend better than a pure tool watch";
  }
}

function buildKeyDifferences(left: WatchSpec, right: WatchSpec): InsightBlock[] {
  const priceGap = Math.abs(left.msrpUsd - right.msrpUsd);
  const larger = left.caseDiameterMm >= right.caseDiameterMm ? left : right;
  const thinner = left.caseThicknessMm <= right.caseThicknessMm ? left : right;
  const moreWater = left.waterResistanceM >= right.waterResistanceM ? left : right;
  const longerReserve = left.powerReserveHours >= right.powerReserveHours ? left : right;

  return [
    {
      title: "Wrist presence",
      summary: `${displayName(larger)} is larger on paper at ${formatMm(larger.caseDiameterMm)} with a ${formatMm(larger.lugToLugMm)} span. ${displayName(thinner)} is the slimmer-feeling watch because its thickness stays at ${formatMm(thinner.caseThicknessMm)}.`
    },
    {
      title: "Use-case bias",
      summary: `${displayName(left)} ${pickStyleMeaning(left.style)}, while ${displayName(right)} ${pickStyleMeaning(right.style)}.`
    },
    {
      title: "Capability gap",
      summary: `${displayName(moreWater)} offers the stronger hard-use spec headline with ${moreWater.waterResistanceM}m water resistance. ${displayName(longerReserve)} also wins the practical no-wear window with a ${formatHours(longerReserve.powerReserveHours)} power reserve.`
    },
    {
      title: "Price delta",
      summary: `The retail spread is ${formatUsd(priceGap)}. That matters because enthusiast buyers usually feel price increases most when the extra spend mostly buys finishing, branding, or dial character rather than comfort or capability.`
    }
  ];
}

function buildRealWorldImpact(left: WatchSpec, right: WatchSpec): InsightBlock[] {
  const thicknessWinner = left.caseThicknessMm < right.caseThicknessMm ? left : right;
  const lighterFeel = left.weightFeel === "light" ? left : right.weightFeel === "light" ? right : null;
  const microAdjustWinner = left.microAdjust && !right.microAdjust ? left : right.microAdjust && !left.microAdjust ? right : null;

  return [
    {
      title: "All-day comfort",
      summary: `${displayName(thicknessWinner)} will disappear faster during desk work and travel because it is thinner. If you care about sleeve clearance or hate top-heavy watches, that small paper gap is usually noticeable in a week of ownership.`
    },
    {
      title: "Temperature and swelling",
      summary: microAdjustWinner
        ? `${displayName(microAdjustWinner)} is the easier daily wear because on-the-fly micro-adjust helps when your wrist swells in heat or after exercise. The alternative will feel more exacting about fit.`
        : "Neither watch creates a major bracelet usability advantage, so fit quality will depend more on sizing and strap preference than the clasp spec."
    },
    {
      title: "Perceived heft",
      summary: lighterFeel
        ? `${displayName(lighterFeel)} gives the more effortless feel on wrist. That matters if you want a watch you stop noticing rather than a watch that constantly reminds you it is there.`
        : "Both watches land in the balanced range, so the difference is more about shape and bracelet articulation than raw mass."
    }
  ];
}

function buildBuyerRecommendations(left: WatchSpec, right: WatchSpec): BuyerRecommendation[] {
  return [
    {
      buyerType: "One-watch owner",
      pick: left.style === "dress-sport" || left.style === "explorer" ? displayName(left) : displayName(right),
      reason: "Pick the cleaner, more versatile watch if it needs to move between office, travel, and casual wear without explanation."
    },
    {
      buyerType: "Tool-watch enthusiast",
      pick: left.waterResistanceM >= right.waterResistanceM && left.microAdjust ? displayName(left) : displayName(right),
      reason: "The better tool-watch choice is the one that pairs stronger water resistance with easier bracelet adjustment and a less precious finish."
    },
    {
      buyerType: "Value-focused collector",
      pick: left.msrpUsd <= right.msrpUsd ? displayName(left) : displayName(right),
      reason: "If both scratch the same emotional itch, the lower-priced option usually leaves less regret and more room for a second watch later."
    }
  ];
}

function buildOverpricedFeatures(left: WatchSpec, right: WatchSpec): InsightBlock[] {
  const pricier = left.msrpUsd >= right.msrpUsd ? left : right;
  const cheaper = pricier.id === left.id ? right : left;
  const premiumRatio = pricier.msrpUsd / cheaper.msrpUsd;

  const results: InsightBlock[] = [
    {
      title: `${displayName(pricier)} premium check`,
      summary:
        premiumRatio > 1.25
          ? `${displayName(pricier)} costs materially more than ${displayName(cheaper)}. Unless you specifically want the brand cachet, finishing language, or dial personality, the extra spend is not automatically buying a better daily experience.`
          : `The pricing gap is real but not extreme. This is less about obvious overpricing and more about whether the extra cost maps to something you personally feel every day.`
    }
  ];

  if (pricier.marketingClaims.length > 0) {
    results.push({
      title: "What sounds bigger than it wears",
      summary: `${displayName(pricier)} leans on claims like ${pricier.marketingClaims.join(", ")}. Those are not fake, but they matter less than fit, thickness, clasp quality, and dial legibility once the watch is on your wrist.`
    });
  }

  return results;
}

function buildHiddenDownsides(left: WatchSpec, right: WatchSpec): InsightBlock[] {
  const blocks: InsightBlock[] = [];

  [left, right].forEach((watch) => {
    if (watch.style === "field") {
      blocks.push({
        title: `${displayName(watch)} dial personality tradeoff`,
        summary: `${displayName(watch)} is intentionally louder than a pure minimalist sports watch. If you are buying for timeless neutrality, that busy dial can become the thing you admire least after the honeymoon period.`
      });
    }

    if (watch.style === "explorer") {
      blocks.push({
        title: `${displayName(watch)} size expectation tradeoff`,
        summary: `${displayName(watch)} wears compact on purpose. That is great for comfort, but buyers wanting obvious presence can end up feeling it is too restrained after the initial excitement.`
      });
    }

    if (!watch.microAdjust) {
      blocks.push({
        title: `${displayName(watch)} fit downside`,
        summary: `${displayName(watch)} misses on-the-fly micro-adjust. That sounds minor until weather changes or your fit lands between links, at which point the bracelet can alternate between too tight and too loose.`
      });
    }

    if (watch.caseThicknessMm >= 12) {
      blocks.push({
        title: `${displayName(watch)} profile downside`,
        summary: `${displayName(watch)} crosses into the zone where it will sit more proudly on wrist. If you wear cuffs often, it can feel less low-maintenance than the thickness figure first suggests.`
      });
    }

    if (watch.dateWindow) {
      blocks.push({
        title: `${displayName(watch)} dial tradeoff`,
        summary: `The date window adds convenience, but it also breaks dial symmetry. Buyers who love clean sports-watch dials often start noticing that asymmetry more over time, not less.`
      });
    }
  });

  return blocks.slice(0, 4);
}

function scoreAlternative(targets: WatchSpec[], candidate: WatchSpec): number {
  return targets.reduce((score, target) => {
    let nextScore = score;

    if (candidate.style === target.style) {
      nextScore += 4;
    }

    if (Math.abs(candidate.caseDiameterMm - target.caseDiameterMm) <= 2) {
      nextScore += 3;
    }

    if (candidate.msrpUsd < target.msrpUsd) {
      nextScore += 2;
    }

    if (candidate.microAdjust) {
      nextScore += 1;
    }

    return nextScore;
  }, 0);
}

function buildBetterValueAlternative(left: WatchSpec, right: WatchSpec): InsightBlock[] {
  const alternative = watchCatalog
    .filter((watch) => watch.id !== left.id && watch.id !== right.id)
    .map((watch) => ({
      watch,
      score: scoreAlternative([left, right], watch)
    }))
    .sort((a, b) => b.score - a.score)[0]?.watch;

  if (!alternative) {
    return [];
  }

  return [
    {
      title: displayName(alternative),
      summary: `${displayName(alternative)} is the strongest value pivot if both of your original picks feel slightly misaligned. It keeps the enthusiast appeal, lands at ${formatUsd(alternative.msrpUsd)}, and avoids paying full premium money for differences that mostly live in branding or styling.`
    }
  ];
}

function buildSignalVsFluff(left: WatchSpec, right: WatchSpec): InsightBlock[] {
  const meaningfulSignals = [
    "thickness and lug span",
    "micro-adjust clasp quality",
    "water resistance relative to actual use",
    "dial legibility"
  ];

  return [
    {
      title: "Meaningful difference",
      summary: `For ${displayName(left)} versus ${displayName(right)}, the specs that genuinely change ownership are ${meaningfulSignals.join(", ")}. Those influence comfort and confidence every day.`
    },
    {
      title: "Mostly marketing",
      summary: "Heritage storytelling, romanticized origin myths, and marginal movement bragging rights are real parts of the product, but they rarely outweigh better fit or better bracelet execution."
    }
  ];
}

export function compareWatches(left: WatchSpec, right: WatchSpec): ComparisonResult {
  return {
    canonicalInputA: displayName(left),
    canonicalInputB: displayName(right),
    left,
    right,
    keyDifferences: buildKeyDifferences(left, right),
    realWorldImpact: buildRealWorldImpact(left, right),
    whoShouldBuyWhich: buildBuyerRecommendations(left, right),
    overpricedFeatures: buildOverpricedFeatures(left, right),
    hiddenDownsides: buildHiddenDownsides(left, right),
    betterValueAlternative: buildBetterValueAlternative(left, right),
    signalVsFluff: buildSignalVsFluff(left, right)
  };
}
