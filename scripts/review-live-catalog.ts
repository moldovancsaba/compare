import fs from "fs";
import path from "path";
import type { Provider } from "@/types/provider";
import type { MeetupGroup } from "@/types/meetup";
import { buildCatalogAuditReport, renderCatalogAuditMarkdown, type CuratedCatalogEntry } from "@/lib/catalogAudit";
import payloadFiles from "./lib/payload-files.cjs";

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

function loadCuratedEntries(): CuratedCatalogEntry[] {
  const files = payloadFiles.listPayloadFiles("catalog");
  const entries: CuratedCatalogEntry[] = [];
  for (const file of files) {
    const payload = JSON.parse(fs.readFileSync(file, "utf8")) as {
      operations?: { resource?: "provider" | "meetupGroup"; document?: Record<string, unknown> }[];
    };
    for (const op of payload.operations || []) {
      if (!op.resource || !op.document || typeof op.document.id !== "string") continue;
      entries.push({ resource: op.resource, id: op.document.id, file: path.relative(process.cwd(), file), document: op.document });
    }
  }
  return entries;
}

async function main() {
  const [providers, meetups] = await Promise.all([
    fetchJson<Provider[]>("https://classscout.vercel.app/api/public/providers"),
    fetchJson<MeetupGroup[]>("https://classscout.vercel.app/api/public/meetup-groups"),
  ]);

  const curated = loadCuratedEntries();
  const report = buildCatalogAuditReport({ providers, meetups, curatedEntries: curated });
  const output = renderCatalogAuditMarkdown(report);
  const writeDir = getArg("--write-dir");
  if (writeDir) {
    fs.mkdirSync(writeDir, { recursive: true });
    fs.writeFileSync(path.join(writeDir, "catalog-audit-latest.md"), output);
  }
  process.stdout.write(output);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
