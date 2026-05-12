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
  alternatives: Array<{
    watchId: string;
    reason: string;
  }>;
  profileInfluence: string | null;
}
