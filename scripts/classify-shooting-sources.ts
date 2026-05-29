import fs from "node:fs";
import path from "node:path";
import { classifyShootingSource } from "@/lib/shootingIngestion/sourceClassifier";
import { getShootingSourceSeeds } from "@/lib/shootingIngestion/sourceSeeds";

function getWriteDir() {
  const idx = process.argv.indexOf("--write-dir");
  if (idx === -1) return "docs/reports";
  return process.argv[idx + 1] ?? "docs/reports";
}

async function main() {
  const writeDir = getWriteDir();
  const classified = getShootingSourceSeeds().map((seed) => classifyShootingSource({ seed }));
  const output = JSON.stringify(classified, null, 2);
  fs.mkdirSync(writeDir, { recursive: true });
  fs.writeFileSync(path.join(writeDir, "shooting-source-classification-latest.json"), output, "utf8");
  process.stdout.write(output);
}

main().catch((error) => {
  console.error("[classify-shooting-sources] failed:", error);
  process.exit(1);
});
