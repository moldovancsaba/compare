import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { getDb, COL } from "@/lib/mongodb";
import {
  buildCatalogImageUniquenessIndex,
  computePerceptualHashDistance,
  listCatalogMediaFingerprints,
} from "@/lib/contentIntelligence/catalogImageUniqueness";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

dotenv.config({ path: ".env.local" });
dotenv.config();

function getArg(name: string, fallback: string) {
  const index = process.argv.findIndex((value) => value === name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function isoNow() {
  return new Date().toISOString();
}

async function main() {
  const writeDir = getArg("--write-dir", "docs/reports");
  const db = await getDb();
  if (!db) throw new Error("No database connection available");

  const [providers, meetups, fingerprints] = await Promise.all([
    db.collection(COL.providers).find({}).toArray() as unknown as Promise<Provider[]>,
    db.collection(COL.meetupGroups).find({}).toArray() as unknown as Promise<MeetupGroup[]>,
    listCatalogMediaFingerprints(db),
  ]);

  const index = buildCatalogImageUniquenessIndex({ providers, meetups, fingerprints });
  const exactGroups = [...index.imagesByUrl.entries()]
    .filter(([, usages]) => usages.length > 1)
    .map(([uploadedUrl, usages]) => ({
      uploadedUrl,
      count: usages.length,
      rows: usages
        .slice()
        .sort((left, right) => (left.publishedAt ?? left.updatedAt ?? "").localeCompare(right.publishedAt ?? right.updatedAt ?? ""))
        .map((usage) => ({
          entityKind: usage.entityKind,
          entityId: usage.entityId,
          imageField: usage.imageField,
          publishedAt: usage.publishedAt ?? null,
          updatedAt: usage.updatedAt ?? null,
        })),
    }));

  const nearGroups: Array<{
    entityA: string;
    entityB: string;
    uploadedUrlA: string;
    uploadedUrlB: string;
    distance: number;
  }> = [];
  for (let left = 0; left < fingerprints.length; left += 1) {
    for (let right = left + 1; right < fingerprints.length; right += 1) {
      const a = fingerprints[left];
      const b = fingerprints[right];
      if (a.entityKind === b.entityKind && a.entityId === b.entityId) continue;
      if (!a.perceptualHash || !b.perceptualHash) continue;
      const distance = computePerceptualHashDistance(a.perceptualHash, b.perceptualHash);
      if (Number.isFinite(distance) && distance <= 8) {
        nearGroups.push({
          entityA: `${a.entityKind}:${a.entityId}`,
          entityB: `${b.entityKind}:${b.entityId}`,
          uploadedUrlA: a.uploadedUrl,
          uploadedUrlB: b.uploadedUrl,
          distance,
        });
      }
    }
  }

  const payload = {
    generatedAt: isoNow(),
    counts: {
      providers: providers.length,
      meetups: meetups.length,
      fingerprints: fingerprints.length,
      exactDuplicateGroups: exactGroups.length,
      nearDuplicatePairs: nearGroups.length,
    },
    exactGroups,
    nearGroups,
  };

  const markdown = [
    "# Catalog Image Duplicate Audit",
    "",
    `Generated: ${payload.generatedAt}`,
    "",
    `- Providers: ${providers.length}`,
    `- Meetup groups: ${meetups.length}`,
    `- Fingerprints: ${fingerprints.length}`,
    `- Exact duplicate groups: ${exactGroups.length}`,
    `- Near duplicate pairs: ${nearGroups.length}`,
    "",
    "## Exact duplicate groups",
    "",
    ...(exactGroups.length
      ? exactGroups.flatMap((group) => [
          `### ${group.uploadedUrl}`,
          ...group.rows.map((row) => `- ${row.entityKind} ${row.entityId} (${row.imageField})`),
          "",
        ])
      : ["No exact duplicate uploaded URLs found.", ""]),
    "## Near duplicate pairs",
    "",
    ...(nearGroups.length
      ? nearGroups.map((pair) => `- ${pair.entityA} vs ${pair.entityB} (distance ${pair.distance})`)
      : ["No near duplicate fingerprint pairs found."]),
    "",
  ].join("\n");

  await mkdir(writeDir, { recursive: true });
  await writeFile(path.join(writeDir, "image-duplicate-audit-latest.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await writeFile(path.join(writeDir, "image-duplicate-audit-latest.md"), markdown, "utf8");
  console.log(`Wrote duplicate image audit to ${writeDir}`);
}

main().catch((error) => {
  console.error("[audit-image-duplicates] failed:", error);
  process.exitCode = 1;
});
