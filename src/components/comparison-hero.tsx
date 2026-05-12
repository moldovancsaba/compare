"use client";

import { appName } from "@/lib/config/app";

const presets = [
  {
    domain: "watches",
    left: "Rolex Air-King",
    right: "Rolex Explorer"
  },
  {
    domain: "watches",
    left: "Tudor Black Bay 58",
    right: "Tudor Pelagos 39"
  },
  {
    domain: "services",
    left: "Managed Customer Support",
    right: "AI Support Automation"
  },
  {
    domain: "services",
    left: "Fractional CFO Retainer",
    right: "Bookkeeping Service"
  }
] as const;

export function ComparisonHero({
  onApplyPreset
}: {
  onApplyPreset: (left: string, right: string, domain: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="pill-accent inline-flex px-4 py-2 eyebrow eyebrow-xwide">Decision confidence, not spec tables</div>
      <div>
        <h1 className="title-hero max-w-3xl">Decision intelligence for comparisons that deserve a real answer.</h1>
        <p className="body-copy body-copy-muted mt-5 max-w-2xl">
          {appName} compares domain entities through the same structure: verdict, tradeoffs, hidden downsides,
          evidence, and practical consequences. Watches and business services are the first live adapters.
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
        {presets.map((preset) => (
          <button
            key={`${preset.domain}-${preset.left}-${preset.right}`}
            type="button"
            className="pill-muted body-copy-strong px-4 py-2 text-sm transition"
            onClick={() => onApplyPreset(preset.left, preset.right, preset.domain)}
          >
            {preset.left} vs {preset.right}
          </button>
        ))}
      </div>
    </div>
  );
}
