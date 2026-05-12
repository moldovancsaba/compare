import type { WatchSpec } from "@/types/watch";

export interface WatchConsequenceProfile {
  wristPresence: string;
  cuffFit: string;
  wristSizeSensitivity: string;
  serviceFriction: string;
  versatility: string;
  travelReadiness: string;
}

export function buildWatchConsequenceProfile(watch: WatchSpec): WatchConsequenceProfile {
  const wristPresence =
    watch.caseDiameterMm <= 37 && watch.lugToLugMm <= 45
      ? "compact and forgiving on smaller wrists"
      : watch.caseDiameterMm <= 39 && watch.lugToLugMm <= 47
        ? "balanced for most wrists without obvious bulk"
        : "noticeably present, especially on sub-17cm wrists";

  const cuffFit =
    watch.caseThicknessMm <= 11.6
      ? "slides under cuffs with little drama"
      : watch.caseThicknessMm <= 12
        ? "usually clears casual cuffs but can feel present under tighter sleeves"
        : "will sit proud enough to matter with fitted cuffs";

  const wristSizeSensitivity =
    watch.lugToLugMm <= 45
      ? "low wrist-size sensitivity"
      : watch.lugToLugMm <= 47
        ? "moderate wrist-size sensitivity"
        : "high wrist-size sensitivity";

  const serviceFriction = (() => {
    switch (watch.ownershipProfile?.serviceExpectation) {
      case "low":
        return "lower service-budget anxiety than most luxury mechanical options";
      case "medium":
        return "normal mechanical-watch service budgeting still matters";
      case "high":
        return "service access is strong, but long-term cost expectations remain luxury-grade";
      default:
        return "service burden is lower confidence because structured service metadata is missing";
    }
  })();

  const versatility =
    watch.style === "explorer" || watch.style === "dress-sport"
      ? "high versatility across office, travel, and casual wear"
      : watch.style === "field"
        ? "versatile mechanically, but visually more casual and expressive"
        : "sport-first versatility that works best when casual use dominates";

  const travelReadiness =
    watch.powerReserveHours >= 70 && watch.waterResistanceM >= 100
      ? "easy travel companion with enough reserve and water confidence for normal trips"
      : watch.powerReserveHours >= 55 && watch.waterResistanceM >= 100
        ? "travel-capable, though shorter no-wear windows make rotation less forgiving"
        : "less forgiving for travel and rotation than the headline specs may suggest";

  return {
    wristPresence,
    cuffFit,
    wristSizeSensitivity,
    serviceFriction,
    versatility,
    travelReadiness
  };
}
