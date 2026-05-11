import { NextResponse } from "next/server";
import { z } from "zod";

import { logWarn } from "@/lib/observability/logger";
import { recordTelemetryEvent } from "@/lib/observability/telemetry";
import { getTrinityBrainState } from "@/lib/services/brain-queue";

const querySchema = z.object({
  comparisonRef: z.string().trim().min(8)
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    comparisonRef: url.searchParams.get("comparisonRef")
  });

  if (!parsed.success) {
    logWarn("brain.invalid_poll_request", {
      error: parsed.error
    });
    await recordTelemetryEvent({
      event: "brain.invalid_poll_request",
      status: "rejected",
      reason: "invalid_request"
    });

    return NextResponse.json(
      {
        error: "A valid comparisonRef is required."
      },
      { status: 400 }
    );
  }

  const brain = await getTrinityBrainState(parsed.data.comparisonRef);
  await recordTelemetryEvent({
    event: "brain.poll",
    comparisonRef: parsed.data.comparisonRef,
    status: brain.status,
    properties: {
      brainStatus: brain.status,
      traceAttached: "traceRef" in brain && Boolean(brain.traceRef)
    }
  });

  return NextResponse.json({ brain });
}
