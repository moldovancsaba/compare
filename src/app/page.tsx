import { ComparisonForm } from "@/components/comparison-form";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[var(--accent)]/14 blur-3xl" />
        <div className="absolute right-[-6rem] top-[18rem] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[25%] h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">SpecDiff</p>
            <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--paper)]/70">
              AI-assisted mechanical watch comparisons that explain ownership tradeoffs in plain English.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
            V1 watch vertical
          </div>
        </div>
        <ComparisonForm />
      </div>
    </main>
  );
}
