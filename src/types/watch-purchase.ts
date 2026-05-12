import type { WatchOwnershipSimulation } from "@/types/watch-ownership";
import type { WatchMarketPositioningAnalysis, WatchMarketingRealityAnalysis } from "@/types/watch-market";

export type WatchPurchaseVerdict = "buy" | "consider" | "skip";

export interface WatchPurchaseReport {
  candidateWatchId: string;
  verdict: WatchPurchaseVerdict;
  headline: string;
  rationale: string;
  valueAssessment: string;
  overlapAnalysis: string;
  emotionalFit: string;
  ownershipRisk: string;
  ownershipSimulation: WatchOwnershipSimulation;
  marketPositioning: WatchMarketPositioningAnalysis;
  marketingReality: WatchMarketingRealityAnalysis;
  alternatives: Array<{
    watchId: string;
    reason: string;
  }>;
  profileInfluence: string | null;
}
