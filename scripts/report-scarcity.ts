import fs from "fs";
import path from "path";
import type { Provider } from "@/types/provider";
import type { MeetupGroup } from "@/types/meetup";
import { buildScarcityReport, renderScarcityMarkdown } from "@/lib/scarcityReport";

function getArg(flag: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function main() {
  const providers = await fetchJson<Provider[]>("https://classscout.vercel.app/api/public/providers");
  const meetups = await fetchJson<MeetupGroup[]>("https://classscout.vercel.app/api/public/meetup-groups");
  const report = buildScarcityReport(providers, meetups);
  const markdown = renderScarcityMarkdown(report);
  const writeDir = getArg("--write-dir");
  if (writeDir) {
    fs.mkdirSync(writeDir, { recursive: true });
    fs.writeFileSync(path.join(writeDir, "scarcity-report-latest.json"), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(writeDir, "scarcity-report-latest.md"), markdown);
  }
  process.stdout.write(markdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
