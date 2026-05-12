import type { WatchSpec } from "@/types/watch";
import type { WatchTradeoffScenario, WatchTradeoffScoreBreakdown, WatchTradeoffSimulation } from "@/types/watch-tradeoff";

export const defaultWatchTradeoffScenario: WatchTradeoffScenario = {
  budgetSensitivity: 3,
  wristComfort: 3,
  dressVersatility: 3,
  resaleImportance: 3,
  ruggedness: 3,
  brandNeutrality: 3
};

const scenarioKeys: Array<keyof WatchTradeoffScenario> = [
  "budgetSensitivity",
  "wristComfort",
  "dressVersatility",
  "resaleImportance",
  "ruggedness",
  "brandNeutrality"
];

function clampControl(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return 3;
  }

  return Math.max(0, Math.min(5, Math.round(parsed)));
}

function displayName(watch: WatchSpec): string {
  return `${watch.brand} ${watch.model}`;
}

function resaleScore(watch: WatchSpec): number {
  switch (watch.ownershipProfile?.resaleStability) {
    case "strong":
      return 10;
    case "stable":
      return 7;
    case "soft":
    default:
      return 4;
  }
}

function comfortScore(watch: WatchSpec): number {
  let score = 4;

  if (watch.caseDiameterMm <= 38) {
    score += 2;
  }

  if (watch.caseThicknessMm <= 11.8) {
    score += 2;
  }

  if (watch.lugToLugMm <= 46) {
    score += 1;
  }

  if (watch.microAdjust) {
    score += 1;
  }

  if (watch.weightFeel === "light") {
    score += 1;
  }

  return Math.min(10, score);
}

function versatilityScore(watch: WatchSpec): number {
  let score = 3;

  if (watch.style === "explorer" || watch.style === "dress-sport") {
    score += 4;
  }

  if (watch.caseThicknessMm <= 11.8) {
    score += 1;
  }

  if (!watch.dateWindow) {
    score += 1;
  }

  if (watch.ownershipProfile?.strapVersatility === "high") {
    score += 1;
  }

  return Math.min(10, score);
}

function ruggednessScore(watch: WatchSpec): number {
  let score = watch.waterResistanceM >= 200 ? 5 : 3;

  if (watch.ownershipProfile?.durability === "tool") {
    score += 3;
  } else if (watch.ownershipProfile?.durability === "everyday") {
    score += 2;
  }

  if (watch.microAdjust) {
    score += 1;
  }

  if (watch.antiMagneticGauss && watch.antiMagneticGauss >= 1000) {
    score += 1;
  }

  return Math.min(10, score);
}

function brandNeutralityScore(watch: WatchSpec): number {
  if (watch.marketPositioning?.brandCachet === "status") {
    return 4;
  }

  if (watch.marketPositioning?.brandCachet === "recognized") {
    return 7;
  }

  return 9;
}

function budgetScore(watch: WatchSpec): number {
  if (watch.msrpUsd <= 4500) {
    return 10;
  }

  if (watch.msrpUsd <= 6000) {
    return 8;
  }

  if (watch.msrpUsd <= 7500) {
    return 6;
  }

  return 4;
}

function scoreBreakdown(watch: WatchSpec): WatchTradeoffScoreBreakdown {
  return {
    budget: budgetScore(watch),
    comfort: comfortScore(watch),
    versatility: versatilityScore(watch),
    resale: resaleScore(watch),
    ruggedness: ruggednessScore(watch),
    brandFit: brandNeutralityScore(watch)
  };
}

function weightedScore(breakdown: WatchTradeoffScoreBreakdown, scenario: WatchTradeoffScenario): number {
  return (
    breakdown.budget * scenario.budgetSensitivity +
    breakdown.comfort * scenario.wristComfort +
    breakdown.versatility * scenario.dressVersatility +
    breakdown.resale * scenario.resaleImportance +
    breakdown.ruggedness * scenario.ruggedness +
    breakdown.brandFit * scenario.brandNeutrality
  );
}

function topPriorities(scenario: WatchTradeoffScenario): string[] {
  const labels: Record<keyof WatchTradeoffScenario, string> = {
    budgetSensitivity: "budget discipline",
    wristComfort: "wrist comfort",
    dressVersatility: "dress versatility",
    resaleImportance: "resale safety",
    ruggedness: "ruggedness",
    brandNeutrality: "brand neutrality"
  };

  return scenarioKeys
    .map((key) => ({ key, value: scenario[key] }))
    .filter((entry) => entry.value >= 4)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((entry) => labels[entry.key]);
}

function changedSectionsFor(scenario: WatchTradeoffScenario): string[] {
  const sections: string[] = [];

  if (scenario.budgetSensitivity >= 4 || scenario.resaleImportance >= 4) {
    sections.push("Best value");
  }

  if (scenario.wristComfort >= 4 || scenario.dressVersatility >= 4) {
    sections.push("Best daily wear");
  }

  if (scenario.ruggedness >= 4) {
    sections.push("Best tool watch");
  }

  if (scenario.brandNeutrality >= 4) {
    sections.push("Exception case");
  }

  return sections.length ? sections : ["Best overall"];
}

export function normalizeWatchTradeoffScenario(input: Partial<WatchTradeoffScenario> = {}): WatchTradeoffScenario {
  return {
    budgetSensitivity: clampControl(input.budgetSensitivity ?? defaultWatchTradeoffScenario.budgetSensitivity),
    wristComfort: clampControl(input.wristComfort ?? defaultWatchTradeoffScenario.wristComfort),
    dressVersatility: clampControl(input.dressVersatility ?? defaultWatchTradeoffScenario.dressVersatility),
    resaleImportance: clampControl(input.resaleImportance ?? defaultWatchTradeoffScenario.resaleImportance),
    ruggedness: clampControl(input.ruggedness ?? defaultWatchTradeoffScenario.ruggedness),
    brandNeutrality: clampControl(input.brandNeutrality ?? defaultWatchTradeoffScenario.brandNeutrality)
  };
}

export function serializeWatchTradeoffScenario(scenario: WatchTradeoffScenario): string {
  const normalized = normalizeWatchTradeoffScenario(scenario);
  return scenarioKeys.map((key) => normalized[key]).join("");
}

export function parseWatchTradeoffScenario(token: string | null | undefined): WatchTradeoffScenario {
  if (!token || token.length !== scenarioKeys.length || /[^0-5]/.test(token)) {
    return defaultWatchTradeoffScenario;
  }

  return normalizeWatchTradeoffScenario(
    Object.fromEntries(scenarioKeys.map((key, index) => [key, Number(token[index])])) as Partial<WatchTradeoffScenario>
  );
}

export function simulateWatchTradeoff(
  left: WatchSpec,
  right: WatchSpec,
  baselinePick: string,
  input: Partial<WatchTradeoffScenario> = {}
): WatchTradeoffSimulation {
  const scenario = normalizeWatchTradeoffScenario(input);
  const leftBreakdown = scoreBreakdown(left);
  const rightBreakdown = scoreBreakdown(right);
  const leftScore = weightedScore(leftBreakdown, scenario);
  const rightScore = weightedScore(rightBreakdown, scenario);
  const pick = leftScore >= rightScore ? left : right;
  const priorities = topPriorities(scenario);
  const priorityCopy = priorities.length ? priorities.join(", ") : "balanced priorities";

  return {
    scenario,
    pick: displayName(pick),
    pickId: pick.id,
    changedFromBaseline: displayName(pick) !== baselinePick,
    baselinePick,
    summary: `${displayName(pick)} wins this scenario because the controls emphasize ${priorityCopy}. This is a what-if overlay on the baseline verdict, not a replacement for the deterministic recommendation.`,
    changedSections: changedSectionsFor(scenario),
    leftScore,
    rightScore,
    leftBreakdown,
    rightBreakdown
  };
}
