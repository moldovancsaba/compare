import { describe, expect, it } from "vitest";

import {
  createMonitoredIntentEntry,
  evaluateMonitoredIntent
} from "@/lib/services/monitored-intents";
import { compareInputs } from "@/lib/services/compare";

describe("monitored intents", () => {
  it("creates a local monitoring entry from a watch comparison result", () => {
    const comparisonResult = compareInputs({
      domain: "watches",
      leftInput: "Rolex Air-King",
      rightInput: "Rolex Explorer"
    });

    expect(comparisonResult.status).toBe("completed");

    if (comparisonResult.status !== "completed") {
      throw new Error("Expected watch comparison fixture to resolve.");
    }

    const entry = createMonitoredIntentEntry(comparisonResult.comparison, "/compare/air-king-vs-explorer");

    expect(entry).toMatchObject({
      domain: "watches",
      leftWatchId: "rolex-air-king-126900",
      rightWatchId: "rolex-explorer-124270",
      strongerChoice: "Rolex Explorer"
    });
  });

  it("surfaces deterministic price and spec revisions against a saved snapshot", () => {
    const comparisonResult = compareInputs({
      domain: "watches",
      leftInput: "Rolex Air-King",
      rightInput: "Rolex Explorer"
    });

    expect(comparisonResult.status).toBe("completed");

    if (comparisonResult.status !== "completed") {
      throw new Error("Expected watch comparison fixture to resolve.");
    }

    const entry = createMonitoredIntentEntry(comparisonResult.comparison, null);

    if (!entry) {
      throw new Error("Expected monitoring entry.");
    }

    entry.snapshot.left.msrpUsd = 7100;
    entry.snapshot.left.marketPriceUsd = 6400;
    entry.snapshot.left.powerReserveHours = 60;

    const changes = evaluateMonitoredIntent(entry);

    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "price_delta",
          watchLabel: "Rolex Air-King"
        }),
        expect.objectContaining({
          kind: "spec_revision",
          watchLabel: "Rolex Air-King"
        })
      ])
    );
  });
});
