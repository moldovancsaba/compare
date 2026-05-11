import { ComparisonForm } from "@/components/comparison-form";
import { appName, appVersionLabel } from "@/lib/config/app";

export default function HomePage() {
  return (
    <main className="app-shell min-h-screen">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb-gold absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full blur-3xl" />
        <div className="ambient-orb-sky absolute right-[-6rem] top-[18rem] h-96 w-96 rounded-full blur-3xl" />
        <div className="ambient-orb-emerald absolute bottom-[-8rem] left-[25%] h-80 w-80 rounded-full blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="eyebrow eyebrow-xwide">{appName}</p>
            <p className="body-copy body-copy-soft mt-2 max-w-xl text-sm">
              AI-assisted mechanical watch comparisons that explain ownership tradeoffs in plain English.
            </p>
          </div>
          <div className="pill-muted text-accent eyebrow eyebrow-wide px-4 py-2">
            {appVersionLabel} watch vertical
          </div>
        </div>
        <ComparisonForm />
      </div>
    </main>
  );
}
