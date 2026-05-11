"use client";

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
      <div className="pill-accent inline-flex px-4 py-2 eyebrow eyebrow-xwide">Mechanical watches first</div>
      <div>
        <h1 className="title-hero max-w-3xl">Stop reading specs. Start understanding consequences.</h1>
        <p className="body-copy body-copy-muted mt-5 max-w-2xl">
          Paste two watch names or catalog URLs. SpecDiff explains what changes on wrist, who each watch suits, and where
          marketing noise ends.
        </p>
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
