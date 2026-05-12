export interface WatchValueScoreBreakdown {
  comfort: number;
  capability: number;
  versatility: number;
  ownership: number;
  priceDiscipline: number;
}

export interface WatchValueScore {
  total: number;
  label: "weak" | "fair" | "strong";
  breakdown: WatchValueScoreBreakdown;
  explanation: string;
}
