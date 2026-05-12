import { connectToDatabase } from "@/lib/db";
import { SavedComparisonModel } from "@/lib/models/comparison-brain";
import { logWarn } from "@/lib/observability/logger";
import { buildComparisonRef } from "@/lib/services/brain-queue";
import type { ComparisonEntity, GenericComparisonResult } from "@/types/comparison";

type PersistSubmittedComparisonInput = {
  left: ComparisonEntity;
  right: ComparisonEntity;
  deterministicResult: GenericComparisonResult;
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
  deterministicResult: GenericComparisonResult;
  brainResult: unknown | null;
  traceRef: string | null;
  submissionCount: number;
  firstSubmittedAt: string | null;
  lastSubmittedAt: string | null;
};

function watchSlugFromId(watchId: string): string | null {
  return watchId.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) ? watchId : null;
}

export function buildSavedComparisonSlug(left: ComparisonEntity, right: ComparisonEntity): string {
  return left.domain === "watches" && right.domain === "watches"
    ? `${left.slug}-vs-${right.slug}`
    : `${left.domain}-${left.slug}-vs-${right.domain}-${right.slug}`;
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
          leftWatchId: input.left.domain === "watches" ? input.left.id : null,
          rightWatchId: input.right.domain === "watches" ? input.right.id : null,
          leftEntityId: input.left.id,
          rightEntityId: input.right.id,
          leftDomain: input.left.domain,
          rightDomain: input.right.domain,
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
      deterministicResult: GenericComparisonResult;
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
