import { watchCatalog } from "@/lib/data/watch-catalog";
import {
  analyzeWatchCollectionGaps,
  analyzeWatchUpgradePath,
  collectionStatusFor
} from "@/lib/domains/watch-collection";
import { buildWatchConsequenceProfile } from "@/lib/domains/watch-consequences";
import { watchDisplayName } from "@/lib/domains/watch-entity";
import type { WatchSpec } from "@/types/watch";
import type { WatchCollectionProfile } from "@/types/watch-collection";
import type { WatchPurchaseReport, WatchPurchaseVerdict } from "@/types/watch-purchase";

function ownedWatches(profile: WatchCollectionProfile | null | undefined): WatchSpec[] {
  if (!profile) {
    return [];
  }

  const ownedIds = new Set(profile.items.filter((item) => item.status === "owned").map((item) => item.watchId));
  return watchCatalog.filter((watch) => ownedIds.has(watch.id));
}

function dailyFitScore(watch: WatchSpec): number {
  let score = 0;

  if (watch.caseDiameterMm <= 39) {
    score += 2;
  }

  if (watch.caseThicknessMm <= 11.8) {
    score += 2;
  }

  if (watch.microAdjust) {
    score += 2;
  }

  if (watch.powerReserveHours >= 70) {
    score += 1;
  }

  if (watch.ownershipProfile?.comfort === "compact") {
    score += 2;
  } else if (watch.ownershipProfile?.comfort === "balanced") {
    score += 1;
  }

  return score;
}

function valueRisk(watch: WatchSpec): number {
  let risk = watch.msrpUsd / 3000;

  if (watch.ownershipProfile?.resaleStability === "strong") {
    risk -= 2;
  } else if (watch.ownershipProfile?.resaleStability === "soft") {
    risk += 2;
  }

  if (watch.ownershipProfile?.serviceExpectation === "high") {
    risk += 1;
  }

  return risk;
}

function closestOverlap(candidate: WatchSpec, owned: WatchSpec[]): WatchSpec | null {
  return (
    owned
      .filter((watch) => watch.id !== candidate.id)
      .map((watch) => ({
        watch,
        score:
          (watch.style === candidate.style ? 5 : 0) +
          (watch.brand === candidate.brand ? 2 : 0) +
          (Math.abs(watch.caseDiameterMm - candidate.caseDiameterMm) <= 2 ? 2 : 0) +
          (watch.dateWindow === candidate.dateWindow ? 1 : 0)
      }))
      .sort((a, b) => b.score - a.score)[0]?.watch ?? null
  );
}

function alternativesFor(candidate: WatchSpec, profile: WatchCollectionProfile | null | undefined): WatchPurchaseReport["alternatives"] {
  const ownedIds = new Set(profile?.items.filter((item) => item.status === "owned").map((item) => item.watchId) ?? []);

  return watchCatalog
    .filter((watch) => watch.id !== candidate.id && !ownedIds.has(watch.id))
    .map((watch) => ({
      watch,
      score:
        (watch.style !== candidate.style ? 2 : 0) +
        (watch.msrpUsd < candidate.msrpUsd ? 2 : 0) +
        dailyFitScore(watch) -
        valueRisk(watch)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ watch }) => ({
      watchId: watch.id,
      reason: `${watchDisplayName(watch)} is a stronger alternative if you want ${
        watch.style !== candidate.style ? "a different collection role" : "similar appeal"
      } with ${watch.msrpUsd < candidate.msrpUsd ? "less price pressure" : "a cleaner ownership fit"}.`
    }));
}

export function shouldBuyWatch(
  candidate: WatchSpec,
  profile?: WatchCollectionProfile | null
): WatchPurchaseReport {
  const owned = ownedWatches(profile);
  const status = collectionStatusFor(profile, candidate);
  const closestOwned = closestOverlap(candidate, owned);
  const upgradeVerdict = profile ? analyzeWatchUpgradePath(candidate, profile) : null;
  const gapInsights = profile ? analyzeWatchCollectionGaps(profile) : [];
  const fillsGap = gapInsights.some((insight) => insight.traits.includes(`missing-style:${candidate.style}`));
  const consequence = buildWatchConsequenceProfile(candidate);
  const risk = valueRisk(candidate);
  const fitScore = dailyFitScore(candidate);
  let verdict: WatchPurchaseVerdict = "consider";

  if (status === "owned") {
    verdict = "skip";
  } else if (upgradeVerdict?.classification === "poor_value") {
    verdict = "skip";
  } else if (upgradeVerdict?.classification === "lateral" && !fillsGap) {
    verdict = "consider";
  } else if ((fillsGap || fitScore >= 7) && risk <= 3.5) {
    verdict = "buy";
  }

  const headline =
    verdict === "buy"
      ? `${watchDisplayName(candidate)} is a defensible buy.`
      : verdict === "skip"
        ? `Skip ${watchDisplayName(candidate)} for now.`
        : `Consider ${watchDisplayName(candidate)}, but do not treat it as automatic.`;

  const profileInfluence = profile
    ? `${profile.items.length} saved collection items and ${profile.preferredBrands.length} preferred brands influenced this report.`
    : null;

  return {
    candidateWatchId: candidate.id,
    verdict,
    headline,
    rationale:
      verdict === "buy"
        ? "The candidate improves purchase confidence through useful fit, role, or ownership signals without obvious collection redundancy."
        : verdict === "skip"
          ? "The candidate has too much overlap, weak upgrade logic, or already exists in the saved profile."
          : "The candidate has a real case, but collection context, value risk, or ownership fit should be checked before buying.",
    valueAssessment:
      risk <= 3
        ? `${watchDisplayName(candidate)} has a reasonable value case for its practical ownership profile.`
        : `${watchDisplayName(candidate)} needs a clear personal reason because price, service burden, or resale assumptions raise the regret risk.`,
    overlapAnalysis: closestOwned
      ? `${watchDisplayName(candidate)} overlaps most with ${watchDisplayName(closestOwned)} in the saved collection. ${upgradeVerdict?.summary ?? "Treat the decision as a rotation-fit question, not a pure spec upgrade."}`
      : `${watchDisplayName(candidate)} does not overlap with an owned watch in the saved profile, so the decision is mostly about fit, value, and taste.`,
    emotionalFit: `${candidate.ownership.emotionalCharacter} ${profile?.preferredBrands.includes(candidate.brand) ? "It also matches a saved brand preference." : "Make sure that character is what you want after the first week."}`,
    ownershipRisk: `${candidate.ownership.serviceReality} ${candidate.ownership.scratchRisk} ${consequence.serviceFriction}.`,
    alternatives: verdict === "buy" ? [] : alternativesFor(candidate, profile),
    profileInfluence
  };
}
