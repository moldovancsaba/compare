import type { ComparisonContext } from "@/types/comparison";
import type { WatchSpec } from "@/types/watch";
import type {
  WatchBrandCachetTolerance,
  WatchDateWindowPreference,
  WatchDecisionIntentAnalysis,
  WatchDecisionIntentMatch,
  WatchDecisionIntentProfile,
  WatchPrimaryUseCase,
  WatchStylePreference,
  WatchWristSizeBand
} from "@/types/watch-decision-intent";

const wristSizeBands = new Set<WatchWristSizeBand>(["small", "medium", "large"]);
const primaryUseCases = new Set<WatchPrimaryUseCase>(["daily", "dress", "sport", "collection"]);
const stylePreferences = new Set<WatchStylePreference>(["understated", "tool", "dress_sport", "no_preference"]);
const brandCachetTolerances = new Set<WatchBrandCachetTolerance>(["low", "medium", "high"]);
const dateWindowPreferences = new Set<WatchDateWindowPreference>([
  "prefer_no_date",
  "prefer_date",
  "no_preference"
]);

function clampControl(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.max(0, Math.min(5, Math.round(parsed)));
}

function displayName(watch: WatchSpec): string {
  return `${watch.brand} ${watch.model}`;
}

function hasProfileSignal(profile: WatchDecisionIntentProfile): boolean {
  return Boolean(
    profile.wristSizeBand ||
      profile.primaryUseCase ||
      profile.stylePreference ||
      profile.brandCachetTolerance ||
      profile.dateWindowPreference ||
      profile.budgetSensitivity !== undefined ||
      profile.comfortPriority !== undefined
  );
}

export function normalizeWatchDecisionIntentProfile(input: unknown): WatchDecisionIntentProfile | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const source = input as Record<string, unknown>;
  const profile: WatchDecisionIntentProfile = {};
  const budgetSensitivity = clampControl(source.budgetSensitivity);
  const comfortPriority = clampControl(source.comfortPriority);

  if (typeof source.wristSizeBand === "string" && wristSizeBands.has(source.wristSizeBand as WatchWristSizeBand)) {
    profile.wristSizeBand = source.wristSizeBand as WatchWristSizeBand;
  }

  if (typeof source.primaryUseCase === "string" && primaryUseCases.has(source.primaryUseCase as WatchPrimaryUseCase)) {
    profile.primaryUseCase = source.primaryUseCase as WatchPrimaryUseCase;
  }

  if (typeof source.stylePreference === "string" && stylePreferences.has(source.stylePreference as WatchStylePreference)) {
    profile.stylePreference = source.stylePreference as WatchStylePreference;
  }

  if (
    typeof source.brandCachetTolerance === "string" &&
    brandCachetTolerances.has(source.brandCachetTolerance as WatchBrandCachetTolerance)
  ) {
    profile.brandCachetTolerance = source.brandCachetTolerance as WatchBrandCachetTolerance;
  }

  if (
    typeof source.dateWindowPreference === "string" &&
    dateWindowPreferences.has(source.dateWindowPreference as WatchDateWindowPreference)
  ) {
    profile.dateWindowPreference = source.dateWindowPreference as WatchDateWindowPreference;
  }

  if (budgetSensitivity !== undefined) {
    profile.budgetSensitivity = budgetSensitivity;
  }

  if (comfortPriority !== undefined) {
    profile.comfortPriority = comfortPriority;
  }

  return hasProfileSignal(profile) ? profile : null;
}

export function watchDecisionIntentProfileFromContext(context?: ComparisonContext): WatchDecisionIntentProfile | null {
  return normalizeWatchDecisionIntentProfile(context?.watchDecisionIntentProfile);
}

function scoreIntentMatch(watch: WatchSpec, profile: WatchDecisionIntentProfile): WatchDecisionIntentMatch {
  let score = 0;
  const reasons: string[] = [];

  if (profile.wristSizeBand === "small" && watch.lugToLugMm <= 46 && watch.caseDiameterMm <= 38) {
    score += 4;
    reasons.push("small-wrist fit");
  } else if (profile.wristSizeBand === "large" && watch.caseDiameterMm >= 39) {
    score += 2;
    reasons.push("larger wrist presence");
  }

  if (profile.primaryUseCase === "daily" && watch.microAdjust && watch.caseThicknessMm <= 11.8) {
    score += 4;
    reasons.push("low-friction daily wear");
  } else if (profile.primaryUseCase === "dress" && (watch.style === "explorer" || watch.style === "dress-sport")) {
    score += 4;
    reasons.push("dress-capable role");
  } else if (profile.primaryUseCase === "sport" && watch.waterResistanceM >= 200) {
    score += 4;
    reasons.push("sport-use headroom");
  } else if (profile.primaryUseCase === "collection" && watch.marketPositioning?.collectorRespect === "strong") {
    score += 3;
    reasons.push("collector respect");
  }

  if (profile.stylePreference === "understated" && (watch.style === "explorer" || watch.style === "dress-sport")) {
    score += 3;
    reasons.push("understated style");
  } else if (profile.stylePreference === "tool" && (watch.style === "dive" || watch.style === "field")) {
    score += 3;
    reasons.push("tool-watch character");
  } else if (profile.stylePreference === "dress_sport" && watch.style === "dress-sport") {
    score += 3;
    reasons.push("dress-sport fit");
  }

  if ((profile.budgetSensitivity ?? 0) >= 4 && watch.msrpUsd <= 5000) {
    score += 3;
    reasons.push("budget discipline");
  }

  if ((profile.comfortPriority ?? 0) >= 4 && watch.caseThicknessMm <= 11.8 && watch.weightFeel === "light") {
    score += 3;
    reasons.push("comfort priority");
  }

  if (profile.brandCachetTolerance === "low" && watch.marketPositioning?.brandCachet !== "status") {
    score += 2;
    reasons.push("lower status signaling");
  } else if (profile.brandCachetTolerance === "high" && watch.marketPositioning?.brandCachet === "status") {
    score += 2;
    reasons.push("brand cachet");
  }

  if (profile.dateWindowPreference === "prefer_no_date" && !watch.dateWindow) {
    score += 1;
    reasons.push("no-date preference");
  } else if (profile.dateWindowPreference === "prefer_date" && watch.dateWindow) {
    score += 1;
    reasons.push("date convenience");
  }

  return {
    watchId: watch.id,
    score,
    reasons
  };
}

export function analyzeWatchDecisionIntent(
  left: WatchSpec,
  right: WatchSpec,
  profile: WatchDecisionIntentProfile | null | undefined
): WatchDecisionIntentAnalysis | null {
  if (!profile) {
    return null;
  }

  const leftMatch = scoreIntentMatch(left, profile);
  const rightMatch = scoreIntentMatch(right, profile);
  const pick = leftMatch.score >= rightMatch.score ? left : right;
  const pickMatch = pick.id === left.id ? leftMatch : rightMatch;
  const activeConstraints = Array.from(new Set([...leftMatch.reasons, ...rightMatch.reasons]));

  return {
    profile,
    leftMatch,
    rightMatch,
    pick: displayName(pick),
    pickId: pick.id,
    summary: `${displayName(pick)} fits the supplied decision intent better because of ${pickMatch.reasons.join(", ") || "the closest overall profile match"}.`,
    activeConstraints
  };
}
