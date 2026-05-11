import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db";
import { ComparisonFeedbackModel } from "@/lib/models/comparison-brain";

const feedbackSchema = z.object({
  comparisonRef: z.string().trim().min(8),
  leftWatchId: z.string().trim().min(2),
  rightWatchId: z.string().trim().min(2),
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
      leftWatchId: payload.leftWatchId,
      rightWatchId: payload.rightWatchId,
      traceRef: payload.traceRef ?? null,
      signal: payload.signal,
      note: payload.note || null,
      source: "comparison_result",
      processedByTrinity: false,
      processingStatus: "pending"
    });

    return NextResponse.json({
      feedback: {
        status: "recorded",
        message: "Feedback saved for Trinity learning."
      }
    });
  } catch {
    return NextResponse.json(
      {
        error: "The feedback payload was invalid."
      },
      { status: 400 }
    );
  }
}
