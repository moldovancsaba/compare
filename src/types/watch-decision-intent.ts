export type WatchWristSizeBand = "small" | "medium" | "large";
export type WatchPrimaryUseCase = "daily" | "dress" | "sport" | "collection";
export type WatchStylePreference = "understated" | "tool" | "dress_sport" | "no_preference";
export type WatchBrandCachetTolerance = "low" | "medium" | "high";
export type WatchDateWindowPreference = "prefer_no_date" | "prefer_date" | "no_preference";

export interface WatchDecisionIntentProfile {
  wristSizeBand?: WatchWristSizeBand;
  primaryUseCase?: WatchPrimaryUseCase;
  budgetSensitivity?: number;
  stylePreference?: WatchStylePreference;
  comfortPriority?: number;
  brandCachetTolerance?: WatchBrandCachetTolerance;
  dateWindowPreference?: WatchDateWindowPreference;
}

export interface WatchDecisionIntentMatch {
  watchId: string;
  score: number;
  reasons: string[];
}

export interface WatchDecisionIntentAnalysis {
  profile: WatchDecisionIntentProfile;
  leftMatch: WatchDecisionIntentMatch;
  rightMatch: WatchDecisionIntentMatch;
  pick: string;
  pickId: string;
  summary: string;
  activeConstraints: string[];
}
