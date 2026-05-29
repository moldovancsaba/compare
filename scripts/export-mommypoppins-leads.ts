import fs from "fs";
import path from "path";
import { buildMommyPoppinsLeadExport, normalizeLeadEvent, renderLeadExportMarkdown, renderNormalizedEventsMarkdown } from "@/lib/mommyPoppins/localAiFeed";
import type { MommyPoppinsInventoryReport } from "@/lib/mommyPoppins/types";

function getArg(flag: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const inventoryPath = getArg("--inventory") ?? path.join("docs", "reports", "mommypoppins-nyc-source-inventory-latest.json");
  const writeDir = getArg("--write-dir");
  const maxRecords = Number(getArg("--max-records") ?? "60");
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8")) as MommyPoppinsInventoryReport;
  const leads = await buildMommyPoppinsLeadExport(inventory, { maxRecords });
  const events = leads
    .map(normalizeLeadEvent)
    .filter((event) => event.eventType !== "not_event");

  if (writeDir) {
    fs.mkdirSync(writeDir, { recursive: true });
    fs.writeFileSync(path.join(writeDir, "mommypoppins-local-ai-leads-latest.json"), JSON.stringify(leads, null, 2));
    fs.writeFileSync(path.join(writeDir, "mommypoppins-local-ai-leads-latest.ndjson"), `${leads.map((lead) => JSON.stringify(lead)).join("\n")}\n`);
    fs.writeFileSync(path.join(writeDir, "mommypoppins-local-ai-leads-latest.md"), renderLeadExportMarkdown(leads));
    fs.writeFileSync(path.join(writeDir, "mommypoppins-normalized-events-latest.json"), JSON.stringify(events, null, 2));
    fs.writeFileSync(path.join(writeDir, "mommypoppins-normalized-events-latest.md"), renderNormalizedEventsMarkdown(events));
  }

  process.stdout.write(renderLeadExportMarkdown(leads));
}

main().catch((error) => {
  console.error("[export-mommypoppins-leads] failed:", error);
  process.exit(1);
});
