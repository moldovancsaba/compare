import fs from "fs";
import path from "path";
import { buildMommyPoppinsCapabilityAudit, renderCapabilityAuditMarkdown } from "@/lib/mommyPoppins/capabilityAudit";

function getArg(flag: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const report = await buildMommyPoppinsCapabilityAudit();
  const markdown = renderCapabilityAuditMarkdown(report);
  const writeDir = getArg("--write-dir");
  if (writeDir) {
    fs.mkdirSync(writeDir, { recursive: true });
    fs.writeFileSync(path.join(writeDir, "mommypoppins-capability-audit-latest.json"), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(writeDir, "mommypoppins-capability-audit-latest.md"), markdown);
  }
  process.stdout.write(markdown);
}

main().catch((error) => {
  console.error("[report-mommypoppins-capabilities] failed:", error);
  process.exit(1);
});
