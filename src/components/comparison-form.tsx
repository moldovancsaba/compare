"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { ComparisonHero } from "@/components/comparison-hero";
import { ComparisonInputForm } from "@/components/comparison-input-form";
import { ComparisonResultView } from "@/components/comparison-result";
import { WatchCollectionProfilePanel } from "@/components/watch-collection-profile-panel";
import { normalizeWatchDecisionIntentProfile } from "@/lib/domains/watch-decision-intent";
import { normalizeWatchCollectionProfile } from "@/lib/domains/watch-collection";
import { supportedComparisonDomainOptions, supportedInputsForDomain } from "@/lib/services/compare";
import { type ComparisonClientResult, requestComparison } from "@/lib/services/compare-client";
import { validateComparisonInputs } from "@/lib/utils/validate-comparison-inputs";
import type { GenericComparisonResult } from "@/types/comparison";
import type { BrainState } from "@/types/watch";
import type { WatchCollectionProfile } from "@/types/watch-collection";
import type { WatchDecisionIntentProfile } from "@/types/watch-decision-intent";

interface BrainResponse {
  brain: BrainState;
}

function isErrorResponse(payload: ComparisonClientResult): payload is Extract<ComparisonClientResult, { error: string }> {
  return "error" in payload;
}

const domainOptions = supportedComparisonDomainOptions();
const defaultDomain = domainOptions[0]?.domain ?? "watches";
const supportedInputOptions = supportedInputsForDomain(defaultDomain);
const watchCollectionStorageKey = "compare.watchCollectionProfile.v1";
const watchDecisionIntentStorageKey = "compare.watchDecisionIntentProfile.v1";
const emptyWatchCollectionProfile: WatchCollectionProfile = {
  items: [],
  preferredBrands: []
};
const emptyWatchDecisionIntentProfile: WatchDecisionIntentProfile = {};

function hasWatchDecisionIntentProfile(profile: WatchDecisionIntentProfile): boolean {
  return Boolean(
    profile.wristSizeBand ||
      profile.primaryUseCase ||
      profile.stylePreference ||
      profile.brandCachetTolerance ||
      profile.dateWindowPreference ||
      profile.budgetSensitivity !== undefined ||
      profile.comfortPriority !== undefined
  );
}

export function ComparisonForm() {
  const [activeDomain, setActiveDomain] = useState(defaultDomain);
  const [leftInput, setLeftInput] = useState("Rolex Air-King");
  const [rightInput, setRightInput] = useState("Rolex Explorer");
  const [result, setResult] = useState<GenericComparisonResult | null>(null);
  const [brain, setBrain] = useState<BrainState | null>(null);
  const [savedComparisonPath, setSavedComparisonPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supportedInputs, setSupportedInputs] = useState(supportedInputOptions);
  const [watchCollectionProfile, setWatchCollectionProfile] = useState<WatchCollectionProfile>(() => {
    if (typeof window === "undefined") {
      return emptyWatchCollectionProfile;
    }

    const savedProfile = window.localStorage.getItem(watchCollectionStorageKey);

    if (!savedProfile) {
      return emptyWatchCollectionProfile;
    }

    try {
      return normalizeWatchCollectionProfile(JSON.parse(savedProfile)) ?? emptyWatchCollectionProfile;
    } catch {
      window.localStorage.removeItem(watchCollectionStorageKey);
      return emptyWatchCollectionProfile;
    }
  });
  const [watchDecisionIntentProfile, setWatchDecisionIntentProfile] = useState<WatchDecisionIntentProfile>(() => {
    if (typeof window === "undefined") {
      return emptyWatchDecisionIntentProfile;
    }

    const savedProfile = window.localStorage.getItem(watchDecisionIntentStorageKey);

    if (!savedProfile) {
      return emptyWatchDecisionIntentProfile;
    }

    try {
      return normalizeWatchDecisionIntentProfile(JSON.parse(savedProfile)) ?? emptyWatchDecisionIntentProfile;
    } catch {
      window.localStorage.removeItem(watchDecisionIntentStorageKey);
      return emptyWatchDecisionIntentProfile;
    }
  });
  const [isBrainRefreshing, setIsBrainRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inlineValidation = useMemo(
    () => validateComparisonInputs(leftInput, rightInput, activeDomain),
    [activeDomain, leftInput, rightInput]
  );

  useEffect(() => {
    window.localStorage.setItem(watchCollectionStorageKey, JSON.stringify(watchCollectionProfile));
  }, [watchCollectionProfile]);

  useEffect(() => {
    window.localStorage.setItem(watchDecisionIntentStorageKey, JSON.stringify(watchDecisionIntentProfile));
  }, [watchDecisionIntentProfile]);

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

  async function runComparison(nextLeft: string, nextRight: string, nextDomain = activeDomain) {
    const validation = validateComparisonInputs(nextLeft, nextRight, nextDomain);

    if (!validation.valid) {
      setResult(null);
      setBrain(null);
      setSavedComparisonPath(null);
      setError(validation.message);
      return;
    }

    setError(null);
    setBrain(null);

    const context =
      nextDomain === "watches"
        ? {
            ...(watchCollectionProfile.items.length || watchCollectionProfile.preferredBrands.length
              ? { watchCollectionProfile }
              : {}),
            ...(hasWatchDecisionIntentProfile(watchDecisionIntentProfile)
              ? { watchDecisionIntentProfile }
              : {})
          }
        : undefined;
    const payload = await requestComparison(nextLeft, nextRight, nextDomain, context);

    if (isErrorResponse(payload)) {
      setResult(null);
      setBrain(null);
      setSavedComparisonPath(null);
      setError(payload.error);
      setSupportedInputs(payload.supportedInputs ?? supportedInputsForDomain(nextDomain));
      return;
    }

    setResult(payload.comparison);
    setBrain(payload.brain);
    setSavedComparisonPath(payload.savedComparison?.persisted ? payload.savedComparison.path : null);
    setSupportedInputs(supportedInputsForDomain(nextDomain));
  }

  function handleSubmit(formData: FormData) {
    const nextDomain = String(formData.get("domain") || activeDomain).trim();
    const nextLeft = String(formData.get("leftInput") || "").trim();
    const nextRight = String(formData.get("rightInput") || "").trim();
    const validation = validateComparisonInputs(nextLeft, nextRight, nextDomain);

    if (!validation.valid) {
      setResult(null);
      setBrain(null);
      setSavedComparisonPath(null);
      setError(validation.message);
      return;
    }

    startTransition(() => {
      void runComparison(nextLeft, nextRight, nextDomain);
    });
  }

  function applyPreset(nextLeft: string, nextRight: string, nextDomain: string) {
    const nextSupportedInputs = supportedInputsForDomain(nextDomain);
    setActiveDomain(nextDomain);
    setSupportedInputs(nextSupportedInputs);
    setLeftInput(nextLeft);
    setRightInput(nextRight);

    startTransition(() => {
      void runComparison(nextLeft, nextRight, nextDomain);
    });
  }

  function changeDomain(nextDomain: string) {
    const nextSupportedInputs = supportedInputsForDomain(nextDomain);
    setActiveDomain(nextDomain);
    setSupportedInputs(nextSupportedInputs);
    setLeftInput(nextSupportedInputs[0] ?? "");
    setRightInput(nextSupportedInputs[1] ?? "");
    setResult(null);
    setBrain(null);
    setSavedComparisonPath(null);
    setError(null);
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
    setSupportedInputs(supportedInputsForDomain(activeDomain));
  }

  function updateDecisionIntent(nextProfile: WatchDecisionIntentProfile) {
    setWatchDecisionIntentProfile(normalizeWatchDecisionIntentProfile(nextProfile) ?? emptyWatchDecisionIntentProfile);
  }

  function updateDecisionIntentNumber(key: "budgetSensitivity" | "comfortPriority", value: number) {
    updateDecisionIntent({
      ...watchDecisionIntentProfile,
      [key]: value
    });
  }

  function updateDecisionIntentText<K extends keyof WatchDecisionIntentProfile>(key: K, value: string) {
    updateDecisionIntent({
      ...watchDecisionIntentProfile,
      [key]: value || undefined
    });
  }

  return (
    <div className="space-y-10">
      <section className="surface-panel surface-shell grid gap-8 p-7 layout-form-shell">
        <ComparisonHero onApplyPreset={applyPreset} />
        <ComparisonInputForm
          activeDomain={activeDomain}
          domainOptions={domainOptions}
          error={error}
          isPending={isPending}
          leftInput={leftInput}
          rightInput={rightInput}
          supportedInputs={supportedInputs}
          validationMessage={inlineValidation.valid ? null : inlineValidation.message}
          onDomainChange={changeDomain}
          onLeftInputChange={setLeftInput}
          onRightInputChange={setRightInput}
          onUseAsLeft={setLeftInput}
          onUseAsRight={setRightInput}
          onUseSupportedInput={applySupportedInput}
          onSwapInputs={swapInputs}
          onClearInputs={clearInputs}
          onSubmit={handleSubmit}
        />

        {activeDomain === "watches" ? (
          <section className="surface-card p-5 shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow eyebrow-wide">Decision intent</p>
                <h3 className="title-section mt-3">Optional buying context</h3>
              </div>
              <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">stored in this browser</span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label>
                <span className="eyebrow mb-2 block">Wrist size</span>
                <select
                  className="field-input w-full px-4 py-3 text-sm"
                  value={watchDecisionIntentProfile.wristSizeBand ?? ""}
                  onChange={(event) => updateDecisionIntentText("wristSizeBand", event.target.value)}
                >
                  <option value="">No preference</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </label>
              <label>
                <span className="eyebrow mb-2 block">Primary use</span>
                <select
                  className="field-input w-full px-4 py-3 text-sm"
                  value={watchDecisionIntentProfile.primaryUseCase ?? ""}
                  onChange={(event) => updateDecisionIntentText("primaryUseCase", event.target.value)}
                >
                  <option value="">No preference</option>
                  <option value="daily">Daily</option>
                  <option value="dress">Dress</option>
                  <option value="sport">Sport</option>
                  <option value="collection">Collection</option>
                </select>
              </label>
              <label>
                <span className="eyebrow mb-2 block">Style</span>
                <select
                  className="field-input w-full px-4 py-3 text-sm"
                  value={watchDecisionIntentProfile.stylePreference ?? ""}
                  onChange={(event) => updateDecisionIntentText("stylePreference", event.target.value)}
                >
                  <option value="">No preference</option>
                  <option value="understated">Understated</option>
                  <option value="tool">Tool</option>
                  <option value="dress_sport">Dress-sport</option>
                </select>
              </label>
              <label>
                <span className="eyebrow mb-2 block">Brand cachet</span>
                <select
                  className="field-input w-full px-4 py-3 text-sm"
                  value={watchDecisionIntentProfile.brandCachetTolerance ?? ""}
                  onChange={(event) => updateDecisionIntentText("brandCachetTolerance", event.target.value)}
                >
                  <option value="">No preference</option>
                  <option value="low">Low tolerance</option>
                  <option value="medium">Medium</option>
                  <option value="high">High tolerance</option>
                </select>
              </label>
              <label>
                <span className="eyebrow mb-2 block">Date window</span>
                <select
                  className="field-input w-full px-4 py-3 text-sm"
                  value={watchDecisionIntentProfile.dateWindowPreference ?? ""}
                  onChange={(event) => updateDecisionIntentText("dateWindowPreference", event.target.value)}
                >
                  <option value="">No preference</option>
                  <option value="prefer_no_date">Prefer no date</option>
                  <option value="prefer_date">Prefer date</option>
                </select>
              </label>
              <label>
                <span className="eyebrow mb-2 block">Budget sensitivity</span>
                <input
                  className="w-full accent-current"
                  max={5}
                  min={0}
                  type="range"
                  value={watchDecisionIntentProfile.budgetSensitivity ?? 0}
                  onChange={(event) => updateDecisionIntentNumber("budgetSensitivity", Number(event.target.value))}
                />
              </label>
              <label>
                <span className="eyebrow mb-2 block">Comfort priority</span>
                <input
                  className="w-full accent-current"
                  max={5}
                  min={0}
                  type="range"
                  value={watchDecisionIntentProfile.comfortPriority ?? 0}
                  onChange={(event) => updateDecisionIntentNumber("comfortPriority", Number(event.target.value))}
                />
              </label>
              <button
                type="button"
                className="pill-muted eyebrow eyebrow-tight px-4 py-3 text-left"
                onClick={() => setWatchDecisionIntentProfile(emptyWatchDecisionIntentProfile)}
              >
                Clear intent
              </button>
            </div>
          </section>
        ) : null}
      </section>

      <WatchCollectionProfilePanel
        activeDomain={activeDomain}
        profile={watchCollectionProfile}
        onChange={setWatchCollectionProfile}
      />

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
