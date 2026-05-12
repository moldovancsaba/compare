"use client";

import { appName } from "@/lib/config/app";

const presets = [
  ["Rolex Air-King", "Rolex Explorer"],
  ["Tudor Black Bay 58", "Tudor Pelagos 39"],
  ["Omega Aqua Terra 38", "Tudor Black Bay 54"]
] as const;

export function ComparisonHero({
  onApplyPreset
}: {
  onApplyPreset: (left: string, right: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="pill-accent inline-flex px-4 py-2 eyebrow eyebrow-xwide">Buying confidence, not spec tables</div>
      <div>
        <h1 className="title-hero max-w-3xl">Stop reading twelve reviews to compare two watches.</h1>
        <p className="body-copy body-copy-muted mt-5 max-w-2xl">
          Paste two watch names or catalog URLs. {appName} explains the real differences: wearability, ownership friction,
          value, hidden tradeoffs, and which watch actually fits your life.
        </p>
      </div>
      <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
        {["Instant verdict", "Marketing vs reality", "Buy-this-if logic"].map((promise) => (
          <div key={promise} className="surface-item px-4 py-3">
            <p className="eyebrow text-accent">{promise}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {presets.map(([presetLeft, presetRight]) => (
          <button
            key={`${presetLeft}-${presetRight}`}
            type="button"
            className="pill-muted body-copy-strong px-4 py-2 text-sm transition"
            onClick={() => onApplyPreset(presetLeft, presetRight)}
          >
            {presetLeft} vs {presetRight}
          </button>
        ))}
      </div>
    </div>
  );
}
