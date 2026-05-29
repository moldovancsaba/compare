import fs from "fs";
import path from "path";
import { buildMommyPoppinsInventory, renderInventoryMarkdown } from "@/lib/mommyPoppins/sourceInventory";

function getArg(flag: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const report = await buildMommyPoppinsInventory();
  const markdown = renderInventoryMarkdown(report);
  const writeDir = getArg("--write-dir");
  if (writeDir) {
    fs.mkdirSync(writeDir, { recursive: true });
    fs.writeFileSync(path.join(writeDir, "mommypoppins-nyc-source-inventory-latest.json"), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(writeDir, "mommypoppins-nyc-source-inventory-latest.md"), markdown);
  }
  process.stdout.write(markdown);
}

main().catch((error) => {
  console.error("[export-mommypoppins-inventory] failed:", error);
  process.exit(1);
});
