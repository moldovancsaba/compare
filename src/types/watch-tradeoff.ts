export interface WatchTradeoffScenario {
  budgetSensitivity: number;
  wristComfort: number;
  dressVersatility: number;
  resaleImportance: number;
  ruggedness: number;
  brandNeutrality: number;
}

export interface WatchTradeoffScoreBreakdown {
  budget: number;
  comfort: number;
  versatility: number;
  resale: number;
  ruggedness: number;
  brandFit: number;
}

export interface WatchTradeoffSimulation {
  scenario: WatchTradeoffScenario;
  pick: string;
  pickId: string;
  changedFromBaseline: boolean;
  baselinePick: string;
  summary: string;
  changedSections: string[];
  leftScore: number;
  rightScore: number;
  leftBreakdown: WatchTradeoffScoreBreakdown;
  rightBreakdown: WatchTradeoffScoreBreakdown;
}
