"use client";

import { useEffect, useState, useTransition } from "react";

import { ComparisonHero } from "@/components/comparison-hero";
import { ComparisonInputForm } from "@/components/comparison-input-form";
import { ComparisonResultView } from "@/components/comparison-result";
import { type ComparisonResponse, requestComparison } from "@/lib/services/compare-client";
import type { BrainState, ComparisonResult } from "@/types/watch";

interface BrainResponse {
  brain: BrainState;
}

function isErrorResponse(payload: ComparisonResponse | { error: string }): payload is { error: string } {
  return "error" in payload;
}

export function ComparisonForm() {
  const [leftInput, setLeftInput] = useState("Rolex Air-King");
  const [rightInput, setRightInput] = useState("Rolex Explorer");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [brain, setBrain] = useState<BrainState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!brain || (brain.status !== "queued" && brain.status !== "running")) {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/compare/brain?comparisonRef=${encodeURIComponent(brain.comparisonRef)}`);
        const payload = (await response.json()) as BrainResponse | { error: string };
        if (!cancelled && response.ok && "brain" in payload) {
          setBrain(payload.brain);
        }
      } catch {
        if (!cancelled) {
          setBrain({
            status: "unavailable",
            comparisonRef: brain.comparisonRef,
            message: "Trinity Brain status is temporarily unavailable."
          });
        }
      }
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [brain]);

  async function runComparison(nextLeft: string, nextRight: string) {
    setError(null);
    setBrain(null);

    const payload = await requestComparison(nextLeft, nextRight);

    if (isErrorResponse(payload)) {
      setResult(null);
      setBrain(null);
      setError(payload.error);
      return;
    }

    setResult(payload.comparison);
    setBrain(payload.brain);
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
      <section className="surface-panel surface-shell grid gap-8 p-7 lg:grid-cols-[1.15fr_0.85fr]">
        <ComparisonHero onApplyPreset={applyPreset} />
        <ComparisonInputForm
          error={error}
          isPending={isPending}
          leftInput={leftInput}
          rightInput={rightInput}
          onLeftInputChange={setLeftInput}
          onRightInputChange={setRightInput}
          onSubmit={handleSubmit}
        />
      </section>

      {result ? <ComparisonResultView brain={brain} result={result} /> : null}
    </div>
  );
}
