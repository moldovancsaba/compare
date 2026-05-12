import type {
  BuyerRecommendation,
  ComparisonEntity,
  ComparisonVerdict,
  GenericComparisonResult,
  InsightBlock,
  VerdictPick
} from "@/types/comparison";

export interface WatchSpec {
  id: string;
  brand: string;
  model: string;
  reference: string;
  slug: string;
  aliases: string[];
  productUrl: string;
  msrpUsd: number;
  caseDiameterMm: number;
  caseThicknessMm: number;
  lugToLugMm: number;
  lugWidthMm: number;
  waterResistanceM: number;
  movement: string;
  powerReserveHours: number;
  frequencyVph: number;
  bracelet: string;
  microAdjust: boolean;
  dateWindow: boolean;
  lumeProfile: string;
  antiMagneticGauss?: number;
  style: "field" | "explorer" | "dive" | "dress-sport";
  weightFeel: "light" | "balanced" | "substantial";
  notes: string[];
  marketingClaims: string[];
  ownership: {
    dailyExperience: string;
    emotionalCharacter: string;
    serviceReality: string;
    resaleBehaviour: string;
    scratchRisk: string;
    enthusiastBias: string;
    marketingReality: string;
  };
}

export type WatchComparisonEntity = ComparisonEntity & {
  domain: "watches";
  watchId: string;
};

export interface ComparisonResult extends GenericComparisonResult {
  domain: "watches";
  leftEntity: WatchComparisonEntity;
  rightEntity: WatchComparisonEntity;
  left: WatchSpec;
  right: WatchSpec;
}

export type { BuyerRecommendation, ComparisonVerdict, InsightBlock, VerdictPick };

export interface BrainRecommendation {
  buyerType: string;
  pick: string;
  reason: string;
}

export interface BrainComparisonPayload {
  canonicalInputA?: string;
  canonicalInputB?: string;
  whoShouldBuyWhich?: BrainRecommendation[];
  realWorldImpact?: InsightBlock[];
  keyDifferences?: InsightBlock[];
}

export interface BrainConfidenceBundle {
  combined_confidence?: number;
  combinedConfidence?: number;
  disagreement_severity?: number;
  disagreementSeverity?: number;
}

export interface TrinityBrainResult {
  comparison_ref?: string;
  comparisonRef?: string;
  comparison?: BrainComparisonPayload;
  confidence_bundle?: BrainConfidenceBundle;
  confidenceBundle?: BrainConfidenceBundle;
  memory_context?: Record<string, unknown>;
  minority_report?: Record<string, unknown> | null;
  human_escalation?: Record<string, unknown> | null;
  trace_ref?: string | null;
  traceRef?: string | null;
}

export type BrainState =
  | {
      status: "disabled";
      comparisonRef: string;
      message: string;
    }
  | {
      status: "unavailable";
      comparisonRef: string;
      message: string;
    }
  | {
      status: "queued";
      comparisonRef: string;
      jobId: string;
      message: string;
    }
  | {
      status: "running";
      comparisonRef: string;
      jobId: string;
      message: string;
    }
  | {
      status: "failed";
      comparisonRef: string;
      message: string;
    }
  | {
      status: "completed";
      comparisonRef: string;
      result: TrinityBrainResult;
      confidence: BrainConfidenceBundle | null;
      traceRef: string | null;
    };
