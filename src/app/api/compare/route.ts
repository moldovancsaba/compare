import { NextResponse } from "next/server";
import { z } from "zod";

import { enqueueTrinityCompareJob } from "@/lib/services/brain-queue";
import { hashLogValue, logWarn } from "@/lib/observability/logger";
import { recordTelemetryEvent } from "@/lib/observability/telemetry";
import { checkRateLimit, resolveClientKey } from "@/lib/security/rate-limit";
import { compareWatches } from "@/lib/services/compare-watches";
import { persistSubmittedComparison } from "@/lib/services/saved-comparisons";
import { resolveWatch } from "@/lib/utils/resolve-watch";

const requestSchema = z.object({
  leftInput: z.string().trim().min(2),
  rightInput: z.string().trim().min(2)
});

export async function POST(request: Request) {
  const clientKey = resolveClientKey(request);
  const clientKeyHash = hashLogValue(clientKey);
  const rateLimit = checkRateLimit(clientKey);

  if (rateLimit.limited) {
    logWarn("compare.rate_limited", {
      clientKeyHash,
      resetAt: new Date(rateLimit.resetAt).toISOString()
    });
    await recordTelemetryEvent({
      event: "compare.rate_limited",
      clientKeyHash,
      status: "blocked",
      reason: "rate_limited",
      properties: {
        resetAt: new Date(rateLimit.resetAt).toISOString()
      }
    });

    return NextResponse.json(
      {
        error: "Too many comparison requests. Wait a moment and try again."
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000)))
        }
      }
    );
  }

  try {
    const body = await request.json();
    const { leftInput, rightInput } = requestSchema.parse(body);

    const left = resolveWatch(leftInput);
    const right = resolveWatch(rightInput);

    if (!left || !right) {
      logWarn("compare.unsupported_input", {
        clientKeyHash,
        leftResolved: Boolean(left),
        rightResolved: Boolean(right)
      });
      await recordTelemetryEvent({
        event: "compare.unsupported_input",
        clientKeyHash,
        status: "rejected",
        reason: "unsupported_input",
        properties: {
          leftResolved: Boolean(left),
          rightResolved: Boolean(right)
        }
      });

      return NextResponse.json(
        {
          error:
            "{compare} V1 currently supports its curated mechanical watch catalog. Try Rolex Air-King, Rolex Explorer, Tudor Black Bay 54, Tudor Black Bay 58, Tudor Pelagos 39, or Omega Aqua Terra 38."
        },
        { status: 404 }
      );
    }

    if (left.id === right.id) {
      logWarn("compare.duplicate_watch", {
        clientKeyHash,
        watchId: left.id
      });
      await recordTelemetryEvent({
        event: "compare.duplicate_watch",
        comparisonRef: `compare:${left.id}:vs:${right.id}`,
        leftWatchId: left.id,
        rightWatchId: right.id,
        clientKeyHash,
        status: "rejected",
        reason: "duplicate_watch"
      });

      return NextResponse.json(
        {
          error: "Choose two different watches so the comparison surfaces meaningful tradeoffs."
        },
        { status: 400 }
      );
    }

    const comparison = compareWatches(left, right);
    const submittedComparison = await persistSubmittedComparison({
      left,
      right,
      deterministicResult: comparison,
      clientKeyHash
    });
    const brain = await enqueueTrinityCompareJob({
      left,
      right,
      deterministicResult: comparison,
      requestedBy: clientKey
    });
    await recordTelemetryEvent({
      event: "compare.completed",
      comparisonRef: brain.comparisonRef,
      leftWatchId: left.id,
      rightWatchId: right.id,
      clientKeyHash,
      status: "completed",
      properties: {
        brainStatus: brain.status,
        comparisonPersisted: submittedComparison.persisted,
        remainingRequests: rateLimit.remaining
      }
    });

    return NextResponse.json({
      comparison,
      brain,
      savedComparison: {
        publicSlug: submittedComparison.publicSlug,
        path: `/compare/${submittedComparison.publicSlug}`,
        persisted: submittedComparison.persisted
      }
    });
  } catch (error) {
    logWarn("compare.invalid_request", {
      clientKeyHash,
      error
    });
    await recordTelemetryEvent({
      event: "compare.invalid_request",
      clientKeyHash,
      status: "rejected",
      reason: "invalid_request"
    });

    return NextResponse.json(
      {
        error: "The comparison request was invalid. Check both inputs and try again."
      },
      { status: 400 }
    );
  }
}
