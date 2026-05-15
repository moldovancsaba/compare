import { formatHours } from "@/lib/utils/format";
import type { WatchSpec } from "@/types/watch";

export function pickStyleMeaning(style: WatchSpec["style"]): string {
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

export function ownershipCharacter(watch: WatchSpec): string {
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

export function ownershipProfileSummary(watch: WatchSpec): string {
  const profile = watch.ownershipProfile;

  if (!profile) {
    return "Structured ownership metadata is incomplete, so this claim stays lower confidence.";
  }

  return `Structured profile: ${profile.comfort} comfort, ${profile.serviceExpectation} service burden, ${profile.durability} durability, ${profile.resaleStability} resale stability, ${profile.braceletQuality} bracelet quality, and ${profile.strapVersatility} strap versatility.`;
}

export function movementSummary(watch: WatchSpec): string {
  const accuracy = watch.accuracyClaimSecondsPerDay ? ` Accuracy claim: ${watch.accuracyClaimSecondsPerDay}.` : "";
  const family = watch.movementFamily ? ` Movement family: ${watch.movementFamily}.` : "";

  return `${watch.movement} with ${formatHours(watch.powerReserveHours)} reserve.${family}${accuracy}`;
}
