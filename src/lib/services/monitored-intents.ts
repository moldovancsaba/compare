import { watchCatalog } from "@/lib/data/watch-catalog";
import type { GenericComparisonResult } from "@/types/comparison";
import type { WatchSpec } from "@/types/watch";

export type MonitoredIntentEntry = {
  id: string;
  domain: "watches";
  leftWatchId: string;
  rightWatchId: string;
  leftLabel: string;
  rightLabel: string;
  strongerChoice: string;
  summary: string;
  savedComparisonPath: string | null;
  savedAt: string;
  snapshot: {
    left: MonitoredWatchSnapshot;
    right: MonitoredWatchSnapshot;
  };
};

type MonitoredWatchSnapshot = {
  watchId: string;
  msrpUsd: number;
  marketPriceUsd: number | null;
  marketPriceDate: string | null;
  waterResistanceM: number;
  powerReserveHours: number;
  caseDiameterMm: number;
  movement: string;
};

export type MonitoredIntentChange = {
  kind: "price_delta" | "spec_revision";
  watchLabel: string;
  summary: string;
};

export function createMonitoredIntentEntry(
  result: GenericComparisonResult,
  savedComparisonPath: string | null
): MonitoredIntentEntry | null {
  if (result.domain !== "watches") {
    return null;
  }

  const left = watchCatalog.find((watch) => watch.id === result.leftEntity.id);
  const right = watchCatalog.find((watch) => watch.id === result.rightEntity.id);

  if (!left || !right) {
    return null;
  }

  return {
    id: `${left.id}:vs:${right.id}`,
    domain: "watches",
    leftWatchId: left.id,
    rightWatchId: right.id,
    leftLabel: result.leftEntity.label,
    rightLabel: result.rightEntity.label,
    strongerChoice: result.verdict.strongerChoice,
    summary: result.verdict.summary,
    savedComparisonPath,
    savedAt: new Date().toISOString(),
    snapshot: {
      left: buildWatchSnapshot(left),
      right: buildWatchSnapshot(right)
    }
  };
}

export function evaluateMonitoredIntent(entry: MonitoredIntentEntry): MonitoredIntentChange[] {
  const left = watchCatalog.find((watch) => watch.id === entry.leftWatchId);
  const right = watchCatalog.find((watch) => watch.id === entry.rightWatchId);

  if (!left || !right) {
    return [
      {
        kind: "spec_revision",
        watchLabel: `${entry.leftLabel} vs ${entry.rightLabel}`,
        summary: "A monitored watch is no longer present in the current catalog, so this saved intent needs review."
      }
    ];
  }

  return [...compareWatchSnapshot(entry.leftLabel, entry.snapshot.left, left), ...compareWatchSnapshot(entry.rightLabel, entry.snapshot.right, right)];
}

function buildWatchSnapshot(watch: WatchSpec): MonitoredWatchSnapshot {
  return {
    watchId: watch.id,
    msrpUsd: watch.msrpUsd,
    marketPriceUsd: watch.secondaryMarket?.estimatedMarketPriceUsd ?? null,
    marketPriceDate: watch.secondaryMarket?.marketPriceDate ?? null,
    waterResistanceM: watch.waterResistanceM,
    powerReserveHours: watch.powerReserveHours,
    caseDiameterMm: watch.caseDiameterMm,
    movement: watch.movement
  };
}

function compareWatchSnapshot(
  label: string,
  snapshot: MonitoredWatchSnapshot,
  current: WatchSpec
): MonitoredIntentChange[] {
  const changes: MonitoredIntentChange[] = [];

  if (snapshot.msrpUsd !== current.msrpUsd) {
    changes.push({
      kind: "price_delta",
      watchLabel: label,
      summary: `Retail price moved from $${snapshot.msrpUsd.toLocaleString()} to $${current.msrpUsd.toLocaleString()}, which may change the original value judgment.`
    });
  }

  if ((snapshot.marketPriceUsd ?? null) !== (current.secondaryMarket?.estimatedMarketPriceUsd ?? null)) {
    changes.push({
      kind: "price_delta",
      watchLabel: label,
      summary: `Curated secondary-market price moved from ${snapshot.marketPriceUsd ? `$${snapshot.marketPriceUsd.toLocaleString()}` : "unknown"} to ${current.secondaryMarket?.estimatedMarketPriceUsd ? `$${current.secondaryMarket.estimatedMarketPriceUsd.toLocaleString()}` : "unknown"}, which may change the regret or liquidity story.`
    });
  }

  if (
    snapshot.waterResistanceM !== current.waterResistanceM ||
    snapshot.powerReserveHours !== current.powerReserveHours ||
    snapshot.caseDiameterMm !== current.caseDiameterMm ||
    snapshot.movement !== current.movement
  ) {
    changes.push({
      kind: "spec_revision",
      watchLabel: label,
      summary: `Curated specs changed since this intent was saved. Current core snapshot is ${current.waterResistanceM}m water resistance, ${current.powerReserveHours}h reserve, ${current.caseDiameterMm}mm case, and ${current.movement}.`
    });
  }

  return changes;
}
