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
  publicSlug: string;
  persisted: boolean;
};

export type SavedComparisonPage = {
  comparisonRef: string;
  publicSlug: string;
  deterministicResult: ComparisonResult;
  brainResult: unknown | null;
  traceRef: string | null;
  submissionCount: number;
  firstSubmittedAt: string | null;
  lastSubmittedAt: string | null;
};

function watchSlugFromId(watchId: string): string | null {
  return watchId.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) ? watchId : null;
}

export function buildSavedComparisonSlug(left: WatchSpec, right: WatchSpec): string {
  return `${left.slug}-vs-${right.slug}`;
}

export function parseSavedComparisonSlug(slug: string): { leftWatchId: string; rightWatchId: string } | null {
  const parts = slug.split("-vs-");

  if (parts.length !== 2) {
    return null;
  }

  const [leftWatchId, rightWatchId] = parts;
  const leftSlug = watchSlugFromId(leftWatchId);
  const rightSlug = watchSlugFromId(rightWatchId);

  if (!leftSlug || !rightSlug || leftSlug === rightSlug) {
    return null;
  }

  return {
    leftWatchId: leftSlug,
    rightWatchId: rightSlug
  };
}

export async function persistSubmittedComparison(
  input: PersistSubmittedComparisonInput
): Promise<PersistSubmittedComparisonResult> {
  const comparisonRef = buildComparisonRef(input.left, input.right);
  const publicSlug = buildSavedComparisonSlug(input.left, input.right);

  try {
    const connection = await connectToDatabase();
    if (!connection) {
      return {
        comparisonRef,
        publicSlug,
        persisted: false
      };
    }

    const now = new Date();

    await SavedComparisonModel.findOneAndUpdate(
      { comparisonRef },
      {
        $set: {
          publicSlug,
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
      publicSlug,
      persisted: true
    };
  } catch (error) {
    logWarn("comparison.persist_failed", {
      comparisonRef,
      error
    });

    return {
      comparisonRef,
      publicSlug,
      persisted: false
    };
  }
}

export async function getSavedComparisonBySlug(slug: string): Promise<SavedComparisonPage | null> {
  const parsed = parseSavedComparisonSlug(slug);

  if (!parsed) {
    return null;
  }

  try {
    const connection = await connectToDatabase();
    if (!connection) {
      return null;
    }

    const savedComparison = await SavedComparisonModel.findOne({
      $or: [
        { publicSlug: slug },
        {
          leftWatchId: parsed.leftWatchId,
          rightWatchId: parsed.rightWatchId
        }
      ]
    }).lean<{
      comparisonRef: string;
      publicSlug?: string | null;
      deterministicResult: ComparisonResult;
      brainResult?: unknown | null;
      traceRef?: string | null;
      submissionCount?: number | null;
      firstSubmittedAt?: Date | string | null;
      lastSubmittedAt?: Date | string | null;
    }>();

    if (!savedComparison) {
      return null;
    }

    return {
      comparisonRef: savedComparison.comparisonRef,
      publicSlug: savedComparison.publicSlug ?? slug,
      deterministicResult: savedComparison.deterministicResult,
      brainResult: savedComparison.brainResult ?? null,
      traceRef: savedComparison.traceRef ?? null,
      submissionCount: savedComparison.submissionCount ?? 0,
      firstSubmittedAt: savedComparison.firstSubmittedAt
        ? new Date(savedComparison.firstSubmittedAt).toISOString()
        : null,
      lastSubmittedAt: savedComparison.lastSubmittedAt ? new Date(savedComparison.lastSubmittedAt).toISOString() : null
    };
  } catch (error) {
    logWarn("comparison.saved_lookup_failed", {
      slug,
      error
    });

    return null;
  }
}
