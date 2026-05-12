import type { EvidenceConfidence, EvidenceFreshness } from "@/types/comparison";

export interface OwnershipCostRange {
  low: number;
  high: number;
  label: string;
}

export interface WatchOwnershipSimulation {
  horizonYears: 5;
  serviceIntervalYears: string;
  estimatedServiceCostUsd: OwnershipCostRange;
  durabilityRisk: "low" | "medium" | "high";
  exitLiquidity: "soft" | "stable" | "strong";
  frictionLevel: "low" | "medium" | "high";
  confidence: EvidenceConfidence;
  freshness: EvidenceFreshness;
  assumptions: string[];
  warnings: string[];
}
