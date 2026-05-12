"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { ComparisonHero } from "@/components/comparison-hero";
import { ComparisonInputForm } from "@/components/comparison-input-form";
import { ComparisonResultView } from "@/components/comparison-result";
import { watchCatalog } from "@/lib/data/watch-catalog";
import { type ComparisonClientResult, requestComparison } from "@/lib/services/compare-client";
import { validateComparisonInputs } from "@/lib/utils/validate-comparison-inputs";
import type { BrainState, ComparisonResult } from "@/types/watch";

interface BrainResponse {
  brain: BrainState;
}

function isErrorResponse(payload: ComparisonClientResult): payload is Extract<ComparisonClientResult, { error: string }> {
  return "error" in payload;
}

const supportedInputOptions = watchCatalog.map((watch) => `${watch.brand} ${watch.model}`);

export function ComparisonForm() {
  const [leftInput, setLeftInput] = useState("Rolex Air-King");
  const [rightInput, setRightInput] = useState("Rolex Explorer");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [brain, setBrain] = useState<BrainState | null>(null);
  const [savedComparisonPath, setSavedComparisonPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supportedInputs, setSupportedInputs] = useState(supportedInputOptions);
  const [isBrainRefreshing, setIsBrainRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inlineValidation = useMemo(
    () => validateComparisonInputs(leftInput, rightInput),
    [leftInput, rightInput]
  );

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

  async function refreshBrain() {
    if (!brain?.comparisonRef) {
      return;
    }

    setIsBrainRefreshing(true);

    try {
      const response = await fetch(`/api/compare/brain?comparisonRef=${encodeURIComponent(brain.comparisonRef)}`);
      const payload = (await response.json()) as BrainResponse | { error: string };

      if (response.ok && "brain" in payload) {
        setBrain(payload.brain);
      } else {
        setBrain({
          status: "unavailable",
          comparisonRef: brain.comparisonRef,
          message: "Trinity Brain status is temporarily unavailable."
        });
      }
    } catch {
      setBrain({
        status: "unavailable",
        comparisonRef: brain.comparisonRef,
        message: "Trinity Brain status is temporarily unavailable."
      });
    } finally {
      setIsBrainRefreshing(false);
    }
  }

  async function runComparison(nextLeft: string, nextRight: string) {
    const validation = validateComparisonInputs(nextLeft, nextRight);

    if (!validation.valid) {
      setResult(null);
      setBrain(null);
      setSavedComparisonPath(null);
      setError(validation.message);
      return;
    }

    setError(null);
    setBrain(null);

    const payload = await requestComparison(nextLeft, nextRight);

    if (isErrorResponse(payload)) {
      setResult(null);
      setBrain(null);
      setSavedComparisonPath(null);
      setError(payload.error);
      setSupportedInputs(payload.supportedInputs ?? supportedInputOptions);
      return;
    }

    setResult(payload.comparison);
    setBrain(payload.brain);
    setSavedComparisonPath(payload.savedComparison?.persisted ? payload.savedComparison.path : null);
    setSupportedInputs(supportedInputOptions);
  }

  function handleSubmit(formData: FormData) {
    const nextLeft = String(formData.get("leftInput") || "").trim();
    const nextRight = String(formData.get("rightInput") || "").trim();
    const validation = validateComparisonInputs(nextLeft, nextRight);

    if (!validation.valid) {
      setResult(null);
      setBrain(null);
      setSavedComparisonPath(null);
      setError(validation.message);
      return;
    }

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

  function applySupportedInput(nextInput: string) {
    if (!leftInput.trim()) {
      setLeftInput(nextInput);
      return;
    }

    if (!rightInput.trim() || rightInput === leftInput) {
      setRightInput(nextInput);
      return;
    }

    setRightInput(nextInput);
  }

  function swapInputs() {
    setLeftInput(rightInput);
    setRightInput(leftInput);
    setError(null);
  }

  function clearInputs() {
    setLeftInput("");
    setRightInput("");
    setResult(null);
    setBrain(null);
    setSavedComparisonPath(null);
    setError(null);
    setSupportedInputs(supportedInputOptions);
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
          supportedInputs={supportedInputs}
          validationMessage={inlineValidation.valid ? null : inlineValidation.message}
          onLeftInputChange={setLeftInput}
          onRightInputChange={setRightInput}
          onUseAsLeft={setLeftInput}
          onUseAsRight={setRightInput}
          onUseSupportedInput={applySupportedInput}
          onSwapInputs={swapInputs}
          onClearInputs={clearInputs}
          onSubmit={handleSubmit}
        />
      </section>

      {result ? (
        <ComparisonResultView
          brain={brain}
          isBrainRefreshing={isBrainRefreshing}
          result={result}
          savedComparisonPath={savedComparisonPath}
          onRefreshBrain={() => void refreshBrain()}
        />
      ) : null}
    </div>
  );
}
