import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { enqueueTrinityCompareJob } from "@/lib/services/brain-queue";
import { hashLogValue, logError, logWarn } from "@/lib/observability/logger";
import { recordTelemetryEvent } from "@/lib/observability/telemetry";
import { checkRateLimit, resolveClientKey } from "@/lib/security/rate-limit";
import { compareInputs } from "@/lib/services/compare";
import { persistSubmittedComparison } from "@/lib/services/saved-comparisons";

const requestSchema = z.object({
  domain: z.string().trim().min(2).optional(),
  leftInput: z.string().trim().min(2),
  rightInput: z.string().trim().min(2),
  context: z.record(z.string(), z.unknown()).optional()
});

export async function POST(request: Request) {
  const clientKey = resolveClientKey(request);
  const clientKeyHash = hashLogValue(clientKey);
  const rateLimit = await checkRateLimit(clientKey);

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
        error: "Too many comparison requests. Wait a moment and try again.",
        reason: "rate_limited",
        retryAfterSeconds: Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
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
    const { context, domain, leftInput, rightInput } = requestSchema.parse(body);
    const comparisonResult = compareInputs({
      domain,
      leftInput,
      rightInput,
      context
    });

    if (comparisonResult.status === "unsupported_domain") {
      logWarn("compare.unsupported_domain", {
        clientKeyHash,
        domain: comparisonResult.domain
      });
      await recordTelemetryEvent({
        event: "compare.unsupported_domain",
        clientKeyHash,
        status: "rejected",
        reason: "unsupported_domain",
        properties: {
          domain: comparisonResult.domain
        }
      });

      return NextResponse.json(
        {
          error: "This comparison domain is not supported yet.",
          reason: "unsupported_domain",
          supportedDomains: comparisonResult.supportedDomains
        },
        { status: 404 }
      );
    }

    if (comparisonResult.status === "unresolved_input") {
      logWarn("compare.unsupported_input", {
        clientKeyHash,
        domain: comparisonResult.domain,
        leftResolved: comparisonResult.leftResolved,
        rightResolved: comparisonResult.rightResolved
      });
      await recordTelemetryEvent({
        event: "compare.unsupported_input",
        clientKeyHash,
        status: "rejected",
        reason: "unsupported_input",
        properties: {
          domain: comparisonResult.domain,
          leftResolved: comparisonResult.leftResolved,
          rightResolved: comparisonResult.rightResolved,
          leftSuggestionCount: comparisonResult.leftSuggestions.length,
          rightSuggestionCount: comparisonResult.rightSuggestions.length
        }
      });

      return NextResponse.json(
        {
          error:
            "{compare} could not resolve one or both inputs in the selected comparison domain. Use one of the supported examples below or paste a matching source URL.",
          reason:
            comparisonResult.leftSuggestions.length === 0 && comparisonResult.rightSuggestions.length === 0
              ? "unsupported_source"
              : "unsupported_input",
          supportedInputs: comparisonResult.supportedInputs,
          leftSuggestions: comparisonResult.leftSuggestions,
          rightSuggestions: comparisonResult.rightSuggestions
        },
        { status: 404 }
      );
    }

    if (comparisonResult.status === "duplicate_entity") {
      logWarn("compare.duplicate_entity", {
        clientKeyHash,
        domain: comparisonResult.domain,
        entityId: comparisonResult.entity.id
      });
      await recordTelemetryEvent({
        event: "compare.duplicate_entity",
        comparisonRef: `compare:${comparisonResult.domain}:${comparisonResult.entity.id}:vs:${comparisonResult.entity.id}`,
        clientKeyHash,
        status: "rejected",
        reason: "duplicate_entity",
        properties: {
          domain: comparisonResult.domain,
          entityId: comparisonResult.entity.id
        }
      });

      return NextResponse.json(
        {
          error: "Choose two different things so the comparison surfaces meaningful tradeoffs.",
          reason: "duplicate_entity"
        },
        { status: 400 }
      );
    }

    const { comparison, left, right } = comparisonResult;
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
      leftWatchId: left.domain === "watches" ? left.id : undefined,
      rightWatchId: right.domain === "watches" ? right.id : undefined,
      clientKeyHash,
      status: "completed",
      properties: {
        domain: comparisonResult.domain,
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
    if (!(error instanceof ZodError) && !(error instanceof SyntaxError)) {
      logError("compare.request_failed", {
        clientKeyHash,
        error
      });
      await recordTelemetryEvent({
        event: "compare.request_failed",
        clientKeyHash,
        status: "failed",
        reason: "service_unavailable"
      });

      return NextResponse.json(
        {
          error: "The comparison service is temporarily unavailable. Try again in a moment.",
          reason: "service_unavailable"
        },
        { status: 500 }
      );
    }

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
        error: "The comparison request was invalid. Check both inputs and try again.",
        reason: "invalid_request"
      },
      { status: 400 }
    );
  }
}
