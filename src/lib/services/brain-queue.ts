import { createHash } from "node:crypto";

import { connectToDatabase } from "@/lib/db";
import { CompareJobModel, SavedComparisonModel } from "@/lib/models/comparison-brain";
import { logError, logInfo, logWarn } from "@/lib/observability/logger";
import type { BrainState, ComparisonResult, TrinityBrainResult, WatchSpec } from "@/types/watch";

type EnqueueBrainJobInput = {
  left: WatchSpec;
  right: WatchSpec;
  deterministicResult: ComparisonResult;
  requestedBy: string;
};

export function buildComparisonRef(left: WatchSpec, right: WatchSpec): string {
  return `compare:${left.id}:vs:${right.id}`;
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function isTrinityWorkerEnabled(): boolean {
  return process.env.COMPARE_BRAIN_PROVIDER === "trinity_worker";
}

export async function enqueueTrinityCompareJob(input: EnqueueBrainJobInput): Promise<BrainState> {
  const comparisonRef = buildComparisonRef(input.left, input.right);

  if (!isTrinityWorkerEnabled()) {
    logInfo("brain.queue_disabled", {
      comparisonRef
    });

    return {
      status: "disabled",
      comparisonRef,
      message: "Trinity Brain is not enabled for this environment."
    };
  }

  const requestHash = stableHash({
    contractVersion: "compare.brain-job.v1",
    comparisonRef,
    leftWatchId: input.left.id,
    rightWatchId: input.right.id,
    deterministicResult: input.deterministicResult
  });

  try {
    const connection = await connectToDatabase();
    if (!connection) {
      logWarn("brain.queue_unavailable", {
        comparisonRef,
        reason: "missing_database_connection"
      });

      return {
        status: "unavailable",
        comparisonRef,
        message: "Trinity Brain needs MongoDB Atlas before it can enrich this result."
      };
    }

    const existingSaved = await SavedComparisonModel.findOne({ comparisonRef }).lean();
    const existingBrainResult = extractBrainResult(existingSaved);
    if (existingBrainResult) {
      logInfo("brain.result_cache_hit", {
        comparisonRef
      });

      return completedBrainState(comparisonRef, existingBrainResult, existingSaved?.traceRef ?? null);
    }

    const savedComparison = {
      comparisonRef,
      leftWatchId: input.left.id,
      rightWatchId: input.right.id,
      deterministicResult: input.deterministicResult
    };

    const [job] = await Promise.all([
      CompareJobModel.findOneAndUpdate(
        { requestHash },
        {
          $setOnInsert: {
            comparisonRef,
            requestHash,
            status: "queued",
            leftWatchId: input.left.id,
            rightWatchId: input.right.id,
            decisionProfile: null,
            requestedBy: input.requestedBy,
            deterministicResult: input.deterministicResult
          }
        },
        { returnDocument: "after", upsert: true }
      ),
      SavedComparisonModel.findOneAndUpdate(
        { comparisonRef },
        { $setOnInsert: savedComparison },
        { returnDocument: "after", upsert: true }
      )
    ]);

    logInfo("brain.job_queued", {
      comparisonRef,
      jobId: String(job._id)
    });

    return {
      status: "queued",
      comparisonRef,
      jobId: String(job._id),
      message: "Trinity Brain is queued for local enrichment."
    };
  } catch (error) {
    logError("brain.queue_failed", {
      comparisonRef,
      error
    });

    return {
      status: "unavailable",
      comparisonRef,
      message: "Trinity Brain could not queue this comparison."
    };
  }
}

export async function getTrinityBrainState(comparisonRef: string): Promise<BrainState> {
  if (!isTrinityWorkerEnabled()) {
    logInfo("brain.poll_disabled", {
      comparisonRef
    });

    return {
      status: "disabled",
      comparisonRef,
      message: "Trinity Brain is not enabled for this environment."
    };
  }

  try {
    const connection = await connectToDatabase();
    if (!connection) {
      logWarn("brain.poll_unavailable", {
        comparisonRef,
        reason: "missing_database_connection"
      });

      return {
        status: "unavailable",
        comparisonRef,
        message: "Trinity Brain needs MongoDB Atlas before it can enrich this result."
      };
    }

    const savedComparison = await SavedComparisonModel.findOne({ comparisonRef }).lean();
    const brainResult = extractBrainResult(savedComparison);
    if (brainResult) {
      logInfo("brain.poll_completed", {
        comparisonRef
      });

      return completedBrainState(comparisonRef, brainResult, savedComparison?.traceRef ?? null);
    }

    const job = await CompareJobModel.findOne({ comparisonRef }).sort({ createdAt: -1 }).lean();
    if (!job) {
      logWarn("brain.poll_missing_job", {
        comparisonRef
      });

      return {
        status: "unavailable",
        comparisonRef,
        message: "No Trinity Brain job exists for this comparison yet."
      };
    }

    if (job.status === "completed") {
      logWarn("brain.poll_completed_without_result", {
        comparisonRef,
        jobId: String(job._id)
      });

      return {
        status: "unavailable",
        comparisonRef,
        message: "The Trinity Brain job completed, but no enriched result was found."
      };
    }

    if (job.status === "failed") {
      logWarn("brain.poll_failed_job", {
        comparisonRef,
        jobId: String(job._id)
      });

      return {
        status: "failed",
        comparisonRef,
        message: typeof job.error === "string" && job.error ? job.error : "Trinity Brain failed."
      };
    }

    if (job.status === "running") {
      return {
        status: "running",
        comparisonRef,
        jobId: String(job._id),
        message: "Trinity Brain is processing this comparison."
      };
    }

    return {
      status: "queued",
      comparisonRef,
      jobId: String(job._id),
      message: "Trinity Brain is queued for local enrichment."
    };
  } catch (error) {
    logError("brain.poll_failed", {
      comparisonRef,
      error
    });

    return {
      status: "unavailable",
      comparisonRef,
      message: "Trinity Brain status is temporarily unavailable."
    };
  }
}

function extractBrainResult(record: unknown): TrinityBrainResult | null {
  if (!record || typeof record !== "object" || !("brainResult" in record)) {
    return null;
  }

  const brainResult = (record as { brainResult?: unknown }).brainResult;
  if (!brainResult || typeof brainResult !== "object") {
    return null;
  }

  return brainResult as TrinityBrainResult;
}

function completedBrainState(
  comparisonRef: string,
  result: TrinityBrainResult,
  traceRef: string | null
): BrainState {
  const confidence = result.confidence_bundle ?? result.confidenceBundle ?? null;
  return {
    status: "completed",
    comparisonRef,
    result,
    confidence,
    traceRef: result.trace_ref ?? result.traceRef ?? traceRef
  };
}
