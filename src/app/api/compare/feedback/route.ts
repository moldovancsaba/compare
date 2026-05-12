import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db";
import { ComparisonFeedbackModel } from "@/lib/models/comparison-brain";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { recordTelemetryEvent } from "@/lib/observability/telemetry";

const feedbackSchema = z.object({
  comparisonRef: z.string().trim().min(8),
  leftEntityId: z.string().trim().min(2),
  rightEntityId: z.string().trim().min(2),
  leftDomain: z.string().trim().min(2),
  rightDomain: z.string().trim().min(2),
  leftWatchId: z.string().trim().min(2).optional(),
  rightWatchId: z.string().trim().min(2).optional(),
  traceRef: z.string().trim().min(1).nullable().optional(),
  signal: z.enum([
    "helpful",
    "not_helpful",
    "chose_left",
    "chose_right",
    "opposite_preferred",
    "bad_recommendation",
    "missing_context",
    "wrong_spec"
  ]),
  note: z.string().trim().max(1000).optional()
});

export async function POST(request: Request) {
  try {
    const payload = feedbackSchema.parse(await request.json());
    const connection = await connectToDatabase();

    if (!connection) {
      logWarn("feedback.persistence_unavailable", {
        comparisonRef: payload.comparisonRef,
        signal: payload.signal
      });
      await recordTelemetryEvent({
        event: "feedback.persistence_unavailable",
        comparisonRef: payload.comparisonRef,
        leftWatchId: payload.leftDomain === "watches" ? payload.leftEntityId : payload.leftWatchId,
        rightWatchId: payload.rightDomain === "watches" ? payload.rightEntityId : payload.rightWatchId,
        status: "unavailable",
        reason: "missing_database_connection",
        properties: {
          feedbackSignal: payload.signal,
          hasNote: Boolean(payload.note),
          traceAttached: Boolean(payload.traceRef)
        }
      });

      return NextResponse.json(
        {
          feedback: {
            status: "unavailable",
            message: "Feedback needs MongoDB Atlas before it can be stored."
          }
        },
        { status: 202 }
      );
    }

    await ComparisonFeedbackModel.create({
      comparisonRef: payload.comparisonRef,
      leftWatchId: payload.leftDomain === "watches" ? payload.leftEntityId : payload.leftWatchId ?? null,
      rightWatchId: payload.rightDomain === "watches" ? payload.rightEntityId : payload.rightWatchId ?? null,
      leftEntityId: payload.leftEntityId,
      rightEntityId: payload.rightEntityId,
      leftDomain: payload.leftDomain,
      rightDomain: payload.rightDomain,
      traceRef: payload.traceRef ?? null,
      signal: payload.signal,
      note: payload.note || null,
      source: "comparison_result",
      processedByTrinity: false,
      processingStatus: "pending"
    });

    logInfo("feedback.recorded", {
      comparisonRef: payload.comparisonRef,
      signal: payload.signal,
      hasNote: Boolean(payload.note)
    });
    await recordTelemetryEvent({
      event: "feedback.recorded",
      comparisonRef: payload.comparisonRef,
      leftWatchId: payload.leftDomain === "watches" ? payload.leftEntityId : payload.leftWatchId,
      rightWatchId: payload.rightDomain === "watches" ? payload.rightEntityId : payload.rightWatchId,
      status: "recorded",
      properties: {
        feedbackSignal: payload.signal,
        hasNote: Boolean(payload.note),
        traceAttached: Boolean(payload.traceRef)
      }
    });

    return NextResponse.json({
      feedback: {
        status: "recorded",
        message: "Feedback saved for Trinity learning."
      }
    });
  } catch (error) {
    logWarn("feedback.invalid_request", {
      error
    });
    await recordTelemetryEvent({
      event: "feedback.invalid_request",
      status: "rejected",
      reason: "invalid_request"
    });

    return NextResponse.json(
      {
        error: "The feedback payload was invalid."
      },
      { status: 400 }
    );
  }
}
