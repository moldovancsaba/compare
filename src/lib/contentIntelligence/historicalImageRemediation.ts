import { createHash } from "node:crypto";
import type { Db } from "mongodb";
import { COL, buildCatalogScopeFilter, normalizeCatalogProject } from "@/lib/mongodb";
import {
  buildCatalogImageUniquenessIndex,
  computePerceptualHashDistance,
  enqueueCatalogImageRemediation,
  getEntityImageRef,
  listCatalogImageRemediationQueue,
  listCatalogMediaFingerprints,
  syncCatalogImageFingerprintForEntity,
  updateCatalogImageRemediationQueueItem,
  type CatalogImageEntityKind,
  type CatalogImageRemediationQueueItem,
  type CatalogImageUsageRef,
} from "@/lib/contentIntelligence/catalogImageUniqueness";
import { findAlternateOfficialImage } from "@/lib/contentIntelligence/imageReselection";
import { withProviderFreshness } from "@/lib/providerFreshness";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

function sortUsagesByIncumbency(usages: CatalogImageUsageRef[]) {
  return usages.slice().sort((left, right) => {
    const leftStamp = left.publishedAt ?? left.updatedAt ?? "9999-12-31T23:59:59.999Z";
    const rightStamp = right.publishedAt ?? right.updatedAt ?? "9999-12-31T23:59:59.999Z";
    const order = leftStamp.localeCompare(rightStamp);
    if (order !== 0) return order;
    return `${left.entityKind}:${left.entityId}`.localeCompare(`${right.entityKind}:${right.entityId}`);
  });
}

function directImgBbUploader() {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("IMGBB_API_KEY is not set");
  }
  return async (file: Blob) => {
    const buffer = Buffer.from(await file.arrayBuffer());
    const body = new URLSearchParams();
    body.set("key", apiKey);
    body.set("image", buffer.toString("base64"));
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await response.json()) as {
      success?: boolean;
      data?: { url?: string };
      error?: { message?: string };
    };
    if (!response.ok || !json.success || !json.data?.url) {
      throw new Error(json.error?.message || "ImgBB upload failed");
    }
    return { url: json.data.url };
  };
}

function hashBuffer(arrayBuffer: ArrayBuffer) {
  return createHash("sha256").update(Buffer.from(arrayBuffer)).digest("hex");
}

async function loadCatalogSnapshot(db: Db) {
  const [providers, meetups, fingerprints] = await Promise.all([
    db.collection(COL.providers).find(buildCatalogScopeFilter({})).toArray() as unknown as Promise<Provider[]>,
    db.collection(COL.meetupGroups).find(buildCatalogScopeFilter({})).toArray() as unknown as Promise<MeetupGroup[]>,
    listCatalogMediaFingerprints(db),
  ]);
  return { providers, meetups, fingerprints };
}

function findSourceDocumentUrl(
  entityKind: CatalogImageEntityKind,
  entityId: string,
  providers: Provider[],
  meetups: MeetupGroup[],
  fingerprintRows: Awaited<ReturnType<typeof listCatalogMediaFingerprints>>,
) {
  const fingerprint = fingerprintRows.find((row) => row.entityKind === entityKind && row.entityId === entityId);
  if (fingerprint?.sourceDocumentUrl) return fingerprint.sourceDocumentUrl;
  if (entityKind === "provider") return providers.find((provider) => provider.id === entityId)?.website || undefined;
  return meetups.find((meetup) => meetup.id === entityId)?.website || undefined;
}

function findSourceImageUrl(
  entityKind: CatalogImageEntityKind,
  entityId: string,
  fingerprintRows: Awaited<ReturnType<typeof listCatalogMediaFingerprints>>,
) {
  return fingerprintRows.find((row) => row.entityKind === entityKind && row.entityId === entityId)?.sourceImageUrl;
}

export async function seedHistoricalDuplicateImageQueue(
  db: Db,
  options: {
    nearDuplicateThreshold?: number;
    includeNearDuplicates?: boolean;
  } = {},
) {
  const { providers, meetups, fingerprints } = await loadCatalogSnapshot(db);
  const existingQueue = await listCatalogImageRemediationQueue(db);
  const existingQueueIds = new Set(existingQueue.map((row) => row.queueId));
  const index = buildCatalogImageUniquenessIndex({ providers, meetups, fingerprints });

  let queuedExact = 0;
  let queuedNear = 0;

  for (const [uploadedUrl, usages] of index.imagesByUrl.entries()) {
    if (usages.length < 2) continue;
    const sorted = sortUsagesByIncumbency(usages);
    const incumbent = sorted[0];
    for (const usage of sorted.slice(1)) {
      const queueId = `${usage.entityKind}:${usage.entityId}:exact:${uploadedUrl}`;
      if (existingQueueIds.has(queueId)) continue;
      await enqueueCatalogImageRemediation(db, {
        queueId,
        entityKind: usage.entityKind,
        entityId: usage.entityId,
        incumbentEntityKind: incumbent.entityKind,
        incumbentEntityId: incumbent.entityId,
        imageField: usage.imageField,
        duplicateKind: "exact",
        duplicateReason: `Historical exact duplicate of ${incumbent.entityKind} ${incumbent.entityId}.`,
        uploadedUrl: usage.uploadedUrl,
        sourceImageUrl: findSourceImageUrl(usage.entityKind, usage.entityId, fingerprints),
        sourceDocumentUrl: findSourceDocumentUrl(usage.entityKind, usage.entityId, providers, meetups, fingerprints),
      });
      existingQueueIds.add(queueId);
      queuedExact += 1;
    }
  }

  if (options.includeNearDuplicates !== false) {
    const threshold = options.nearDuplicateThreshold ?? 0;
    for (let left = 0; left < fingerprints.length; left += 1) {
      for (let right = left + 1; right < fingerprints.length; right += 1) {
        const a = fingerprints[left];
        const b = fingerprints[right];
        if (a.uploadedUrl === b.uploadedUrl) continue;
        if (!a.perceptualHash || !b.perceptualHash) continue;
        const distance = computePerceptualHashDistance(a.perceptualHash, b.perceptualHash);
        if (!Number.isFinite(distance) || distance > threshold) continue;

        const sorted = sortUsagesByIncumbency([
          {
            entityKind: a.entityKind,
            entityId: a.entityId,
            imageField: a.imageField,
            uploadedUrl: a.uploadedUrl,
            publishedAt: a.publishedAt,
            updatedAt: a.updatedAt,
          },
          {
            entityKind: b.entityKind,
            entityId: b.entityId,
            imageField: b.imageField,
            uploadedUrl: b.uploadedUrl,
            publishedAt: b.publishedAt,
            updatedAt: b.updatedAt,
          },
        ]);
        const incumbent = sorted[0];
        const target = sorted[1];
        const queueId = `${target.entityKind}:${target.entityId}:near:${incumbent.entityKind}:${incumbent.entityId}`;
        if (existingQueueIds.has(queueId)) continue;
        await enqueueCatalogImageRemediation(db, {
          queueId,
          entityKind: target.entityKind,
          entityId: target.entityId,
          incumbentEntityKind: incumbent.entityKind,
          incumbentEntityId: incumbent.entityId,
          imageField: target.imageField,
          duplicateKind: "near",
          duplicateReason: `Historical near duplicate (distance ${distance}) of ${incumbent.entityKind} ${incumbent.entityId}.`,
          uploadedUrl: target.uploadedUrl,
          sourceImageUrl: findSourceImageUrl(target.entityKind, target.entityId, fingerprints),
          sourceDocumentUrl: findSourceDocumentUrl(target.entityKind, target.entityId, providers, meetups, fingerprints),
        });
        existingQueueIds.add(queueId);
        queuedNear += 1;
      }
    }
  }

  return {
    queuedExact,
    queuedNear,
    totalQueued: queuedExact + queuedNear,
  };
}

async function patchHistoricalEntityImage(
  db: Db,
  input:
    | { entityKind: "provider"; entity: Provider; uploadedUrl: string }
    | { entityKind: "meetupGroup"; entity: MeetupGroup; uploadedUrl: string },
) {
  if (input.entityKind === "provider") {
    const next = withProviderFreshness({ ...input.entity, image: input.uploadedUrl }, input.entity, new Date().toISOString());
    const scoped = { ...next, catalogProject: normalizeCatalogProject(input.entity) };
    await db.collection(COL.providers).replaceOne(buildCatalogScopeFilter({ id: next.id }), scoped as never, { upsert: true });
    return scoped;
  }
  const next = { ...input.entity, coverImageUrl: input.uploadedUrl };
  const scoped = { ...next, catalogProject: normalizeCatalogProject(input.entity) };
  await db.collection(COL.meetupGroups).replaceOne(
    buildCatalogScopeFilter({ id: next.id }),
    scoped as never,
    { upsert: true },
  );
  return scoped;
}

export async function runHistoricalDuplicateImageRemediation(
  db: Db,
  options: {
    limit?: number;
    statuses?: CatalogImageRemediationQueueItem["status"][];
  } = {},
) {
  const queue = await listCatalogImageRemediationQueue(db);
  const workItems = queue.filter((item) => (options.statuses ?? ["queued"]).includes(item.status)).slice(0, options.limit ?? 10);
  const uploadImage = directImgBbUploader();
  let resolved = 0;
  let blocked = 0;
  let skipped = 0;

  for (const item of workItems) {
    await updateCatalogImageRemediationQueueItem(db, item.queueId, {
      status: "retrying",
      attempts: item.attempts + 1,
      resolutionNotes: `Retrying at ${new Date().toISOString()}`,
    });

    const { providers, meetups, fingerprints } = await loadCatalogSnapshot(db);
    const entity =
      item.entityKind === "provider"
        ? providers.find((provider) => provider.id === item.entityId)
        : meetups.find((meetup) => meetup.id === item.entityId);

    if (!entity) {
      await updateCatalogImageRemediationQueueItem(db, item.queueId, {
        status: "resolved",
        resolvedAt: new Date().toISOString(),
        resolutionNotes: "Entity no longer exists; remediation closed.",
      });
      skipped += 1;
      continue;
    }

    const usage = getEntityImageRef(item.entityKind, entity as Provider & MeetupGroup);
    if (!usage) {
      await updateCatalogImageRemediationQueueItem(db, item.queueId, {
        status: "resolved",
        resolvedAt: new Date().toISOString(),
        resolutionNotes: "Entity no longer has an image; remediation closed.",
      });
      skipped += 1;
      continue;
    }

    const sourceDocumentUrl =
      item.sourceDocumentUrl ||
      (item.entityKind === "provider" ? (entity as Provider).website : (entity as MeetupGroup).website);
    if (!sourceDocumentUrl) {
      await updateCatalogImageRemediationQueueItem(db, item.queueId, {
        status: "blocked_no_unique_candidate",
        resolutionNotes: "No source document URL is available for alternate official image selection.",
      });
      blocked += 1;
      continue;
    }

    const reselection = await findAlternateOfficialImage({
      request: {
        candidateId: item.queueId,
        sourceImageUrl: item.sourceImageUrl || usage.uploadedUrl,
        sourceDocumentUrl,
        destinationEntityKind: item.entityKind,
        requestedBy: "historical-image-remediation",
      },
      entityId: item.entityId,
      index: buildCatalogImageUniquenessIndex({ providers, meetups, fingerprints }),
      uploadImage,
      hashBuffer,
    });

    if (reselection.status !== "resolved") {
      await updateCatalogImageRemediationQueueItem(db, item.queueId, {
        status: "blocked_no_unique_candidate",
        resolutionNotes: `${reselection.reason}${reselection.attempted.length ? ` Attempted: ${reselection.attempted.join(", ")}` : ""}`,
      });
      blocked += 1;
      continue;
    }

    const updatedEntity =
      item.entityKind === "provider"
        ? await patchHistoricalEntityImage(db, {
            entityKind: "provider",
            entity: entity as Provider,
            uploadedUrl: reselection.mediaResult.uploadedUrl,
          })
        : await patchHistoricalEntityImage(db, {
            entityKind: "meetupGroup",
            entity: entity as MeetupGroup,
            uploadedUrl: reselection.mediaResult.uploadedUrl,
          });

    if (item.entityKind === "provider") {
      await syncCatalogImageFingerprintForEntity(db, {
        entityKind: "provider",
        document: updatedEntity as Provider,
        mediaResult: reselection.mediaResult,
      });
    } else {
      await syncCatalogImageFingerprintForEntity(db, {
        entityKind: "meetupGroup",
        document: updatedEntity as MeetupGroup,
        mediaResult: reselection.mediaResult,
      });
    }

    await updateCatalogImageRemediationQueueItem(db, item.queueId, {
      status: "resolved",
      resolvedAt: new Date().toISOString(),
      resolutionNotes: `Replaced duplicate image with ${reselection.mediaResult.uploadedUrl}`,
    });
    resolved += 1;
  }

  return {
    processed: workItems.length,
    resolved,
    blocked,
    skipped,
  };
}
