import { NextResponse } from "next/server";
import { z } from "zod";

import { watchCollectionProfileFromContext } from "@/lib/domains/watch-collection";
import { watchDisplayName } from "@/lib/domains/watch-entity";
import { hashLogValue, logWarn } from "@/lib/observability/logger";
import { recordTelemetryEvent } from "@/lib/observability/telemetry";
import { checkRateLimit, resolveClientKey } from "@/lib/security/rate-limit";
import { shouldBuyWatch } from "@/lib/services/should-buy-watch";
import { resolveWatchDetailed } from "@/lib/utils/resolve-watch";

const requestSchema = z.object({
  candidateInput: z.string().trim().min(2),
  context: z.record(z.string(), z.unknown()).optional()
});

export async function POST(request: Request) {
  const clientKey = resolveClientKey(request);
  const clientKeyHash = hashLogValue(clientKey);
  const rateLimit = checkRateLimit(`should-buy:${clientKey}`);

  if (rateLimit.limited) {
    return NextResponse.json(
      {
        error: "Too many purchase checks. Wait a moment and try again."
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
    const { candidateInput, context } = requestSchema.parse(body);
    const resolution = resolveWatchDetailed(candidateInput);

    if (resolution.status === "unresolved") {
      const suggestions = resolution.suggestions.map(watchDisplayName);
      await recordTelemetryEvent({
        event: "watch_purchase.unresolved_input",
        clientKeyHash,
        status: "rejected",
        reason: "unsupported_input",
        properties: {
          suggestionCount: suggestions.length
        }
      });

      return NextResponse.json(
        {
          error: "{compare} could not resolve this watch. Use a supported watch name, reference, alias, or source URL.",
          suggestions
        },
        { status: 404 }
      );
    }

    const profile = watchCollectionProfileFromContext(context);
    const report = shouldBuyWatch(resolution.watch, profile);

    await recordTelemetryEvent({
      event: "watch_purchase.completed",
      clientKeyHash,
      status: "completed",
      properties: {
        verdict: report.verdict,
        hasProfile: Boolean(profile)
      }
    });

    return NextResponse.json({
      report
    });
  } catch (error) {
    logWarn("watch_purchase.invalid_request", {
      clientKeyHash,
      error
    });

    return NextResponse.json(
      {
        error: "The purchase check request was invalid. Check the watch input and try again."
      },
      { status: 400 }
    );
  }
}
