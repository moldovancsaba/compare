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
              The shortest path to decision confidence across supported comparison domains.
            </p>
          </div>
          <div className="pill-muted text-accent eyebrow eyebrow-wide px-4 py-2">
            {appVersionLabel} adapter platform
          </div>
        </div>
        <ComparisonForm />
      </div>
    </main>
  );
}
