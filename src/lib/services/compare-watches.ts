import { watchCatalog } from "@/lib/data/watch-catalog";
import { toWatchComparisonEntity } from "@/lib/domains/watch-entity";
import { formatHours, formatMm, formatUsd } from "@/lib/utils/format";
import type {
  BuyerRecommendation,
  ComparisonResult,
  ComparisonVerdict,
  InsightBlock,
  VerdictPick,
  WatchSpec
} from "@/types/watch";

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

function versatilityScore(watch: WatchSpec): number {
  let score = 0;

  if (watch.style === "explorer") {
    score += 5;
  }

  if (watch.style === "dress-sport") {
    score += 4;
  }

  if (watch.caseDiameterMm <= 39) {
    score += 2;
  }

  if (watch.caseThicknessMm <= 11.8) {
    score += 2;
  }

  if (watch.lugToLugMm <= 46) {
    score += 2;
  }

  if (!watch.dateWindow) {
    score += 1;
  }

  return score;
}

function dailyWearScore(watch: WatchSpec): number {
  let score = versatilityScore(watch);

  if (watch.microAdjust) {
    score += 2;
  }

  if (watch.weightFeel === "light") {
    score += 2;
  } else if (watch.weightFeel === "balanced") {
    score += 1;
  }

  if (watch.powerReserveHours >= 70) {
    score += 1;
  }

  return score;
}

function toolScore(watch: WatchSpec): number {
  return watch.waterResistanceM / 50 + (watch.microAdjust ? 3 : 0) + (watch.weightFeel === "light" ? 1 : 0);
}

function movementOwnershipScore(watch: WatchSpec): number {
  let score = watch.powerReserveHours / 24;

  if (watch.antiMagneticGauss && watch.antiMagneticGauss >= 15000) {
    score += 3;
  } else if (watch.antiMagneticGauss && watch.antiMagneticGauss >= 1000) {
    score += 1;
  }

  if (watch.frequencyVph >= 28800) {
    score += 1;
  }

  return score;
}

function valueScore(watch: WatchSpec): number {
  return dailyWearScore(watch) + toolScore(watch) + movementOwnershipScore(watch) - watch.msrpUsd / 3000;
}

function pickHigher(left: WatchSpec, right: WatchSpec, scorer: (watch: WatchSpec) => number): WatchSpec {
  return scorer(left) >= scorer(right) ? left : right;
}

function ownershipCharacter(watch: WatchSpec): string {
  switch (watch.style) {
    case "field":
      return "more expressive and tool-coded";
    case "explorer":
      return "quieter, easier to dress around, and more one-watch friendly";
    case "dive":
      return "sportier and more weekend-forward";
    case "dress-sport":
      return "more polished and office-to-weekend flexible";
  }
}

function confidenceFor(left: WatchSpec, right: WatchSpec, bestOverall: WatchSpec): ComparisonVerdict["confidence"] {
  const gap = Math.abs(dailyWearScore(left) + valueScore(left) - (dailyWearScore(right) + valueScore(right)));

  if (gap >= 6 || bestOverall.style === "explorer") {
    return "clear";
  }

  if (gap <= 2) {
    return "close";
  }

  return "contextual";
}

function buildVerdict(left: WatchSpec, right: WatchSpec): ComparisonVerdict {
  const dailyPick = pickHigher(left, right, dailyWearScore);
  const toolPick = pickHigher(left, right, toolScore);
  const movementPick = pickHigher(left, right, movementOwnershipScore);
  const valuePick = pickHigher(left, right, valueScore);
  const oneWatchPick = pickHigher(left, right, versatilityScore);
  const bestOverall = pickHigher(left, right, (watch) => dailyWearScore(watch) + valueScore(watch) + versatilityScore(watch));
  const other = bestOverall.id === left.id ? right : left;
  const confidence = confidenceFor(left, right, bestOverall);

  const picks: VerdictPick[] = [
    {
      label: "Best overall",
      pick: displayName(bestOverall),
      reason: `${displayName(bestOverall)} is ${ownershipCharacter(bestOverall)} while still avoiding the biggest daily-use compromises.`
    },
    {
      label: "Best daily wear",
      pick: displayName(dailyPick),
      reason: "Wins the comfort equation: case profile, perceived heft, and bracelet adjustability matter more after the first week than most spec-sheet bragging rights."
    },
    {
      label: "Best one-watch choice",
      pick: displayName(oneWatchPick),
      reason: "The safer pick if this has to cover office, travel, weekends, and understated occasions without feeling costume-like."
    },
    {
      label: "Best tool watch",
      pick: displayName(toolPick),
      reason: "The more practical hard-use choice when water resistance, bracelet adjustment, and sport-watch confidence matter most."
    },
    {
      label: "Best movement/ownership story",
      pick: displayName(movementPick),
      reason: "The stronger ownership case once power reserve, anti-magnetism, and technical resilience are weighted above romance."
    },
    {
      label: "Best value",
      pick: displayName(valuePick),
      reason: "Gives more usable ownership upside per retail dollar instead of asking you to pay mainly for branding or mythology."
    }
  ];

  return {
    bestOverall: displayName(bestOverall),
    confidence,
    headline:
      confidence === "clear"
        ? `${displayName(bestOverall)} is the stronger recommendation for most buyers.`
        : `${displayName(bestOverall)} is the safer default, but the decision is taste-sensitive.`,
    summary: `${displayName(other)} still has a real case if you specifically want something ${ownershipCharacter(other)}. The reason to pick ${displayName(bestOverall)} is not a bigger spec number; it is the lower-friction ownership profile.`,
    picks
  };
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

function buildOwnershipIntelligence(left: WatchSpec, right: WatchSpec): InsightBlock[] {
  const resaleWinner = pickHigher(left, right, (watch) => {
    let score = valueScore(watch);

    if (watch.brand === "Rolex") {
      score += 4;
    }

    if (watch.style === "explorer") {
      score += 2;
    }

    return score;
  });
  const dailyWinner = pickHigher(left, right, dailyWearScore);
  const emotionalContrast = `${displayName(left)} is ${left.ownership.emotionalCharacter.toLowerCase()}; ${displayName(right)} is ${right.ownership.emotionalCharacter.toLowerCase()}`;

  return [
    {
      title: "Daily ownership",
      summary: `${displayName(dailyWinner)} is the lower-friction daily choice. ${dailyWinner.ownership.dailyExperience}`
    },
    {
      title: "Emotional fit",
      summary: `${emotionalContrast} This matters because the technically better watch still fails if it feels wrong after the honeymoon.`
    },
    {
      title: "Service and resale reality",
      summary: `${displayName(resaleWinner)} has the safer long-term ownership case. ${resaleWinner.ownership.resaleBehaviour} ${resaleWinner.ownership.serviceReality}`
    },
    {
      title: "Scratch anxiety",
      summary: `${displayName(left)}: ${left.ownership.scratchRisk} ${displayName(right)}: ${right.ownership.scratchRisk}`
    },
    {
      title: "Enthusiast bias check",
      summary: `${displayName(left)}: ${left.ownership.enthusiastBias} ${displayName(right)}: ${right.ownership.enthusiastBias}`
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
      summary: `${displayName(pricier)} leans on claims like ${pricier.marketingClaims.join(", ")}. ${pricier.ownership.marketingReality}`
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
      summary: `${displayName(left)}: ${left.ownership.marketingReality} ${displayName(right)}: ${right.ownership.marketingReality}`
    }
  ];
}

export function compareWatches(left: WatchSpec, right: WatchSpec): ComparisonResult {
  return {
    domain: "watches",
    canonicalInputA: displayName(left),
    canonicalInputB: displayName(right),
    leftEntity: toWatchComparisonEntity(left),
    rightEntity: toWatchComparisonEntity(right),
    left,
    right,
    verdict: buildVerdict(left, right),
    keyDifferences: buildKeyDifferences(left, right),
    realWorldImpact: buildRealWorldImpact(left, right),
    ownershipIntelligence: buildOwnershipIntelligence(left, right),
    whoShouldBuyWhich: buildBuyerRecommendations(left, right),
    overpricedFeatures: buildOverpricedFeatures(left, right),
    hiddenDownsides: buildHiddenDownsides(left, right),
    betterValueAlternative: buildBetterValueAlternative(left, right),
    signalVsFluff: buildSignalVsFluff(left, right)
  };
}
