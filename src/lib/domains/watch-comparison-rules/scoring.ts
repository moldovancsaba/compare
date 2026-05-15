import type { ComparisonVerdict, WatchSpec } from "@/types/watch";

export function versatilityScore(watch: WatchSpec): number {
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

export function dailyWearScore(watch: WatchSpec): number {
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

export function toolScore(watch: WatchSpec): number {
  return watch.waterResistanceM / 50 + (watch.microAdjust ? 3 : 0) + (watch.weightFeel === "light" ? 1 : 0);
}

export function movementOwnershipScore(watch: WatchSpec): number {
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

export function valueScore(watch: WatchSpec): number {
  return dailyWearScore(watch) + toolScore(watch) + movementOwnershipScore(watch) - watch.msrpUsd / 3000;
}

export function collectorScore(watch: WatchSpec): number {
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

export function pickHigher(left: WatchSpec, right: WatchSpec, scorer: (watch: WatchSpec) => number): WatchSpec {
  return scorer(left) >= scorer(right) ? left : right;
}

export function confidenceFor(left: WatchSpec, right: WatchSpec, bestOverall: WatchSpec): ComparisonVerdict["confidence"] {
  const gap = Math.abs(dailyWearScore(left) + valueScore(left) - (dailyWearScore(right) + valueScore(right)));

  if (gap >= 6 || bestOverall.style === "explorer") {
    return "clear";
  }

  if (gap <= 2) {
    return "close";
  }

  return "contextual";
}
