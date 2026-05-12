import { connectToDatabase } from "@/lib/db";
import { AnalyticsEventModel } from "@/lib/models/comparison-brain";
import { logWarn } from "@/lib/observability/logger";

type TelemetryProperties = Record<string, string | number | boolean | null | undefined>;

export type TelemetryEventInput = {
  event: string;
  comparisonRef?: string | null;
  leftWatchId?: string | null;
  rightWatchId?: string | null;
  clientKeyHash?: string | null;
  status?: string | null;
  reason?: string | null;
  properties?: TelemetryProperties;
};

const allowedPropertyKeys = new Set([
  "brainStatus",
  "comparisonPersisted",
  "feedbackSignal",
  "hasNote",
  "leftResolved",
  "rightResolved",
  "remainingRequests",
  "resetAt",
  "traceAttached"
]);

export function sanitizeTelemetryProperties(properties: TelemetryProperties = {}): TelemetryProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => allowedPropertyKeys.has(key) && isTelemetryScalar(value))
  );
}

export async function recordTelemetryEvent(input: TelemetryEventInput): Promise<boolean> {
  try {
    const connection = await connectToDatabase();
    if (!connection) {
      return false;
    }

    await AnalyticsEventModel.create({
      event: input.event,
      comparisonRef: input.comparisonRef ?? null,
      leftWatchId: input.leftWatchId ?? null,
      rightWatchId: input.rightWatchId ?? null,
      clientKeyHash: input.clientKeyHash ?? null,
      status: input.status ?? null,
      reason: input.reason ?? null,
      properties: sanitizeTelemetryProperties(input.properties)
    });

    return true;
  } catch (error) {
    logWarn("telemetry.record_failed", {
      event: input.event,
      comparisonRef: input.comparisonRef,
      error
    });

    return false;
  }
}

function isTelemetryScalar(value: unknown): value is string | number | boolean | null {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}
