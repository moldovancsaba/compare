import fs from "node:fs/promises";
import path from "node:path";
import { buildCatalogWatchdogReportFromDb, renderCatalogWatchdogMarkdown } from "@/lib/catalogOps/watchdog";
import { getDb } from "@/lib/mongodb";

function readNumberFlag(name: string) {
  const flag = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (!flag) return undefined;
  const value = Number(flag.slice(name.length + 3));
  return Number.isFinite(value) ? value : undefined;
}

async function main() {
  const writeDirArg = process.argv.find((arg) => arg.startsWith("--write-dir="));
  const writeDir = writeDirArg ? writeDirArg.slice("--write-dir=".length) : "docs/reports";
  const outputDir = path.resolve(process.cwd(), writeDir);
  await fs.mkdir(outputDir, { recursive: true });

  const db = await getDb();
  if (!db) throw new Error("No database available. Set MONGODB_URI before running the catalog watchdog.");

  const report = await buildCatalogWatchdogReportFromDb(db, {
    config: {
      providerSilenceHours: readNumberFlag("provider-silence-hours"),
      meetupSilenceHours: readNumberFlag("meetup-silence-hours"),
      staleProviderHours: readNumberFlag("stale-provider-hours"),
    },
  });

  await Promise.all([
    fs.writeFile(path.join(outputDir, "catalog-watchdog-latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8"),
    fs.writeFile(path.join(outputDir, "catalog-watchdog-latest.md"), renderCatalogWatchdogMarkdown(report), "utf8"),
  ]);

  console.log(`Wrote catalog watchdog artifacts to ${outputDir}`);
  if (report.incidents.length > 0) {
    console.log(`Incidents: ${report.incidents.map((incident) => incident.code).join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
