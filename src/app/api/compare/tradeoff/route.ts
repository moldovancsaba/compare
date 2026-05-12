import { NextResponse } from "next/server";
import { z } from "zod";

import { hashLogValue } from "@/lib/observability/logger";
import { recordTelemetryEvent } from "@/lib/observability/telemetry";
import { resolveClientKey } from "@/lib/security/rate-limit";

const tradeoffSchema = z.object({
  comparisonRef: z.string().trim().min(6).max(240),
  leftEntityId: z.string().trim().min(1).max(120),
  rightEntityId: z.string().trim().min(1).max(120),
  scenarioPickId: z.string().trim().min(1).max(120),
  scenarioChangedPick: z.boolean(),
  scenario: z.object({
    budgetSensitivity: z.number().int().min(0).max(5),
    wristComfort: z.number().int().min(0).max(5),
    dressVersatility: z.number().int().min(0).max(5),
    resaleImportance: z.number().int().min(0).max(5),
    ruggedness: z.number().int().min(0).max(5),
    brandNeutrality: z.number().int().min(0).max(5)
  })
});

export async function POST(request: Request) {
  try {
    const body = tradeoffSchema.parse(await request.json());

    await recordTelemetryEvent({
      event: "compare.tradeoff_changed",
      comparisonRef: body.comparisonRef,
      leftWatchId: body.leftEntityId,
      rightWatchId: body.rightEntityId,
      clientKeyHash: hashLogValue(resolveClientKey(request)),
      status: "recorded",
      properties: {
        scenarioBudgetSensitivity: body.scenario.budgetSensitivity,
        scenarioWristComfort: body.scenario.wristComfort,
        scenarioDressVersatility: body.scenario.dressVersatility,
        scenarioResaleImportance: body.scenario.resaleImportance,
        scenarioRuggedness: body.scenario.ruggedness,
        scenarioBrandNeutrality: body.scenario.brandNeutrality,
        scenarioPickId: body.scenarioPickId,
        scenarioChangedPick: body.scenarioChangedPick
      }
    });

    return NextResponse.json({
      tradeoff: {
        status: "recorded"
      }
    });
  } catch {
    return NextResponse.json(
      {
        error: "The tradeoff scenario payload was invalid."
      },
      { status: 400 }
    );
  }
}
