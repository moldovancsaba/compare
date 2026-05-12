import { connectToDatabase } from "@/lib/db";
import { SavedComparisonModel } from "@/lib/models/comparison-brain";
import { logWarn } from "@/lib/observability/logger";
import { buildComparisonRef } from "@/lib/services/brain-queue";
import type { ComparisonResult, WatchSpec } from "@/types/watch";

type PersistSubmittedComparisonInput = {
  left: WatchSpec;
  right: WatchSpec;
  deterministicResult: ComparisonResult;
  clientKeyHash: string;
};

export type PersistSubmittedComparisonResult = {
  comparisonRef: string;
  persisted: boolean;
};

export async function persistSubmittedComparison(
  input: PersistSubmittedComparisonInput
): Promise<PersistSubmittedComparisonResult> {
  const comparisonRef = buildComparisonRef(input.left, input.right);

  try {
    const connection = await connectToDatabase();
    if (!connection) {
      return {
        comparisonRef,
        persisted: false
      };
    }

    const now = new Date();

    await SavedComparisonModel.findOneAndUpdate(
      { comparisonRef },
      {
        $set: {
          leftWatchId: input.left.id,
          rightWatchId: input.right.id,
          deterministicResult: input.deterministicResult,
          lastSubmittedAt: now,
          lastSubmittedByHash: input.clientKeyHash
        },
        $setOnInsert: {
          comparisonRef,
          firstSubmittedAt: now
        },
        $inc: {
          submissionCount: 1
        }
      },
      { upsert: true, returnDocument: "after" }
    );

    return {
      comparisonRef,
      persisted: true
    };
  } catch (error) {
    logWarn("comparison.persist_failed", {
      comparisonRef,
      error
    });

    return {
      comparisonRef,
      persisted: false
    };
  }
}
