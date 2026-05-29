import { createHash } from "node:crypto";
import dotenv from "dotenv";
import sharp from "sharp";
import { getDb } from "@/lib/mongodb";
import {
  listCatalogMediaFingerprints,
  upsertCatalogMediaFingerprint,
  type CatalogMediaFingerprint,
} from "@/lib/contentIntelligence/catalogImageUniqueness";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

dotenv.config({ path: ".env.local" });
dotenv.config();

function parseFlag(name: string) {
  return process.argv.includes(name);
}

async function inspectRasterImage(arrayBuffer: ArrayBuffer) {
  const image = sharp(Buffer.from(arrayBuffer), { failOn: "none" });
  const resized = await image
    .clone()
    .grayscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer();

  let perceptualHash = "";
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const left = resized[row * 9 + column] ?? 0;
      const right = resized[row * 9 + column + 1] ?? 0;
      perceptualHash += left > right ? "1" : "0";
    }
  }

  const metadata = await image.metadata();
  return {
    perceptualHash,
    width: metadata.width,
    height: metadata.height,
  };
}

async function buildFingerprintRecord(input: {
  entityKind: "provider" | "meetupGroup";
  entityId: string;
  imageField: "image" | "coverImageUrl";
  uploadedUrl: string;
  sourceDocumentUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
}): Promise<CatalogMediaFingerprint> {
  const response = await fetch(input.uploadedUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Image fetch failed for ${input.entityKind}:${input.entityId} with status ${response.status}`);
  }
  const mimeType = response.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await response.arrayBuffer();
  const { perceptualHash, width, height } = await inspectRasterImage(arrayBuffer);
  const contentHash = createHash("sha256").update(Buffer.from(arrayBuffer)).digest("hex");
  const nowIso = new Date().toISOString();

  return {
    entityKind: input.entityKind,
    entityId: input.entityId,
    imageField: input.imageField,
    uploadedUrl: input.uploadedUrl,
    sourceDocumentUrl: input.sourceDocumentUrl,
    contentHash,
    perceptualHash,
    mimeType,
    width,
    height,
    publishedAt: input.publishedAt,
    updatedAt: input.updatedAt,
    createdAt: nowIso,
    refreshedAt: nowIso,
  };
}

async function main() {
  const onlyMissing = parseFlag("--only-missing");
  const db = await getDb();
  if (!db) throw new Error("No database connection available");

  const [providers, meetups, existingFingerprints] = await Promise.all([
    db.collection("providers").find({ image: { $type: "string", $ne: "" } }).toArray() as unknown as Promise<Provider[]>,
    db.collection("meetupGroups").find({ coverImageUrl: { $type: "string", $ne: "" } }).toArray() as unknown as Promise<MeetupGroup[]>,
    listCatalogMediaFingerprints(db),
  ]);

  const existingByKey = new Map(
    existingFingerprints.map((row) => [`${row.entityKind}:${row.entityId}:${row.imageField}`, row]),
  );

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const provider of providers) {
    const key = `provider:${provider.id}:image`;
    if (onlyMissing && existingByKey.has(key)) {
      skipped += 1;
      continue;
    }
    scanned += 1;
    try {
      const record = await buildFingerprintRecord({
        entityKind: "provider",
        entityId: provider.id,
        imageField: "image",
        uploadedUrl: provider.image,
        sourceDocumentUrl: provider.website,
        publishedAt: provider.publishedAt,
        updatedAt: provider.updatedAt,
      });
      await upsertCatalogMediaFingerprint(db, record);
      updated += 1;
    } catch (error) {
      failures.push(`provider:${provider.id}:${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const meetup of meetups) {
    const key = `meetupGroup:${meetup.id}:coverImageUrl`;
    if (onlyMissing && existingByKey.has(key)) {
      skipped += 1;
      continue;
    }
    scanned += 1;
    try {
      const record = await buildFingerprintRecord({
        entityKind: "meetupGroup",
        entityId: meetup.id,
        imageField: "coverImageUrl",
        uploadedUrl: meetup.coverImageUrl || "",
        sourceDocumentUrl: meetup.website,
      });
      await upsertCatalogMediaFingerprint(db, record);
      updated += 1;
    } catch (error) {
      failures.push(`meetupGroup:${meetup.id}:${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        scanned,
        updated,
        skipped,
        failures,
      },
      null,
      2,
    ),
  );

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[backfill-image-fingerprints] failed:", error);
  process.exitCode = 1;
});
