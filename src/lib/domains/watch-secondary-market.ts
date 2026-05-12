import type { WatchSpec } from "@/types/watch";
import type { WatchSecondaryMarketAnalysis } from "@/types/watch-secondary-market";

const staleAfterDays = 180;

function daysBetween(left: Date, right: Date): number {
  return Math.abs(left.getTime() - right.getTime()) / 86_400_000;
}

function formatPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function analyzeWatchSecondaryMarket(
  watch: WatchSpec,
  options: {
    asOf?: Date;
  } = {}
): WatchSecondaryMarketAnalysis {
  const market = watch.secondaryMarket;

  if (!market) {
    return {
      hasData: false,
      confidence: "low",
      freshness: "unknown",
      retailToMarketRatio: null,
      premiumOrDiscount: "Secondary-market data is missing, so no premium or discount is shown.",
      liquidityNote: "Liquidity is unknown without a curated market snapshot.",
      trendNote: "Trend is unknown without dated market data.",
      sourceLabel: null,
      sourceUrl: null,
      warnings: ["Secondary-market snapshot is missing for this watch."]
    };
  }

  const asOf = options.asOf ?? new Date();
  const marketDate = new Date(`${market.marketPriceDate}T00:00:00.000Z`);
  const freshness = daysBetween(asOf, marketDate) > staleAfterDays ? "dated" : "current";
  const ratio = market.estimatedMarketPriceUsd / watch.msrpUsd;
  const deltaPercent = (ratio - 1) * 100;
  const premiumOrDiscount =
    Math.abs(deltaPercent) < 3
      ? "trades close to retail in this curated snapshot"
      : deltaPercent > 0
        ? `trades at an estimated ${formatPercent(deltaPercent)} premium to retail`
        : `trades at an estimated ${formatPercent(deltaPercent)} discount to retail`;
  const liquidityNote =
    market.liquidityTier === "high"
      ? "High liquidity means exit risk is lower, but not guaranteed."
      : market.liquidityTier === "medium"
        ? "Medium liquidity means condition, configuration, and pricing patience matter."
        : "Low liquidity means resale timing and buyer depth are material ownership risks.";
  const warnings = freshness === "dated" ? ["Secondary-market snapshot is stale; verify current pricing before relying on it."] : [];

  return {
    hasData: true,
    confidence: freshness === "dated" ? "low" : market.confidence,
    freshness,
    retailToMarketRatio: Number(ratio.toFixed(2)),
    premiumOrDiscount,
    liquidityNote,
    trendNote: `One-year curated trend is ${formatPercent(market.oneYearTrendPercent)}.`,
    sourceLabel: market.sourceLabel,
    sourceUrl: market.sourceUrl,
    warnings
  };
}
