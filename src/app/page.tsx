import { ComparisonForm } from "@/components/comparison-form";
import { appName, appVersionLabel } from "@/lib/config/app";

export default function HomePage() {
  return (
    <main className="app-shell min-h-screen">
      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="eyebrow eyebrow-xwide">{appName}</p>
            <p className="body-copy body-copy-soft mt-2 max-w-xl text-sm">
              Start with the decision. Open the deeper reasoning only when you need it.
            </p>
          </div>
          <div className="pill-muted text-accent eyebrow eyebrow-wide px-4 py-2">
            {appVersionLabel} adapter platform
          </div>
        </div>
        <ComparisonForm />
        <section className="mt-12 grid gap-6 lg:grid-cols-3">
          <article className="surface-card p-6">
            <p className="eyebrow eyebrow-wide">Why it exists</p>
            <h2 className="title-section mt-3">Comparison help, not catalog theater</h2>
            <p className="body-copy body-copy-faint mt-3 text-sm">
              {appName} is built to reduce decision regret. It leads with the stronger choice, then shows the evidence,
              limits, and exception case without forcing you through generic spec-dump pages.
            </p>
          </article>
          <article className="surface-card p-6">
            <p className="eyebrow eyebrow-wide">How it stays useful</p>
            <h2 className="title-section mt-3">Deterministic and source-aware</h2>
            <p className="body-copy body-copy-faint mt-3 text-sm">
              Supported watch comparisons use curated catalog rows, canonical product URLs, deterministic ownership
              rules, and explicit confidence limits. Unsupported or ambiguous inputs fail closed instead of guessing.
            </p>
          </article>
          <article className="surface-card p-6">
            <p className="eyebrow eyebrow-wide">What to expect</p>
            <h2 className="title-section mt-3">Useful for category intent</h2>
            <p className="body-copy body-copy-faint mt-3 text-sm">
              Use it for questions like Rolex Explorer vs Air-King, Pelagos 39 vs Black Bay 54, or whether a more
              technical but less liquid alternative is actually the smarter buy.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
