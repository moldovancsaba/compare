import type { EvidenceConfidence, EvidenceFreshness } from "@/types/comparison";

export interface WatchSecondaryMarketAnalysis {
  hasData: boolean;
  confidence: EvidenceConfidence;
  freshness: EvidenceFreshness;
  retailToMarketRatio: number | null;
  premiumOrDiscount: string;
  liquidityNote: string;
  trendNote: string;
  sourceLabel: string | null;
  sourceUrl: string | null;
  warnings: string[];
}
