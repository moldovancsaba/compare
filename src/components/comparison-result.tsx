"use client";

import type { ComparisonResult } from "@/types/watch";

function SectionCard({
  title,
  items
}: {
  title: string;
  items: Array<{ title: string; summary: string }>;
}) {
  return (
    <section className="surface-card p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="title-section">{title}</h3>
        <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">{items.length} notes</span>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <article key={`${title}-${item.title}`} className="surface-item p-4">
            <h4 className="card-kicker mb-2">{item.title}</h4>
            <p className="body-copy body-copy-strong text-sm">{item.summary}</p>
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
    <article className="surface-panel p-5">
      <p className="eyebrow">{buyerType}</p>
      <h4 className="title-section mt-3">{pick}</h4>
      <p className="body-copy mt-3 text-sm">{reason}</p>
    </article>
  );
}

export function ComparisonResultView({ result }: { result: ComparisonResult }) {
  return (
    <div className="space-y-8">
      <section className="surface-hero grid gap-4 p-7 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="eyebrow eyebrow-wide">Comparison ready</p>
          <h2 className="title-section mt-4 text-4xl">
            {result.left.brand} {result.left.model} vs {result.right.brand} {result.right.model}
          </h2>
          <p className="body-copy mt-4 max-w-2xl">
            SpecDiff translates spec deltas into ownership consequences so you can decide faster and ignore the fluff.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {result.signalVsFluff.map((item) => (
            <article key={item.title} className="surface-card p-4 shadow-none">
              <p className="eyebrow">{item.title}</p>
              <p className="body-copy body-copy-strong mt-3 text-sm">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Key Differences" items={result.keyDifferences} />
        <SectionCard title="Real-World Impact" items={result.realWorldImpact} />
      </div>

      <section className="surface-card p-6 shadow-none">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="title-section">Who Should Buy Which</h3>
          <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">buyer lenses</span>
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
