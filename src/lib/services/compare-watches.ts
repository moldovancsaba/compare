import { watchCatalog } from "@/lib/data/watch-catalog";
import { analyzeWatchUpgradePath, collectionStatusFor, summarizeCollectionContext } from "@/lib/domains/watch-collection";
import { buildWatchConsequenceProfile } from "@/lib/domains/watch-consequences";
import { analyzeWatchDecisionIntent } from "@/lib/domains/watch-decision-intent";
import { toWatchComparisonEntity } from "@/lib/domains/watch-entity";
import { analyzeWatchMarketPositioning, analyzeWatchMarketingReality } from "@/lib/domains/watch-market-positioning";
import { simulateWatchOwnership } from "@/lib/domains/watch-ownership-simulator";
import { calculateWatchValueScore } from "@/lib/domains/watch-value-scoring";
import { formatHours, formatMm, formatUsd } from "@/lib/utils/format";
import type { EvidenceItem, EvidenceSummary, RecommendationSignal } from "@/types/comparison";
import type {
  BuyerRecommendation,
  ComparisonResult,
  ComparisonVerdict,
  InsightBlock,
  VerdictPick,
  WatchSpec
} from "@/types/watch";
import type { WatchCollectionProfile } from "@/types/watch-collection";
import type { WatchDecisionIntentProfile } from "@/types/watch-decision-intent";

function displayName(watch: WatchSpec): string {
  return `${watch.brand} ${watch.model}`;
}

function catalogEvidence(watch: WatchSpec, id: string, detail: string): EvidenceItem {
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

function derivedRuleEvidence(id: string, label: string, detail: string, watches: WatchSpec[]): EvidenceItem {
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

function editorialEvidence(id: string, label: string, detail: string, watches: WatchSpec[]): EvidenceItem {
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

function missingDataEvidence(id: string, label: string, detail: string, watches: WatchSpec[]): EvidenceItem {
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

function collectorScore(watch: WatchSpec): number {
  let score = valueScore(watch);

  if (watch.brand === "Rolex") {
    score += 4;
  }

  if (watch.style === "explorer") {
    score += 2;
  }

  if (watch.ownershipProfile?.resaleStability === "strong") {
    score += 3;
  } else if (watch.ownershipProfile?.resaleStability === "stable") {
    score += 1;
  }

  return score;
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

function ownershipProfileSummary(watch: WatchSpec): string {
  const profile = watch.ownershipProfile;

  if (!profile) {
    return "Structured ownership metadata is incomplete, so this claim stays lower confidence.";
  }

  return `Structured profile: ${profile.comfort} comfort, ${profile.serviceExpectation} service burden, ${profile.durability} durability, ${profile.resaleStability} resale stability, ${profile.braceletQuality} bracelet quality, and ${profile.strapVersatility} strap versatility.`;
}

function ownershipProfileEvidence(watch: WatchSpec): EvidenceItem {
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

function marketPositioningEvidence(watch: WatchSpec): EvidenceItem {
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
      reason: `${displayName(bestOverall)} is ${ownershipCharacter(bestOverall)} while still avoiding the biggest daily-use compromises.`,
      evidence: [
        derivedRuleEvidence(
          "watch:best-overall-score",
          "Weighted ownership scoring",
          "Best overall weighs daily wear, value, and versatility higher than isolated specification wins.",
          [left, right]
        )
      ]
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
    strongerChoice: displayName(bestOverall),
    exceptionCase: `${displayName(other)} is still the better emotional pick if you specifically want something ${ownershipCharacter(other)}.`,
    confidenceRationale:
      confidence === "clear"
        ? "The deterministic daily-wear, value, and versatility scores create enough separation for a strong recommendation."
        : "The scoring gap is not large enough to erase taste, wrist fit, and collection-context preferences.",
    headline:
      confidence === "clear"
        ? `${displayName(bestOverall)} is the stronger recommendation for most buyers.`
        : `${displayName(bestOverall)} is the safer default, but the decision is taste-sensitive.`,
    summary: `${displayName(other)} still has a real case if you specifically want something ${ownershipCharacter(other)}. The reason to pick ${displayName(bestOverall)} is not a bigger spec number; it is the lower-friction ownership profile.`,
    evidence: [
      derivedRuleEvidence(
        "watch:verdict-confidence",
        "Deterministic confidence rule",
        "Verdict confidence is based on the gap between daily-wear and value scores, with compact explorer-style watches receiving a versatility bonus.",
        [left, right]
      )
    ],
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
      summary: `${displayName(larger)} is larger on paper at ${formatMm(larger.caseDiameterMm)} with a ${formatMm(larger.lugToLugMm)} span, which makes it ${buildWatchConsequenceProfile(larger).wristPresence}. ${displayName(thinner)} is the slimmer-feeling watch because its thickness stays at ${formatMm(thinner.caseThicknessMm)} and ${buildWatchConsequenceProfile(thinner).cuffFit}.`,
      evidence: [
        catalogEvidence(larger, "case-profile", "Case diameter, lug-to-lug, and thickness come from the curated watch catalog."),
        derivedRuleEvidence(
          "watch:wrist-presence-rule",
          "Wearability rule",
          "Case diameter and lug-to-lug estimate visual presence; thickness estimates cuff and desk comfort.",
          [left, right]
        )
      ]
    },
    {
      title: "Use-case bias",
      summary: `${displayName(left)} ${pickStyleMeaning(left.style)}, while ${displayName(right)} ${pickStyleMeaning(right.style)}.`,
      evidence: [
        editorialEvidence(
          "watch:style-positioning",
          "Style positioning inference",
          "Use-case bias is inferred from the adapter's style taxonomy and ownership notes.",
          [left, right]
        )
      ]
    },
    {
      title: "Capability gap",
      summary: `${displayName(moreWater)} offers the stronger hard-use spec headline with ${moreWater.waterResistanceM}m water resistance. ${displayName(longerReserve)} also wins the practical no-wear window with a ${formatHours(longerReserve.powerReserveHours)} power reserve, making it ${buildWatchConsequenceProfile(longerReserve).travelReadiness}.`,
      evidence: [
        catalogEvidence(moreWater, "water-resistance", "Water resistance and power reserve are fixture-backed catalog attributes.")
      ]
    },
    {
      title: "Price delta",
      summary: `The retail spread is ${formatUsd(priceGap)}. That matters because enthusiast buyers usually feel price increases most when the extra spend mostly buys finishing, branding, or dial character rather than comfort or capability.`,
      evidence: [
        catalogEvidence(left, "retail-price", "Retail price is read from the curated catalog fixture."),
        catalogEvidence(right, "retail-price", "Retail price is read from the curated catalog fixture."),
        missingDataEvidence(
          "watch:live-market-price-gap",
          "Live market prices not used",
          "The deterministic engine does not use live dealer listings, secondary-market sales, or regional discounts.",
          [left, right]
        )
      ]
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
      summary: `${displayName(thicknessWinner)} will disappear faster during desk work and travel because it is thinner and ${buildWatchConsequenceProfile(thicknessWinner).cuffFit}. If you care about sleeve clearance or hate top-heavy watches, that small paper gap is usually noticeable in a week of ownership.`,
      evidence: [
        derivedRuleEvidence(
          "watch:comfort-thickness-rule",
          "Comfort consequence rule",
          "Lower thickness is treated as a proxy for easier cuff clearance and lower top-heavy feel.",
          [left, right]
        )
      ]
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
        ? `${displayName(lighterFeel)} gives the more effortless feel on wrist and has ${buildWatchConsequenceProfile(lighterFeel).wristSizeSensitivity}. That matters if you want a watch you stop noticing rather than a watch that constantly reminds you it is there.`
        : "Both watches land in the balanced range, so the difference is more about shape and bracelet articulation than raw mass."
    }
  ];
}

function buildCollectionContextInsight(
  left: WatchSpec,
  right: WatchSpec,
  profile: WatchCollectionProfile | null | undefined
): InsightBlock | null {
  const summary = summarizeCollectionContext(left, right, profile);

  if (!summary) {
    return null;
  }

  return {
    title: "Collection context",
    summary: `${summary} Treat this as early personalization: it can flag ownership overlap, but it is not yet a full collection-gap or upgrade-path model.`,
    evidence: [
      editorialEvidence(
        "watch:user-collection-context",
        "User-supplied collection context",
        "Collection context is read from the accountless local profile submitted with the comparison request.",
        [left, right]
      )
    ]
  };
}

function buildUpgradePathInsight(
  left: WatchSpec,
  right: WatchSpec,
  profile: WatchCollectionProfile | null | undefined
): InsightBlock | null {
  if (!profile) {
    return null;
  }

  const leftVerdict = analyzeWatchUpgradePath(left, profile);
  const rightVerdict = analyzeWatchUpgradePath(right, profile);
  const verdicts = [leftVerdict, rightVerdict].filter((verdict): verdict is NonNullable<typeof verdict> =>
    Boolean(verdict)
  );

  if (!verdicts.length) {
    return null;
  }

  return {
    title: "Upgrade path guidance",
    summary: verdicts
      .map((verdict) => `${displayName(verdict.candidateWatchId === left.id ? left : right)}: ${verdict.classification.replace("_", "-")} path. ${verdict.summary}`)
      .join(" "),
    evidence: [
      editorialEvidence(
        "watch:upgrade-path-context",
        "Collection upgrade-path context",
        "Upgrade guidance compares each candidate against the closest owned watch in the submitted local collection profile.",
        [left, right]
      )
    ]
  };
}

function buildDecisionIntentInsight(
  left: WatchSpec,
  right: WatchSpec,
  decisionIntent?: WatchDecisionIntentProfile | null
): InsightBlock | null {
  const analysis = analyzeWatchDecisionIntent(left, right, decisionIntent);

  if (!analysis) {
    return null;
  }

  return {
    title: "Decision intent",
    summary: `${analysis.summary} Active constraints: ${analysis.activeConstraints.join(", ") || "balanced intent"}.`,
    evidence: [
      editorialEvidence(
        "watch:decision-intent-profile",
        "User-supplied decision intent",
        "Decision intent is optional local context submitted with the comparison request; it adjusts emphasis but does not replace baseline rules.",
        [left, right]
      )
    ]
  };
}

function buildOwnershipIntelligence(
  left: WatchSpec,
  right: WatchSpec,
  profile?: WatchCollectionProfile | null,
  decisionIntent?: WatchDecisionIntentProfile | null
): InsightBlock[] {
  const resaleWinner = pickHigher(left, right, collectorScore);
  const dailyWinner = pickHigher(left, right, dailyWearScore);
  const emotionalContrast = `${displayName(left)} is ${left.ownership.emotionalCharacter.toLowerCase()}; ${displayName(right)} is ${right.ownership.emotionalCharacter.toLowerCase()}`;
  const collectionContext = buildCollectionContextInsight(left, right, profile);
  const upgradePath = buildUpgradePathInsight(left, right, profile);
  const intentInsight = buildDecisionIntentInsight(left, right, decisionIntent);
  const leftSimulation = simulateWatchOwnership(left);
  const rightSimulation = simulateWatchOwnership(right);

  return [
    ...(collectionContext ? [collectionContext] : []),
    ...(upgradePath ? [upgradePath] : []),
    ...(intentInsight ? [intentInsight] : []),
    {
      title: "Daily ownership",
      summary: `${displayName(dailyWinner)} is the lower-friction daily choice. ${dailyWinner.ownership.dailyExperience} ${ownershipProfileSummary(dailyWinner)}`,
      evidence: [
        editorialEvidence(
          "watch:daily-ownership-notes",
          "Curated ownership note",
          "Daily ownership comes from adapter fixture notes, not live owner telemetry.",
          [dailyWinner]
        ),
        ownershipProfileEvidence(dailyWinner)
      ]
    },
    {
      title: "Emotional fit",
      summary: `${emotionalContrast} This matters because the technically better watch still fails if it feels wrong after the honeymoon.`
    },
    {
      title: "Service and resale reality",
      summary: `${displayName(resaleWinner)} has the safer long-term ownership case. ${resaleWinner.ownership.resaleBehaviour} ${resaleWinner.ownership.serviceReality} ${buildWatchConsequenceProfile(resaleWinner).serviceFriction}. ${ownershipProfileSummary(resaleWinner)}`,
      evidence: [
        editorialEvidence(
          "watch:resale-service-inference",
          "Ownership-risk inference",
          "Service and resale commentary is based on curated brand and model-level ownership notes.",
          [left, right]
        ),
        missingDataEvidence(
          "watch:no-live-service-quotes",
          "Live service quotes not used",
          "This result does not query manufacturer service prices, independent watchmaker quotes, or recent auction outcomes.",
          [left, right]
        )
      ]
    },
    {
      title: "Five-year ownership simulation",
      summary: `${displayName(left)}: service planning range ${leftSimulation.estimatedServiceCostUsd.label}, ${leftSimulation.serviceIntervalYears}-year service interval, ${leftSimulation.durabilityRisk} durability risk, ${leftSimulation.exitLiquidity} exit liquidity, ${leftSimulation.frictionLevel} friction. ${displayName(right)}: service planning range ${rightSimulation.estimatedServiceCostUsd.label}, ${rightSimulation.serviceIntervalYears}-year service interval, ${rightSimulation.durabilityRisk} durability risk, ${rightSimulation.exitLiquidity} exit liquidity, ${rightSimulation.frictionLevel} friction. Assumptions are conservative and do not use live market data.`,
      evidence: [
        derivedRuleEvidence(
          "watch:five-year-ownership-simulation",
          "Five-year ownership simulator",
          "Simulator maps structured ownership metadata to broad service, durability, liquidity, and friction bands; it avoids exact price predictions.",
          [left, right]
        ),
        ...(leftSimulation.warnings.length || rightSimulation.warnings.length
          ? [
              missingDataEvidence(
                "watch:ownership-simulation-warning",
                "Ownership simulation warnings",
                [...leftSimulation.warnings, ...rightSimulation.warnings].join(" "),
                [left, right]
              )
            ]
          : [])
      ]
    },
    {
      title: "Scratch anxiety",
      summary: `${displayName(left)}: ${left.ownership.scratchRisk} ${ownershipProfileSummary(left)} ${displayName(right)}: ${right.ownership.scratchRisk} ${ownershipProfileSummary(right)}`
    },
    {
      title: "Enthusiast bias check",
      summary: `${displayName(left)}: ${left.ownership.enthusiastBias} ${displayName(right)}: ${right.ownership.enthusiastBias}`
    }
  ];
}

function buildBuyerRecommendations(
  left: WatchSpec,
  right: WatchSpec,
  profile?: WatchCollectionProfile | null,
  decisionIntent?: WatchDecisionIntentProfile | null
): BuyerRecommendation[] {
  const recommendations: BuyerRecommendation[] = [
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

  const leftStatus = collectionStatusFor(profile, left);
  const rightStatus = collectionStatusFor(profile, right);

  if (leftStatus || rightStatus) {
    const unownedCompared = !leftStatus ? left : !rightStatus ? right : null;
    recommendations.push({
      buyerType: "Collection-aware buyer",
      pick: unownedCompared ? displayName(unownedCompared) : "Pause before buying either",
      reason: unownedCompared
        ? `${displayName(unownedCompared)} adds a new slot relative to the saved collection context, while the other compared watch is already marked ${leftStatus ?? rightStatus}.`
        : "Both compared watches already appear in your saved collection context, so this should be treated as an overlap or upgrade-path decision before spending again."
    });
  }

  const intentAnalysis = analyzeWatchDecisionIntent(left, right, decisionIntent);

  if (intentAnalysis) {
    recommendations.push({
      buyerType: "Your decision intent",
      pick: intentAnalysis.pick,
      reason: `${intentAnalysis.summary} This personalization uses ${intentAnalysis.activeConstraints.join(", ") || "the supplied profile"} as deterministic weighting context.`
    });
  }

  return recommendations;
}

function buildRecommendationSignals(
  left: WatchSpec,
  right: WatchSpec,
  profile?: WatchCollectionProfile | null,
  decisionIntent?: WatchDecisionIntentProfile | null
): RecommendationSignal[] {
  const bestOverall = pickHigher(left, right, (watch) => dailyWearScore(watch) + valueScore(watch) + versatilityScore(watch));
  const dailyPick = pickHigher(left, right, dailyWearScore);
  const valuePick = pickHigher(left, right, valueScore);
  const collectorPick = pickHigher(left, right, collectorScore);
  const riskierFit = pickHigher(left, right, (watch) => {
    const consequence = buildWatchConsequenceProfile(watch);
    return (
      watch.caseDiameterMm +
      watch.lugToLugMm / 2 +
      watch.caseThicknessMm +
      (consequence.cuffFit.includes("proud") ? 3 : 0) +
      (watch.ownershipProfile?.serviceExpectation === "high" ? 2 : 0)
    );
  });
  const bestOverallGap = Math.abs(
    dailyWearScore(left) + valueScore(left) + versatilityScore(left) -
      (dailyWearScore(right) + valueScore(right) + versatilityScore(right))
  );

  const collectionSignal = buildCollectionSignal(left, right, profile);
  const intentAnalysis = analyzeWatchDecisionIntent(left, right, decisionIntent);
  const intentSignal: RecommendationSignal | null = intentAnalysis
    ? {
        kind: "best_overall",
        label: "Intent-aware pick",
        pick: intentAnalysis.pick,
        reason: intentAnalysis.summary,
        confidence: "medium"
      }
    : null;

  if (bestOverallGap <= 1) {
    return [
      {
        kind: "no_clear_winner",
        label: "No clear default",
        pick: "Context decides",
        reason:
          "The deterministic scores are too close for a universal winner. Wrist fit, taste, collection overlap, and tolerance for ownership friction should decide.",
        confidence: "medium"
      },
      {
        kind: "best_daily",
        label: "Best daily wearer",
        pick: displayName(dailyPick),
        reason: `${displayName(dailyPick)} has the safer daily-use profile once comfort, profile, bracelet adjustment, and reserve are weighted.`,
        confidence: "medium"
      },
      {
        kind: "avoid_if",
        label: "Avoid if",
        pick: displayName(riskierFit),
        reason: `${displayName(riskierFit)} is the riskier fit if you want low visual presence, easy cuff clearance, and low-maintenance ownership.`,
        confidence: "medium"
      },
      ...(intentSignal ? [intentSignal] : []),
      ...(collectionSignal ? [collectionSignal] : [])
    ];
  }

  return [
    {
      kind: "best_overall",
      label: "Buy this by default",
      pick: displayName(bestOverall),
      reason: `${displayName(bestOverall)} has the strongest combined case across daily wear, value discipline, and versatility.`,
      confidence: "medium"
    },
    {
      kind: "best_daily",
      label: "Best daily wearer",
      pick: displayName(dailyPick),
      reason: `${displayName(dailyPick)} is the easier day-to-day choice when comfort, wrist behavior, adjustment, and no-wear tolerance matter more than romance.`,
      confidence: "medium"
    },
    {
      kind: "best_value",
      label: "Best value discipline",
      pick: displayName(valuePick),
      reason: `${displayName(valuePick)} gives more practical ownership upside per retail dollar and asks you to pay less for story alone.`,
      confidence: "medium"
    },
    {
      kind: "best_collector",
      label: "Best collector safety",
      pick: displayName(collectorPick),
      reason: `${displayName(collectorPick)} has the stronger long-term ownership case once brand liquidity, model versatility, resale stability, and service confidence are considered.`,
      confidence: "medium"
    },
    {
      kind: "avoid_if",
      label: "Avoid if",
      pick: displayName(riskierFit),
      reason: `${displayName(riskierFit)} is the option to question if you want low visual presence, easy cuff clearance, and minimal ownership friction.`,
      confidence: "medium"
    },
    ...(intentSignal ? [intentSignal] : []),
    ...(collectionSignal ? [collectionSignal] : [])
  ];
}

function buildCollectionSignal(
  left: WatchSpec,
  right: WatchSpec,
  profile: WatchCollectionProfile | null | undefined
): RecommendationSignal | null {
  const leftStatus = collectionStatusFor(profile, left);
  const rightStatus = collectionStatusFor(profile, right);

  if (!leftStatus && !rightStatus) {
    return null;
  }

  if (leftStatus && rightStatus) {
    return {
      kind: "avoid_if",
      label: "Collection overlap check",
      pick: "Pause before buying either",
      reason:
        "Both compared watches already appear in your saved collection context. Treat this as an upgrade or redundancy decision before adding another watch.",
      confidence: "medium"
    };
  }

  const unowned = leftStatus ? right : left;
  const owned = leftStatus ? left : right;

  return {
    kind: "best_collector",
    label: "Collection-aware pick",
    pick: displayName(unowned),
    reason: `${displayName(unowned)} is the cleaner addition because ${displayName(owned)} is already marked ${leftStatus ?? rightStatus} in your saved profile.`,
    confidence: "medium"
  };
}

function buildOverpricedFeatures(left: WatchSpec, right: WatchSpec): InsightBlock[] {
  const pricier = left.msrpUsd >= right.msrpUsd ? left : right;
  const cheaper = pricier.id === left.id ? right : left;
  const premiumRatio = pricier.msrpUsd / cheaper.msrpUsd;
  const leftValue = calculateWatchValueScore(left);
  const rightValue = calculateWatchValueScore(right);
  const valueWinner = leftValue.total >= rightValue.total ? left : right;
  const winningScore = valueWinner.id === left.id ? leftValue : rightValue;

  const results: InsightBlock[] = [
    {
      title: "Transparent value score",
      summary: `${displayName(left)} scores ${leftValue.total}/100 (${leftValue.label}); ${displayName(right)} scores ${rightValue.total}/100 (${rightValue.label}). ${displayName(valueWinner)} has the stronger value case because the score weights comfort, capability, versatility, ownership, and price discipline explicitly.`,
      evidence: [
        derivedRuleEvidence(
          "watch:transparent-value-score",
          "Transparent value scoring",
          `${winningScore.explanation} Scores are deterministic decision aids, not market-price guarantees.`,
          [left, right]
        )
      ]
    },
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

function scoreAlternative(
  targets: WatchSpec[],
  candidate: WatchSpec,
  decisionIntent?: WatchDecisionIntentProfile | null
): number {
  const intentAnalysis = analyzeWatchDecisionIntent(candidate, targets[0], decisionIntent);
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
  }, intentAnalysis?.leftMatch.score ?? 0);
}

function buildBetterValueAlternative(
  left: WatchSpec,
  right: WatchSpec,
  decisionIntent?: WatchDecisionIntentProfile | null
): InsightBlock[] {
  const alternative = watchCatalog
    .filter((watch) => watch.id !== left.id && watch.id !== right.id)
    .map((watch) => ({
      watch,
      score: scoreAlternative([left, right], watch, decisionIntent)
    }))
    .sort((a, b) => b.score - a.score)[0]?.watch;

  if (!alternative) {
    return [];
  }

  const alternativeScore = calculateWatchValueScore(alternative);

  return [
    {
      title: displayName(alternative),
      summary: `${displayName(alternative)} is the strongest value pivot if both of your original picks feel slightly misaligned. It keeps the enthusiast appeal, lands at ${formatUsd(alternative.msrpUsd)}, and carries a transparent value score of ${alternativeScore.total}/100. It avoids paying full premium money for differences that mostly live in branding or styling.${decisionIntent ? " The ranking also reflects the supplied decision-intent profile." : ""}`
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
  const leftMarket = analyzeWatchMarketPositioning(left);
  const rightMarket = analyzeWatchMarketPositioning(right);
  const leftMarketingReality = analyzeWatchMarketingReality(left);
  const rightMarketingReality = analyzeWatchMarketingReality(right);

  return [
    {
      title: "Meaningful difference",
      summary: `For ${displayName(left)} versus ${displayName(right)}, the specs that genuinely change ownership are ${meaningfulSignals.join(", ")}. Those influence comfort and confidence every day.`,
      evidence: [
        derivedRuleEvidence(
          "watch:signal-vs-fluff-rule",
          "Signal hierarchy rule",
          "The adapter treats comfort, fit adjustment, practical resistance, and legibility as higher-signal than pure marketing claims.",
          [left, right]
        )
      ]
    },
    {
      title: "Market positioning",
      summary: `${displayName(left)}: ${leftMarket.positioningSummary} ${leftMarket.hypeVsSubstance} ${displayName(right)}: ${rightMarket.positioningSummary} ${rightMarket.hypeVsSubstance}`,
      evidence: [
        marketPositioningEvidence(left),
        marketPositioningEvidence(right),
        editorialEvidence(
          "watch:market-positioning-inference",
          "Model-level market positioning inference",
          "Market positioning is derived from curated model-level traits and structured ownership metadata; it does not scrape forums or make blanket brand claims.",
          [left, right]
        ),
        ...(leftMarket.warnings.length || rightMarket.warnings.length
          ? [
              missingDataEvidence(
                "watch:market-positioning-warning",
                "Market-positioning warnings",
                [...leftMarket.warnings, ...rightMarket.warnings].join(" "),
                [left, right]
              )
            ]
          : [])
      ]
    },
    {
      title: "Mostly marketing",
      summary: `${displayName(left)}: ${leftMarketingReality.mythCheck} ${displayName(right)}: ${rightMarketingReality.mythCheck}`,
      evidence: [
        editorialEvidence(
          "watch:marketing-reality-notes",
          "Marketing reality inference",
          "Marketing-vs-reality copy comes from curated fixture notes and deterministic adapter rules.",
          [left, right]
        )
      ]
    },
    {
      title: "Spec inflation check",
      summary: `${displayName(left)}: ${leftMarketingReality.specInflationCheck} ${displayName(right)}: ${rightMarketingReality.specInflationCheck}`,
      evidence: [
        derivedRuleEvidence(
          "watch:spec-inflation-check",
          "Spec-inflation rule",
          "The adapter separates practical specs that change ownership from claims that mostly create narrative pressure.",
          [left, right]
        )
      ]
    },
    {
      title: "What to ignore",
      summary: `${displayName(left)}: ${leftMarketingReality.buyerCaution} ${displayName(right)}: ${rightMarketingReality.buyerCaution}`,
      evidence: [
        editorialEvidence(
          "watch:marketing-buyer-caution",
          "Marketing buyer-caution rule",
          "Buyer cautions combine curated marketing claims with structured market-positioning substance and caution signals.",
          [left, right]
        ),
        ...(leftMarketingReality.warnings.length || rightMarketingReality.warnings.length
          ? [
              missingDataEvidence(
                "watch:marketing-reality-warning",
                "Marketing-reality warnings",
                [...leftMarketingReality.warnings, ...rightMarketingReality.warnings].join(" "),
                [left, right]
              )
            ]
          : [])
      ]
    }
  ];
}

function buildEvidenceSummary(left: WatchSpec, right: WatchSpec): EvidenceSummary {
  return {
    overallConfidence: "medium",
    dataQuality: "medium",
    evidence: [
      catalogEvidence(left, "fixture-backed-specs", "Core specs, retail price, aliases, ownership notes, and structured ownership profile are read from the curated watch fixture."),
      catalogEvidence(right, "fixture-backed-specs", "Core specs, retail price, aliases, ownership notes, and structured ownership profile are read from the curated watch fixture."),
      marketPositioningEvidence(left),
      marketPositioningEvidence(right),
      derivedRuleEvidence(
        "watch:ownership-consequence-rules",
        "Consequence rules",
        "The adapter converts size, thickness, resistance, adjustment, and movement attributes into daily-use consequences.",
        [left, right]
      ),
      editorialEvidence(
        "watch:curated-ownership-inference",
        "Curated ownership inference",
        "Emotional fit, enthusiast bias, and marketing reality are deterministic interpretations of curated adapter metadata.",
        [left, right]
      ),
      missingDataEvidence(
        "watch:missing-live-market-data",
        "No live market evidence",
        "The result does not yet include live market prices, sold listings, service invoices, owner surveys, or regional availability.",
        [left, right]
      )
    ],
    limitations: [
      "No live market pricing, service quotes, owner surveys, or regional availability are used in this deterministic result.",
      "Subjective ownership character is inferred from curated adapter metadata and should be treated as editorial guidance.",
      "Fixture freshness is currently unknown because catalog rows do not carry per-source verification timestamps."
    ]
  };
}

export function compareWatches(
  left: WatchSpec,
  right: WatchSpec,
  collectionProfile?: WatchCollectionProfile | null,
  decisionIntent?: WatchDecisionIntentProfile | null
): ComparisonResult {
  return {
    domain: "watches",
    canonicalInputA: displayName(left),
    canonicalInputB: displayName(right),
    leftEntity: toWatchComparisonEntity(left),
    rightEntity: toWatchComparisonEntity(right),
    left,
    right,
    verdict: buildVerdict(left, right),
    sectionLabels: {
      keyDifferences: "Decision Drivers",
      realWorldImpact: "Daily Wear Experience",
      ownershipIntelligence: "Ownership Tradeoffs",
      whoShouldBuyWhich: "Best For",
      overpricedFeatures: "Overpriced Features",
      hiddenDownsides: "Hidden Downsides",
      betterValueAlternative: "Better Value Alternative",
      signalVsFluff: "Marketing vs Reality"
    },
    evidenceSummary: buildEvidenceSummary(left, right),
    recommendationSignals: buildRecommendationSignals(left, right, collectionProfile, decisionIntent),
    keyDifferences: buildKeyDifferences(left, right),
    realWorldImpact: buildRealWorldImpact(left, right),
    ownershipIntelligence: buildOwnershipIntelligence(left, right, collectionProfile, decisionIntent),
    whoShouldBuyWhich: buildBuyerRecommendations(left, right, collectionProfile, decisionIntent),
    overpricedFeatures: buildOverpricedFeatures(left, right),
    hiddenDownsides: buildHiddenDownsides(left, right),
    betterValueAlternative: buildBetterValueAlternative(left, right, decisionIntent),
    signalVsFluff: buildSignalVsFluff(left, right)
  };
}
