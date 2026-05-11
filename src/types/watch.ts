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
}

export interface InsightBlock {
  title: string;
  summary: string;
}

export interface BuyerRecommendation {
  buyerType: string;
  pick: string;
  reason: string;
}

export interface ComparisonResult {
  canonicalInputA: string;
  canonicalInputB: string;
  left: WatchSpec;
  right: WatchSpec;
  keyDifferences: InsightBlock[];
  realWorldImpact: InsightBlock[];
  whoShouldBuyWhich: BuyerRecommendation[];
  overpricedFeatures: InsightBlock[];
  hiddenDownsides: InsightBlock[];
  betterValueAlternative: InsightBlock[];
  signalVsFluff: InsightBlock[];
}
