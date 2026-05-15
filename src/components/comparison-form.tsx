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
import {
  createMonitoredIntentEntry,
  evaluateMonitoredIntent,
  type MonitoredIntentEntry
} from "@/lib/services/monitored-intents";
import { validateComparisonInputs } from "@/lib/utils/validate-comparison-inputs";
import type { GenericComparisonResult } from "@/types/comparison";
import type { BrainState } from "@/types/watch";
import type { WatchCollectionProfile } from "@/types/watch-collection";
import type { WatchDecisionIntentProfile } from "@/types/watch-decision-intent";

interface BrainResponse {
  brain: BrainState;
}

type RecentComparisonEntry = {
  domain: string;
  leftInput: string;
  rightInput: string;
  savedComparisonPath: string | null;
  strongerChoice: string;
  summary: string;
  recordedAt: string;
};

function isErrorResponse(payload: ComparisonClientResult): payload is Extract<ComparisonClientResult, { error: string }> {
  return "error" in payload;
}

function readRecentComparisons(): RecentComparisonEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(recentComparisonsStorageKey);

    return saved ? ((JSON.parse(saved) as RecentComparisonEntry[]) ?? []) : [];
  } catch {
    window.localStorage.removeItem(recentComparisonsStorageKey);
    return [];
  }
}

function readMonitoredIntents(): MonitoredIntentEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(monitoredIntentsStorageKey);

    return saved ? ((JSON.parse(saved) as MonitoredIntentEntry[]) ?? []) : [];
  } catch {
    window.localStorage.removeItem(monitoredIntentsStorageKey);
    return [];
  }
}

const domainOptions = supportedComparisonDomainOptions();
const defaultDomain = domainOptions[0]?.domain ?? "watches";
const supportedInputOptions = supportedInputsForDomain(defaultDomain);
const watchCollectionStorageKey = "compare.watchCollectionProfile.v1";
const watchDecisionIntentStorageKey = "compare.watchDecisionIntentProfile.v1";
const recentComparisonsStorageKey = "compare.recentComparisons.v1";
const monitoredIntentsStorageKey = "compare.monitoredIntents.v1";
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
  const [leftInput, setLeftInput] = useState("");
  const [rightInput, setRightInput] = useState("");
  const [result, setResult] = useState<GenericComparisonResult | null>(null);
  const [brain, setBrain] = useState<BrainState | null>(null);
  const [savedComparisonPath, setSavedComparisonPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorReason, setErrorReason] = useState<Extract<ComparisonClientResult, { error: string }>["reason"] | null>(null);
  const [supportedInputs, setSupportedInputs] = useState(supportedInputOptions);
  const [leftSuggestions, setLeftSuggestions] = useState<string[]>([]);
  const [rightSuggestions, setRightSuggestions] = useState<string[]>([]);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const [recentComparisons, setRecentComparisons] = useState<RecentComparisonEntry[]>(() => readRecentComparisons());
  const [monitoredIntents, setMonitoredIntents] = useState<MonitoredIntentEntry[]>(() => readMonitoredIntents());
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
    window.localStorage.setItem(recentComparisonsStorageKey, JSON.stringify(recentComparisons));
  }, [recentComparisons]);

  useEffect(() => {
    window.localStorage.setItem(monitoredIntentsStorageKey, JSON.stringify(monitoredIntents));
  }, [monitoredIntents]);

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
      setErrorReason("invalid_request");
      setLeftSuggestions([]);
      setRightSuggestions([]);
      setRetryAfterSeconds(null);
      return;
    }

    setError(null);
    setErrorReason(null);
    setBrain(null);
    setLeftSuggestions([]);
    setRightSuggestions([]);
    setRetryAfterSeconds(null);

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
      setErrorReason(payload.reason ?? "unknown");
      setSupportedInputs(payload.supportedInputs ?? supportedInputsForDomain(nextDomain));
      setLeftSuggestions(payload.leftSuggestions ?? []);
      setRightSuggestions(payload.rightSuggestions ?? []);
      setRetryAfterSeconds(payload.retryAfterSeconds ?? null);
      return;
    }

    setResult(payload.comparison);
    setBrain(payload.brain);
    setSavedComparisonPath(payload.savedComparison?.persisted ? payload.savedComparison.path : null);
    setSupportedInputs(supportedInputsForDomain(nextDomain));
    setError(null);
    setErrorReason(null);
    setLeftSuggestions([]);
    setRightSuggestions([]);
    setRetryAfterSeconds(null);
    setRecentComparisons((current) =>
      [
        {
          domain: nextDomain,
          leftInput: nextLeft,
          rightInput: nextRight,
          savedComparisonPath: payload.savedComparison?.persisted ? payload.savedComparison.path : null,
          strongerChoice: payload.comparison.verdict.strongerChoice,
          summary: payload.comparison.verdict.summary,
          recordedAt: new Date().toISOString()
        },
        ...current.filter(
          (entry) =>
            !(
              entry.domain === nextDomain &&
              entry.leftInput === nextLeft &&
              entry.rightInput === nextRight
            )
        )
      ].slice(0, 8)
    );
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
      setErrorReason("invalid_request");
      setLeftSuggestions([]);
      setRightSuggestions([]);
      setRetryAfterSeconds(null);
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
    setErrorReason(null);
    setLeftSuggestions([]);
    setRightSuggestions([]);
    setRetryAfterSeconds(null);
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
    setErrorReason(null);
  }

  function clearInputs() {
    setLeftInput("");
    setRightInput("");
    setResult(null);
    setBrain(null);
    setSavedComparisonPath(null);
    setError(null);
    setErrorReason(null);
    setSupportedInputs(supportedInputsForDomain(activeDomain));
    setLeftSuggestions([]);
    setRightSuggestions([]);
    setRetryAfterSeconds(null);
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

  function saveCurrentIntentForMonitoring() {
    if (!result || result.domain !== "watches") {
      return;
    }

    const entry = createMonitoredIntentEntry(result, savedComparisonPath);

    if (!entry) {
      return;
    }

    setMonitoredIntents((current) => [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, 12));
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

        {recentComparisons.length ? (
          <section className="surface-card p-5 shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow eyebrow-wide">Recent comparisons</p>
                <h3 className="title-section mt-3">Pick up a recent decision</h3>
              </div>
              <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">stored in this browser</span>
            </div>
            <div className="mt-5 grid gap-3">
              {recentComparisons.map((entry) => (
                <button
                  key={`${entry.domain}:${entry.leftInput}:${entry.rightInput}`}
                  type="button"
                  className="surface-item p-4 text-left transition hover:opacity-90"
                  onClick={() => {
                    setActiveDomain(entry.domain);
                    setLeftInput(entry.leftInput);
                    setRightInput(entry.rightInput);
                    startTransition(() => {
                      void runComparison(entry.leftInput, entry.rightInput, entry.domain);
                    });
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="body-copy body-copy-strong text-sm">
                        {entry.leftInput} vs {entry.rightInput}
                      </p>
                      <p className="body-copy body-copy-faint mt-2 text-sm">{entry.summary}</p>
                    </div>
                    <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">
                      stronger choice: {entry.strongerChoice}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {!result && !error && !isPending ? (
          <section className="surface-card p-6 shadow-none">
            <p className="eyebrow eyebrow-wide">State</p>
            <h3 className="title-section mt-3">Ready for a comparison</h3>
            <p className="body-copy body-copy-faint mt-3 text-sm">
              Start with two supported inputs in the same domain. The first result screen will lead with the stronger
              choice, exception case, and evidence limits before any deeper analysis.
            </p>
          </section>
        ) : null}

        {isPending ? (
          <section className="surface-card p-6 shadow-none">
            <p className="eyebrow eyebrow-wide">State</p>
            <h3 className="title-section mt-3">Building the recommendation</h3>
            <p className="body-copy body-copy-faint mt-3 text-sm">
              {activeDomain === "watches"
                ? "Resolving the watches, checking supported source rules, and running deterministic tradeoff logic."
                : "Resolving both inputs and preparing the verdict-led comparison."}
            </p>
          </section>
        ) : null}

        {!result && error ? (
          <section className="surface-card p-6 shadow-none">
            <p className="eyebrow eyebrow-wide">State</p>
            <h3 className="title-section mt-3">
              {errorReason === "rate_limited"
                ? "Too many requests"
                : errorReason === "unsupported_source"
                  ? "Unsupported source URL"
                  : errorReason === "unsupported_input"
                    ? "Input needs correction"
                    : "Comparison could not run"}
            </h3>
            <p className="body-copy body-copy-faint mt-3 text-sm">{error}</p>
            {retryAfterSeconds ? (
              <p className="body-copy body-copy-soft mt-3 text-sm">Retry after about {retryAfterSeconds} seconds.</p>
            ) : null}

            {leftSuggestions.length || rightSuggestions.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {leftSuggestions.length ? (
                  <div className="surface-item p-4">
                    <p className="eyebrow">Suggestions for the first input</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {leftSuggestions.map((suggestion) => (
                        <button
                          key={`left-${suggestion}`}
                          type="button"
                          className="pill-muted body-copy-strong px-4 py-2 text-sm transition"
                          onClick={() => setLeftInput(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {rightSuggestions.length ? (
                  <div className="surface-item p-4">
                    <p className="eyebrow">Suggestions for the second input</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rightSuggestions.map((suggestion) => (
                        <button
                          key={`right-${suggestion}`}
                          type="button"
                          className="pill-muted body-copy-strong px-4 py-2 text-sm transition"
                          onClick={() => setRightInput(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {result?.domain === "watches" ? (
          <section className="surface-card p-6 shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow eyebrow-wide">Saved-intent monitoring</p>
                <h3 className="title-section mt-3">Watch for price or spec changes</h3>
              </div>
              <button
                type="button"
                className="pill-accent eyebrow eyebrow-tight px-4 py-2"
                onClick={saveCurrentIntentForMonitoring}
              >
                Monitor this comparison
              </button>
            </div>
            <p className="body-copy body-copy-faint mt-3 text-sm">
              This slice stays local-first and deterministic. It compares saved catalog snapshots against the current
              curated catalog for price and spec deltas without polling brand sites in the request path.
            </p>
            {monitoredIntents.length ? (
              <div className="mt-5 grid gap-3">
                {monitoredIntents.map((entry) => {
                  const changes = evaluateMonitoredIntent(entry);

                  return (
                    <div key={entry.id} className="surface-item p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="body-copy body-copy-strong text-sm">
                            {entry.leftLabel} vs {entry.rightLabel}
                          </p>
                          <p className="body-copy body-copy-faint mt-2 text-sm">
                            Stronger choice at save time: {entry.strongerChoice}
                          </p>
                        </div>
                        <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">
                          {changes.length ? `${changes.length} changes` : "no changes"}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {changes.length ? (
                          changes.map((change, index) => (
                            <p key={`${entry.id}-${change.kind}-${index}`} className="body-copy body-copy-faint text-sm">
                              <span className="body-copy-strong">{change.watchLabel}</span>: {change.summary}
                            </p>
                          ))
                        ) : (
                          <p className="body-copy body-copy-faint text-sm">
                            No monitored price or spec deltas are present against the current curated catalog.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : null}

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
