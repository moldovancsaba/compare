"use client";

import { useState, useTransition } from "react";

import { ComparisonHero } from "@/components/comparison-hero";
import { ComparisonInputForm } from "@/components/comparison-input-form";
import { ComparisonResultView } from "@/components/comparison-result";
import type { ComparisonResult } from "@/types/watch";

interface ComparisonResponse {
  comparison: ComparisonResult;
}

function isErrorResponse(payload: ComparisonResponse | { error: string }): payload is { error: string } {
  return "error" in payload;
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

      {result ? <ComparisonResultView result={result} /> : null}
    </div>
  );
}
