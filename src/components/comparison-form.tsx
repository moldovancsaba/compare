"use client";

import { useState, useTransition } from "react";

import type { ComparisonResult } from "@/types/watch";

const presets = [
  ["Rolex Air-King", "Rolex Explorer"],
  ["Tudor Black Bay 58", "Tudor Pelagos 39"],
  ["Omega Aqua Terra 38", "Tudor Black Bay 54"]
] as const;

interface ComparisonResponse {
  comparison: ComparisonResult;
}

function isErrorResponse(payload: ComparisonResponse | { error: string }): payload is { error: string } {
  return "error" in payload;
}

function SectionCard({
  title,
  items
}: {
  title: string;
  items: Array<{ title: string; summary: string }>;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-black/20 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="font-serif text-2xl text-[var(--paper)]">{title}</h3>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
          {items.length} notes
        </span>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <article key={`${title}-${item.title}`} className="rounded-3xl border border-white/8 bg-white/4 p-4">
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{item.title}</h4>
            <p className="text-sm leading-7 text-[var(--paper)]/86">{item.summary}</p>
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
    <article className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
      <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">{buyerType}</p>
      <h4 className="mt-3 font-serif text-2xl text-[var(--paper)]">{pick}</h4>
      <p className="mt-3 text-sm leading-7 text-[var(--paper)]/82">{reason}</p>
    </article>
  );
}

function ResultView({ result }: { result: ComparisonResult }) {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(201,162,91,0.16),rgba(7,10,17,0.92))] p-7 shadow-[0_30px_120px_rgba(0,0,0,0.28)] lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Comparison ready</p>
          <h2 className="mt-4 font-serif text-4xl text-[var(--paper)]">
            {result.left.brand} {result.left.model} vs {result.right.brand} {result.right.model}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--paper)]/82">
            SpecDiff translates spec deltas into ownership consequences so you can decide faster and ignore the fluff.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {result.signalVsFluff.map((item) => (
            <article key={item.title} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--paper)]/84">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Key Differences" items={result.keyDifferences} />
        <SectionCard title="Real-World Impact" items={result.realWorldImpact} />
      </div>

      <section className="rounded-[28px] border border-white/10 bg-black/20 p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="font-serif text-2xl text-[var(--paper)]">Who Should Buy Which</h3>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
            buyer lenses
          </span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {result.whoShouldBuyWhich.map((item) => (
            <BuyerCard key={item.buyerType} {...item} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Overpriced Features" items={result.overpricedFeatures} />
        <SectionCard title="Hidden Downsides" items={result.hiddenDownsides} />
        <SectionCard title="Better Value Alternative" items={result.betterValueAlternative} />
      </div>
    </div>
  );
}

export function ComparisonForm() {
  const [leftInput, setLeftInput] = useState("Rolex Air-King");
  const [rightInput, setRightInput] = useState("Rolex Explorer");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function runComparison(nextLeft: string, nextRight: string) {
    setError(null);

    const response = await fetch("/api/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        leftInput: nextLeft,
        rightInput: nextRight
      })
    });

    const payload = (await response.json()) as ComparisonResponse | { error: string };

    if (isErrorResponse(payload)) {
      setResult(null);
      setError(payload.error);
      return;
    }

    if (!response.ok) {
      setResult(null);
      setError("The comparison request failed. Try again.");
      return;
    }

    setResult(payload.comparison);
  }

  function handleSubmit(formData: FormData) {
    const nextLeft = String(formData.get("leftInput") || "").trim();
    const nextRight = String(formData.get("rightInput") || "").trim();

    startTransition(() => {
      void runComparison(nextLeft, nextRight);
    });
  }

  function applyPreset(nextLeft: string, nextRight: string) {
    setLeftInput(nextLeft);
    setRightInput(nextRight);

    startTransition(() => {
      void runComparison(nextLeft, nextRight);
    });
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-8 rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-7 shadow-[0_36px_100px_rgba(0,0,0,0.24)] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-[var(--accent)]/50 bg-[var(--accent)]/12 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[var(--accent)]">
            Mechanical watches first
          </div>
          <div>
            <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] text-[var(--paper)] sm:text-6xl">
              Stop reading specs. Start understanding consequences.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--paper)]/78">
              Paste two watch names or catalog URLs. SpecDiff explains what changes on wrist, who each watch suits, and where
              marketing noise ends.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {presets.map(([presetLeft, presetRight]) => (
              <button
                key={`${presetLeft}-${presetRight}`}
                type="button"
                className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-[var(--paper)] transition hover:border-[var(--accent)]/55 hover:text-[var(--accent)]"
                onClick={() => applyPreset(presetLeft, presetRight)}
              >
                {presetLeft} vs {presetRight}
              </button>
            ))}
          </div>
        </div>

        <form action={handleSubmit} className="space-y-5 rounded-[30px] border border-white/10 bg-black/20 p-6">
          <div>
            <label htmlFor="leftInput" className="mb-2 block text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
              First watch
            </label>
            <input
              id="leftInput"
              name="leftInput"
              required
              value={leftInput}
              onChange={(event) => setLeftInput(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-base text-[var(--paper)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
              placeholder="Rolex Air-King or a supported product URL"
            />
          </div>
          <div>
            <label htmlFor="rightInput" className="mb-2 block text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
              Second watch
            </label>
            <input
              id="rightInput"
              name="rightInput"
              required
              value={rightInput}
              onChange={(event) => setRightInput(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-base text-[var(--paper)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
              placeholder="Rolex Explorer or a supported product URL"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-[var(--accent)] px-5 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--ink)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Analyzing" : "Explain the difference"}
          </button>
          <p className="text-sm leading-7 text-[var(--paper)]/68">
            V1 uses a curated enthusiast watch catalog so the comparison logic stays grounded instead of hand-wavy.
          </p>
          {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</p> : null}
        </form>
      </section>

      {result ? <ResultView result={result} /> : null}
    </div>
  );
}
