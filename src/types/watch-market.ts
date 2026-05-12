import type { EvidenceConfidence } from "@/types/comparison";

export type WatchMarketLevel = "low" | "moderate" | "high";

export interface WatchMarketPositioningProfile {
  hypeLevel: WatchMarketLevel;
  collectorRespect: "niche" | "solid" | "strong";
  marketSaturation: WatchMarketLevel;
  brandCachet: "quiet" | "recognized" | "status";
  substanceSignals: string[];
  cautionSignals: string[];
  positioningSummary: string;
}

export interface WatchMarketPositioningAnalysis {
  confidence: EvidenceConfidence;
  hypeVsSubstance: string;
  collectorReputation: string;
  liquidityContext: string;
  positioningSummary: string;
  warnings: string[];
}
