import { notFound } from "next/navigation";

import { ComparisonResultView } from "@/components/comparison-result";
import { appName } from "@/lib/config/app";
import { getSavedComparisonBySlug } from "@/lib/services/saved-comparisons";
import type { BrainConfidenceBundle, BrainState, TrinityBrainResult } from "@/types/watch";

export const dynamic = "force-dynamic";

type SavedComparisonPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function brainStateFromSavedComparison(
  comparisonRef: string,
  brainResult: unknown,
  traceRef: string | null
): BrainState | null {
  if (!brainResult || typeof brainResult !== "object") {
    return null;
  }

  const result = brainResult as TrinityBrainResult;
  const confidence =
    result.confidence_bundle ?? result.confidenceBundle ?? (null as BrainConfidenceBundle | null);

  return {
    status: "completed",
    comparisonRef,
    result,
    confidence,
    traceRef: traceRef ?? result.trace_ref ?? result.traceRef ?? null
  };
}

function formatSavedDate(value: string | null): string {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function SavedComparisonPage({ params }: SavedComparisonPageProps) {
  const { slug } = await params;
  const savedComparison = await getSavedComparisonBySlug(slug);

  if (!savedComparison) {
    notFound();
  }

  const result = savedComparison.deterministicResult;
  const brain = brainStateFromSavedComparison(
    savedComparison.comparisonRef,
    savedComparison.brainResult,
    savedComparison.traceRef
  );

  return (
    <main className="app-shell min-h-screen">
      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="eyebrow eyebrow-xwide">{appName}</p>
            <h1 className="title-section mt-3 text-4xl">
              {result.left.brand} {result.left.model} vs {result.right.brand} {result.right.model}
            </h1>
          </div>
          <div className="surface-panel grid gap-3 p-4 sm:grid-cols-3">
            <div>
              <p className="eyebrow">Submissions</p>
              <p className="body-copy body-copy-strong mt-2 text-sm">{savedComparison.submissionCount}</p>
            </div>
            <div>
              <p className="eyebrow">First saved</p>
              <p className="body-copy body-copy-strong mt-2 text-sm">
                {formatSavedDate(savedComparison.firstSubmittedAt)}
              </p>
            </div>
            <div>
              <p className="eyebrow">Last saved</p>
              <p className="body-copy body-copy-strong mt-2 text-sm">
                {formatSavedDate(savedComparison.lastSubmittedAt)}
              </p>
            </div>
          </div>
        </div>

        <ComparisonResultView brain={brain} result={result} />
      </div>
    </main>
  );
}
