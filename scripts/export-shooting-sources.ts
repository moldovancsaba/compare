import fs from "node:fs";
import path from "node:path";
import { buildShootingSourceInventory, renderShootingSourceInventoryMarkdown } from "@/lib/shootingIngestion/sourceInventory";
import { getShootingSourceSeeds } from "@/lib/shootingIngestion/sourceSeeds";

function getWriteDir() {
  const idx = process.argv.indexOf("--write-dir");
  if (idx === -1) return "docs/reports";
  return process.argv[idx + 1] ?? "docs/reports";
}

function getAllowEmpty() {
  return process.argv.includes("--allow-empty");
}

async function main() {
  const writeDir = getWriteDir();
  const report = await buildShootingSourceInventory({ seeds: getShootingSourceSeeds() });

  if (!getAllowEmpty() && report.totalRows === 0) {
    throw new Error("Refusing to write an empty source inventory. Use --allow-empty if this is intentional.");
  }

  const markdown = renderShootingSourceInventoryMarkdown(report);
  fs.mkdirSync(writeDir, { recursive: true });
  fs.writeFileSync(path.join(writeDir, "shooting-source-inventory-latest.json"), JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(path.join(writeDir, "shooting-source-inventory-latest.md"), markdown, "utf8");
  process.stdout.write(markdown);
}

main().catch((error) => {
  console.error("[export-shooting-sources] failed:", error);
  process.exit(1);
});
