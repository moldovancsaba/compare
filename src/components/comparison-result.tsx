"use client";

import { useState } from "react";

import { appName } from "@/lib/config/app";
import type {
  EvidenceConfidence,
  EvidenceItem,
  EvidenceKind,
  GenericComparisonResult,
  InsightBlock,
  RecommendationSignalKind
} from "@/types/comparison";
import type { BrainRecommendation, BrainState } from "@/types/watch";

const evidenceKindLabels: Record<EvidenceKind, string> = {
  catalog_fact: "Fact",
  derived_rule: "Rule",
  editorial_inference: "Inference",
  external_source: "Source",
  missing_data: "Gap"
};

const evidenceConfidenceLabels: Record<EvidenceConfidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low"
};

const recommendationSignalKindLabels: Record<RecommendationSignalKind, string> = {
  best_overall: "Default",
  best_daily: "Daily",
  best_value: "Value",
  best_collector: "Depth",
  avoid_if: "Avoid",
  no_clear_winner: "Close"
};

function evidenceToneClass(confidence: EvidenceConfidence): string {
  switch (confidence) {
    case "high":
      return "pill-accent";
    case "medium":
      return "pill-muted";
    case "low":
      return "border border-[rgba(232,217,194,0.2)] bg-[rgba(120,53,15,0.28)] text-[var(--paper)]";
  }
}

function EvidencePills({ evidence }: { evidence?: EvidenceItem[] }) {
  if (!evidence?.length) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {evidence.slice(0, 3).map((item) => (
        <span
          key={item.id}
          className={`${evidenceToneClass(item.confidence)} eyebrow eyebrow-tight px-3 py-1`}
          title={item.detail}
        >
          {evidenceKindLabels[item.kind]} · {evidenceConfidenceLabels[item.confidence]}
        </span>
      ))}
    </div>
  );
}

function SectionCard({
  title,
  items
}: {
  title: string;
  items: InsightBlock[];
}) {
  return (
    <section className="surface-card p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="title-section">{title}</h3>
        <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">{items.length} notes</span>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <article key={`${title}-${item.title}`} className="surface-item p-4">
            <h4 className="card-kicker mb-2">{item.title}</h4>
            <p className="body-copy body-copy-strong text-sm">{item.summary}</p>
            <EvidencePills evidence={item.evidence} />
          </article>
        ))}
      </div>
    </section>
  );
}

function BuyerCard({
  buyerType,
  pick,
  reason
}: {
  buyerType: string;
  pick: string;
  reason: string;
}) {
  return (
    <article className="surface-panel p-5">
      <p className="eyebrow">{buyerType}</p>
      <h4 className="title-section mt-3">{pick}</h4>
      <p className="body-copy mt-3 text-sm">{reason}</p>
    </article>
  );
}

function VerdictPanel({ result }: { result: GenericComparisonResult }) {
  return (
    <section className="surface-card p-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow eyebrow-wide">Instant verdict</p>
          <h3 className="mt-3 font-serif text-3xl leading-tight text-[var(--paper)]">{result.verdict.headline}</h3>
          <p className="body-copy body-copy-muted mt-4 text-sm">{result.verdict.summary}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="pill-accent eyebrow eyebrow-tight px-3 py-1">{result.verdict.confidence} confidence</span>
            <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">decision first</span>
          </div>
          <div className="mt-5 grid gap-3">
            <article className="surface-item p-4">
              <p className="card-kicker mb-2">Stronger choice</p>
              <p className="body-copy body-copy-strong text-sm">{result.verdict.strongerChoice}</p>
            </article>
            <article className="surface-item p-4">
              <p className="card-kicker mb-2">Exception case</p>
              <p className="body-copy body-copy-strong text-sm">{result.verdict.exceptionCase}</p>
            </article>
            <article className="surface-item p-4">
              <p className="card-kicker mb-2">Why this confidence</p>
              <p className="body-copy body-copy-strong text-sm">{result.verdict.confidenceRationale}</p>
            </article>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {result.verdict.picks.map((item) => (
            <article key={item.label} className="surface-item p-4">
              <p className="card-kicker mb-2">{item.label}</p>
              <h4 className="title-section text-xl">{item.pick}</h4>
              <p className="body-copy body-copy-strong mt-3 text-sm">{item.reason}</p>
              <EvidencePills evidence={item.evidence} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecommendationSignalsPanel({ result }: { result: GenericComparisonResult }) {
  if (!result.recommendationSignals.length) {
    return null;
  }

  return (
    <section className="surface-card p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow eyebrow-wide">Recommendation signals</p>
          <h3 className="title-section mt-3">What to do with the verdict</h3>
        </div>
        <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">{result.recommendationSignals.length} signals</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {result.recommendationSignals.map((signal) => (
          <article key={`${signal.kind}-${signal.label}-${signal.pick}`} className="surface-item p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="pill-accent eyebrow eyebrow-tight px-3 py-1">
                {recommendationSignalKindLabels[signal.kind]}
              </span>
              <span className={`${evidenceToneClass(signal.confidence)} eyebrow eyebrow-tight px-3 py-1`}>
                {evidenceConfidenceLabels[signal.confidence]}
              </span>
            </div>
            <p className="card-kicker mb-2">{signal.label}</p>
            <h4 className="title-section text-xl">{signal.pick}</h4>
            <p className="body-copy body-copy-strong mt-3 text-sm">{signal.reason}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DecisionScanPanel({ result }: { result: GenericComparisonResult }) {
  const limitation = result.evidenceSummary.limitations[0] ?? "No major evidence limitation is attached to this result.";

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <article className="surface-card p-4 shadow-none">
        <p className="card-kicker mb-2">Recommendation</p>
        <p className="title-section text-xl">{result.verdict.strongerChoice}</p>
      </article>
      <article className="surface-card p-4 shadow-none">
        <p className="card-kicker mb-2">Confidence</p>
        <p className="title-section text-xl capitalize">{result.verdict.confidence}</p>
        <p className="body-copy body-copy-faint mt-2 text-xs leading-5">{result.verdict.confidenceRationale}</p>
      </article>
      <article className="surface-card p-4 shadow-none">
        <p className="card-kicker mb-2">Data quality</p>
        <p className="title-section text-xl capitalize">{result.evidenceSummary.dataQuality}</p>
      </article>
      <article className="surface-card p-4 shadow-none">
        <p className="card-kicker mb-2">Caveat</p>
        <p className="body-copy body-copy-strong text-sm leading-6">{limitation}</p>
      </article>
    </section>
  );
}

function EvidenceSummaryPanel({ result }: { result: GenericComparisonResult }) {
  const summary = result.evidenceSummary;

  return (
    <section className="surface-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow eyebrow-wide">Evidence & confidence</p>
          <h3 className="title-section mt-3">What this result is based on</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`${evidenceToneClass(summary.overallConfidence)} eyebrow eyebrow-tight px-3 py-1`}>
            {evidenceConfidenceLabels[summary.overallConfidence]} confidence
          </span>
          <span className={`${evidenceToneClass(summary.dataQuality)} eyebrow eyebrow-tight px-3 py-1`}>
            {evidenceConfidenceLabels[summary.dataQuality]} data quality
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {summary.evidence.slice(0, 6).map((item) => (
          <article key={item.id} className="surface-item p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`${evidenceToneClass(item.confidence)} eyebrow eyebrow-tight px-3 py-1`}>
                {evidenceKindLabels[item.kind]}
              </span>
              <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">
                {evidenceConfidenceLabels[item.confidence]}
              </span>
            </div>
            <h4 className="card-kicker mb-2">{item.label}</h4>
            <p className="body-copy body-copy-strong text-sm">{item.detail}</p>
            {item.source?.url ? (
              <a
                className="body-copy body-copy-soft mt-3 inline-flex text-xs underline decoration-[rgba(232,217,194,0.3)] underline-offset-4"
                href={item.source.url}
                rel="noreferrer"
                target="_blank"
              >
                {item.source.label}
              </a>
            ) : null}
          </article>
        ))}
      </div>

      {summary.limitations.length ? (
        <div className="mt-5 surface-item p-4">
          <p className="card-kicker mb-3">Known limits</p>
          <ul className="space-y-2">
            {summary.limitations.map((limitation) => (
              <li key={limitation} className="body-copy body-copy-muted text-sm">
                {limitation}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function confidencePercent(brain: BrainState): number | null {
  if (brain.status !== "completed") {
    return null;
  }

  const raw = brain.confidence?.combined_confidence ?? brain.confidence?.combinedConfidence;
  return typeof raw === "number" ? Math.round(raw * 100) : null;
}

function primaryBrainRecommendation(brain: BrainState): BrainRecommendation | null {
  if (brain.status !== "completed") {
    return null;
  }

  return brain.result.comparison?.whoShouldBuyWhich?.[0] ?? null;
}

function oppositeCase(brain: BrainState): string {
  if (brain.status !== "completed") {
    return "";
  }

  const recommendations = brain.result.comparison?.whoShouldBuyWhich ?? [];
  const alternate = recommendations.find((item) => item.pick !== recommendations[0]?.pick);
  return alternate
    ? `${alternate.pick} still makes sense for ${alternate.buyerType.toLowerCase()}: ${alternate.reason}`
    : "The other option can still be right if your context, budget, or preferences change.";
}

function BrainStatusCard({
  brain,
  isRefreshing = false,
  onRefresh
}: {
  brain: BrainState | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}) {
  const recommendation = brain ? primaryBrainRecommendation(brain) : null;
  const confidence = brain ? confidencePercent(brain) : null;
  const canRefresh = Boolean(onRefresh && brain?.comparisonRef);
  const refreshButton = canRefresh ? (
    <button
      type="button"
      className="pill-muted eyebrow eyebrow-tight px-3 py-2 transition disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isRefreshing}
      onClick={onRefresh}
    >
      {isRefreshing ? "Refreshing" : "Refresh"}
    </button>
  ) : null;

  if (!brain || brain.status === "disabled" || brain.status === "unavailable") {
    return (
      <section className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow eyebrow-wide">Decision Brain</p>
            <h3 className="title-section mt-3">Deterministic recommendation</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">offline</span>
            {refreshButton}
          </div>
        </div>
        <p className="body-copy mt-4 text-sm">
          {brain?.message ??
            "Trinity Brain is not attached to this response, so the result is using the deterministic compare engine."}
        </p>
      </section>
    );
  }

  if (brain.status === "queued" || brain.status === "running") {
    return (
      <section className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow eyebrow-wide">Decision Brain</p>
            <h3 className="title-section mt-3">{brain.status === "queued" ? "Queued for enrichment" : "Processing"}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="pill-accent eyebrow eyebrow-tight px-3 py-1">{brain.status}</span>
            {refreshButton}
          </div>
        </div>
        <p className="body-copy mt-4 text-sm">{brain.message}</p>
      </section>
    );
  }

  if (brain.status === "failed") {
    return (
      <section className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow eyebrow-wide">Decision Brain</p>
            <h3 className="title-section mt-3">Enrichment unavailable</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">fallback</span>
            {refreshButton}
          </div>
        </div>
        <p className="body-copy mt-4 text-sm">
          The deterministic comparison is still valid. Trinity could not enrich this result.
        </p>
      </section>
    );
  }

  return (
    <section className="surface-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow eyebrow-wide">Decision Brain</p>
          <h3 className="title-section mt-3">{recommendation?.pick ?? "Brain-enhanced recommendation"}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="pill-accent eyebrow eyebrow-tight px-3 py-1">
            {confidence ? `${confidence}% confidence` : "enriched"}
          </span>
          {refreshButton}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="surface-item p-4">
          <p className="card-kicker mb-2">Why this pick</p>
          <p className="body-copy body-copy-strong text-sm">
            {recommendation?.reason ?? "Trinity returned an enriched comparison without a primary recommendation."}
          </p>
        </article>
        <article className="surface-item p-4">
          <p className="card-kicker mb-2">When the other wins</p>
          <p className="body-copy body-copy-strong text-sm">{oppositeCase(brain)}</p>
        </article>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {brain.traceRef ? <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">trace saved</span> : null}
        {brain.result.minority_report ? (
          <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">minority report</span>
        ) : null}
      </div>
    </section>
  );
}

type FeedbackSignal =
  | "helpful"
  | "not_helpful"
  | "chose_left"
  | "chose_right"
  | "opposite_preferred"
  | "bad_recommendation"
  | "missing_context"
  | "wrong_spec";

function comparisonRefFor(result: GenericComparisonResult, brain: BrainState | null): string {
  return (
    brain?.comparisonRef ??
    (result.domain === "watches"
      ? `compare:${result.leftEntity.id}:vs:${result.rightEntity.id}`
      : `compare:${result.leftEntity.domain}:${result.leftEntity.id}:vs:${result.rightEntity.domain}:${result.rightEntity.id}`)
  );
}

function FeedbackButton({
  children,
  disabled,
  onClick
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="pill-muted eyebrow eyebrow-tight px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function FeedbackPanel({ brain, result }: { brain: BrainState | null; result: GenericComparisonResult }) {
  const [pendingSignal, setPendingSignal] = useState<FeedbackSignal | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const comparisonRef = comparisonRefFor(result, brain);
  const traceRef = brain?.status === "completed" ? brain.traceRef : null;
  const trimmedNote = note.trim();
  const noteIsTooLong = note.length > 1000;

  async function submitFeedback(signal: FeedbackSignal) {
    if (noteIsTooLong) {
      setMessage("Feedback notes must stay under 1,000 characters.");
      return;
    }

    setPendingSignal(signal);
    setMessage(null);

    try {
      const response = await fetch("/api/compare/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          comparisonRef,
          leftEntityId: result.leftEntity.id,
          rightEntityId: result.rightEntity.id,
          leftDomain: result.leftEntity.domain,
          rightDomain: result.rightEntity.domain,
          traceRef,
          signal,
          ...(trimmedNote ? { note: trimmedNote } : {})
        })
      });
      const payload = (await response.json()) as
        | { feedback: { status: string; message: string } }
        | { error: string };

      if ("feedback" in payload) {
        setMessage(payload.feedback.message);
        setNote("");
      } else {
        setMessage(response.ok ? "Feedback received." : "Feedback could not be saved.");
      }
    } catch {
      setMessage("Feedback could not be saved.");
    } finally {
      setPendingSignal(null);
    }
  }

  return (
    <section className="surface-card p-6 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow eyebrow-wide">Improve this comparison</p>
          <h3 className="title-section mt-3">Was this comparison useful?</h3>
        </div>
        <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">no account needed</span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <FeedbackButton disabled={pendingSignal !== null} onClick={() => void submitFeedback("helpful")}>
          Helpful
        </FeedbackButton>
        <FeedbackButton disabled={pendingSignal !== null} onClick={() => void submitFeedback("not_helpful")}>
          Not helpful
        </FeedbackButton>
        <FeedbackButton disabled={pendingSignal !== null} onClick={() => void submitFeedback("chose_left")}>
          Chose {result.leftEntity.label}
        </FeedbackButton>
        <FeedbackButton disabled={pendingSignal !== null} onClick={() => void submitFeedback("chose_right")}>
          Chose {result.rightEntity.label}
        </FeedbackButton>
        <FeedbackButton disabled={pendingSignal !== null} onClick={() => void submitFeedback("opposite_preferred")}>
          I prefer the other pick
        </FeedbackButton>
        <FeedbackButton disabled={pendingSignal !== null} onClick={() => void submitFeedback("bad_recommendation")}>
          Bad recommendation
        </FeedbackButton>
        <FeedbackButton disabled={pendingSignal !== null} onClick={() => void submitFeedback("missing_context")}>
          Missing context
        </FeedbackButton>
        <FeedbackButton disabled={pendingSignal !== null} onClick={() => void submitFeedback("wrong_spec")}>
          Wrong spec
        </FeedbackButton>
      </div>

      <label className="mt-5 block">
        <span className="eyebrow mb-2 block">Optional note</span>
        <textarea
          className="field-input placeholder-muted min-h-28 w-full resize-y px-4 py-3 text-sm"
          maxLength={1000}
          placeholder="Add context Trinity should learn from."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="body-copy body-copy-faint text-xs">{note.length}/1000 characters</p>
        {pendingSignal ? <p className="body-copy body-copy-soft text-xs">Saving {pendingSignal.replaceAll("_", " ")}</p> : null}
      </div>

      {message ? <p className="body-copy body-copy-soft mt-4 text-sm">{message}</p> : null}
    </section>
  );
}

export function ComparisonResultView({
  brain,
  isBrainRefreshing = false,
  result,
  savedComparisonPath,
  onRefreshBrain
}: {
  brain: BrainState | null;
  isBrainRefreshing?: boolean;
  result: GenericComparisonResult;
  savedComparisonPath?: string | null;
  onRefreshBrain?: () => void;
}) {
  return (
    <div className="space-y-8">
      <section className="surface-hero grid gap-4 p-7 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="eyebrow eyebrow-wide">Comparison ready</p>
          <h2 className="title-section mt-4 text-4xl">
            {result.leftEntity.label} vs {result.rightEntity.label}
          </h2>
          <p className="body-copy mt-4 max-w-2xl">
            {appName} turns domain consequences into a buying decision so you can stop researching and choose with less regret risk.
          </p>
          {savedComparisonPath ? (
            <a className="pill-accent eyebrow eyebrow-tight mt-5 inline-flex px-4 py-2" href={savedComparisonPath}>
              Open saved comparison
            </a>
          ) : null}
        </div>
        <div>
          <p className="eyebrow eyebrow-wide mb-3">{result.sectionLabels.signalVsFluff}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.signalVsFluff.map((item) => (
              <article key={item.title} className="surface-card p-4 shadow-none">
                <p className="eyebrow">{item.title}</p>
                <p className="body-copy body-copy-strong mt-3 text-sm">{item.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <DecisionScanPanel result={result} />

      <VerdictPanel result={result} />

      <RecommendationSignalsPanel result={result} />

      <EvidenceSummaryPanel result={result} />

      <BrainStatusCard brain={brain} isRefreshing={isBrainRefreshing} onRefresh={onRefreshBrain} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={result.sectionLabels.keyDifferences} items={result.keyDifferences} />
        <SectionCard title={result.sectionLabels.realWorldImpact} items={result.realWorldImpact} />
      </div>

      <SectionCard title={result.sectionLabels.ownershipIntelligence} items={result.ownershipIntelligence} />

      <section className="surface-card p-6 shadow-none">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="title-section">{result.sectionLabels.whoShouldBuyWhich}</h3>
          <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">buyer lenses</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {result.whoShouldBuyWhich.map((item) => (
            <BuyerCard key={item.buyerType} {...item} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title={result.sectionLabels.overpricedFeatures} items={result.overpricedFeatures} />
        <SectionCard title={result.sectionLabels.hiddenDownsides} items={result.hiddenDownsides} />
        <SectionCard title={result.sectionLabels.betterValueAlternative} items={result.betterValueAlternative} />
      </div>

      <FeedbackPanel brain={brain} result={result} />
    </div>
  );
}
