import type { WatchSpec } from "@/types/watch";
import type { WatchOwnershipSimulation } from "@/types/watch-ownership";

const staleAfterDays = 180;

function daysBetween(left: Date, right: Date): number {
  return Math.abs(left.getTime() - right.getTime()) / 86_400_000;
}

function serviceCostFor(expectation: NonNullable<WatchSpec["ownershipProfile"]>["serviceExpectation"] | undefined) {
  switch (expectation) {
    case "low":
      return { low: 400, high: 700, label: "$400-$700" };
    case "medium":
      return { low: 600, high: 1_000, label: "$600-$1,000" };
    case "high":
      return { low: 900, high: 1_500, label: "$900-$1,500" };
    default:
      return { low: 600, high: 1_500, label: "$600-$1,500" };
  }
}

function serviceIntervalFor(expectation: NonNullable<WatchSpec["ownershipProfile"]>["serviceExpectation"] | undefined): string {
  switch (expectation) {
    case "low":
      return "7-10";
    case "medium":
      return "6-9";
    case "high":
      return "5-8";
    default:
      return "5-10";
  }
}

function durabilityRiskFor(durability: NonNullable<WatchSpec["ownershipProfile"]>["durability"] | undefined) {
  switch (durability) {
    case "tool":
      return "low";
    case "everyday":
      return "medium";
    case "dress":
    default:
      return "high";
  }
}

function frictionFor(watch: WatchSpec): WatchOwnershipSimulation["frictionLevel"] {
  if (!watch.ownershipProfile) {
    return "high";
  }

  if (watch.ownershipProfile.serviceExpectation === "high" || watch.ownershipProfile.resaleStability === "soft") {
    return "high";
  }

  if (!watch.microAdjust || watch.caseThicknessMm >= 12) {
    return "medium";
  }

  return "low";
}

export function simulateWatchOwnership(
  watch: WatchSpec,
  options: {
    asOf?: Date;
    lastReviewed?: Date;
  } = {}
): WatchOwnershipSimulation {
  const asOf = options.asOf ?? new Date();
  const profile = watch.ownershipProfile;
  const warnings: string[] = [];
  const assumptions = [
    "Uses curated ownership metadata, not live dealer listings, invoices, insurance quotes, or tax calculations.",
    "Five-year horizon assumes normal enthusiast use and one conservative service-planning window.",
    "Ranges are intentionally broad to avoid false precision."
  ];

  let freshness: WatchOwnershipSimulation["freshness"] = "unknown";

  if (options.lastReviewed) {
    freshness = daysBetween(asOf, options.lastReviewed) > staleAfterDays ? "dated" : "current";
  }

  if (!profile) {
    warnings.push("Structured ownership profile is missing, so service, durability, resale, and friction estimates are low confidence.");
  }

  if (freshness === "dated") {
    warnings.push("The ownership metadata review date is stale; verify service and resale assumptions before relying on this report.");
  }

  if (freshness === "unknown") {
    warnings.push("Catalog freshness is unknown because this watch row does not carry a reviewed-at timestamp.");
  }

  return {
    horizonYears: 5,
    serviceIntervalYears: serviceIntervalFor(profile?.serviceExpectation),
    estimatedServiceCostUsd: serviceCostFor(profile?.serviceExpectation),
    durabilityRisk: durabilityRiskFor(profile?.durability),
    exitLiquidity: profile?.resaleStability ?? "soft",
    frictionLevel: frictionFor(watch),
    confidence: profile && freshness !== "dated" ? "medium" : "low",
    freshness,
    assumptions,
    warnings
  };
}
