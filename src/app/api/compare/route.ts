import { NextResponse } from "next/server";
import { z } from "zod";

import { enqueueTrinityCompareJob } from "@/lib/services/brain-queue";
import { hashLogValue, logWarn } from "@/lib/observability/logger";
import { checkRateLimit, resolveClientKey } from "@/lib/security/rate-limit";
import { compareWatches } from "@/lib/services/compare-watches";
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

      return NextResponse.json(
        {
          error: "Choose two different watches so the comparison surfaces meaningful tradeoffs."
        },
        { status: 400 }
      );
    }

    const comparison = compareWatches(left, right);
    const brain = await enqueueTrinityCompareJob({
      left,
      right,
      deterministicResult: comparison,
      requestedBy: clientKey
    });

    return NextResponse.json({
      comparison,
      brain
    });
  } catch (error) {
    logWarn("compare.invalid_request", {
      clientKeyHash,
      error
    });

    return NextResponse.json(
      {
        error: "The comparison request was invalid. Check both inputs and try again."
      },
      { status: 400 }
    );
  }
}
