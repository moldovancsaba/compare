import type { WatchSpec } from "@/types/watch";
import type { WatchValueScore, WatchValueScoreBreakdown } from "@/types/watch-value";

export const watchValueScoreWeights: Record<keyof WatchValueScoreBreakdown, number> = {
  comfort: 0.25,
  capability: 0.2,
  versatility: 0.2,
  ownership: 0.2,
  priceDiscipline: 0.15
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function componentLabel(score: number): string {
  if (score >= 75) {
    return "strong";
  }

  if (score >= 55) {
    return "fair";
  }

  return "weak";
}

function comfortScore(watch: WatchSpec): number {
  let score = 35;

  if (watch.caseDiameterMm <= 39) {
    score += 20;
  }

  if (watch.caseThicknessMm <= 11.8) {
    score += 20;
  }

  if (watch.lugToLugMm <= 46) {
    score += 10;
  }

  if (watch.microAdjust) {
    score += 10;
  }

  if (watch.weightFeel === "light") {
    score += 5;
  }

  return clampScore(score);
}

function capabilityScore(watch: WatchSpec): number {
  let score = Math.min(45, watch.waterResistanceM / 5);

  if (watch.powerReserveHours >= 70) {
    score += 20;
  }

  if (watch.microAdjust) {
    score += 15;
  }

  if (watch.antiMagneticGauss && watch.antiMagneticGauss >= 1000) {
    score += 10;
  }

  if (watch.ownershipProfile?.durability === "tool") {
    score += 10;
  }

  return clampScore(score);
}

function versatilityScore(watch: WatchSpec): number {
  let score = watch.style === "explorer" || watch.style === "dress-sport" ? 55 : 35;

  if (watch.caseThicknessMm <= 11.8) {
    score += 15;
  }

  if (watch.ownershipProfile?.strapVersatility === "high") {
    score += 15;
  }

  if (!watch.dateWindow) {
    score += 5;
  }

  if (watch.waterResistanceM >= 100) {
    score += 10;
  }

  return clampScore(score);
}

function ownershipScore(watch: WatchSpec): number {
  let score = 35;

  if (watch.ownershipProfile?.reliability === "exceptional") {
    score += 20;
  } else if (watch.ownershipProfile?.reliability === "strong") {
    score += 15;
  }

  if (watch.ownershipProfile?.resaleStability === "strong") {
    score += 25;
  } else if (watch.ownershipProfile?.resaleStability === "stable") {
    score += 15;
  }

  if (watch.ownershipProfile?.serviceExpectation === "low") {
    score += 15;
  } else if (watch.ownershipProfile?.serviceExpectation === "medium") {
    score += 8;
  }

  if (watch.marketPositioning?.collectorRespect === "strong") {
    score += 10;
  }

  return clampScore(score);
}

function priceDisciplineScore(watch: WatchSpec): number {
  if (watch.msrpUsd <= 4500) {
    return 95;
  }

  if (watch.msrpUsd <= 5500) {
    return 85;
  }

  if (watch.msrpUsd <= 7000) {
    return 65;
  }

  return 50;
}

export function calculateWatchValueScore(watch: WatchSpec): WatchValueScore {
  const breakdown = {
    comfort: comfortScore(watch),
    capability: capabilityScore(watch),
    versatility: versatilityScore(watch),
    ownership: ownershipScore(watch),
    priceDiscipline: priceDisciplineScore(watch)
  };
  const total = clampScore(
    Object.entries(breakdown).reduce(
      (sum, [key, value]) => sum + value * watchValueScoreWeights[key as keyof WatchValueScoreBreakdown],
      0
    )
  );

  return {
    total,
    label: componentLabel(total) as WatchValueScore["label"],
    breakdown,
    explanation: `Value score ${total}/100 (${componentLabel(total)}) weights comfort 25%, capability 20%, versatility 20%, ownership 20%, and price discipline 15%.`
  };
}
