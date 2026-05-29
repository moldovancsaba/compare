import fs from "node:fs/promises";
import path from "node:path";
import { buildCatalogOpsMissionSpec, renderCatalogOpsMissionMarkdown } from "@/lib/catalogOps/contracts";

async function main() {
  const writeDirArg = process.argv.find((arg) => arg.startsWith("--write-dir="));
  const writeDir = writeDirArg ? writeDirArg.slice("--write-dir=".length) : "docs/reports";
  const outputDir = path.resolve(process.cwd(), writeDir);
  await fs.mkdir(outputDir, { recursive: true });

  const spec = buildCatalogOpsMissionSpec();
  await Promise.all([
    fs.writeFile(path.join(outputDir, "checklist-catalog-ops-mission-latest.json"), `${JSON.stringify(spec, null, 2)}\n`, "utf8"),
    fs.writeFile(path.join(outputDir, "checklist-catalog-ops-mission-latest.md"), renderCatalogOpsMissionMarkdown(spec), "utf8"),
  ]);

  console.log(`Wrote checklist mission artifacts to ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
