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
      <div className="pill-accent inline-flex px-4 py-2 eyebrow eyebrow-xwide">Pick faster, inspect deeper only if needed</div>
      <div>
        <h1 className="title-hero max-w-3xl">Ask one comparison question. Get one clear recommendation.</h1>
        <p className="body-copy body-copy-muted mt-5 max-w-2xl">
          {appName} is most useful when you already have two options in mind and want the strongest choice, the
          exception case, and the reasons that actually matter.
        </p>
      </div>
      <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
        {[
          "Winner first",
          "Exception case",
          "Evidence on demand"
        ].map((promise) => (
          <div key={promise} className="surface-item px-4 py-3">
            <p className="eyebrow text-accent">{promise}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="eyebrow mb-3">Start with an example</p>
        <div className="grid gap-3 sm:grid-cols-2">
        {presets.map((preset) => (
          <button
            key={`${preset.domain}-${preset.left}-${preset.right}`}
            type="button"
              className="surface-item px-4 py-4 text-left transition hover:border-[color:var(--accent)]"
            onClick={() => onApplyPreset(preset.left, preset.right, preset.domain)}
          >
              <p className="eyebrow text-accent">{preset.domain}</p>
              <p className="body-copy body-copy-strong mt-2 text-sm">
                {preset.left} vs {preset.right}
              </p>
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
