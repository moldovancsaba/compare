import type { Db } from "mongodb";
import { COL, buildCatalogScopeFilter, normalizeCatalogProject } from "@/lib/mongodb";
import type { UploadedImageResult } from "@/lib/contentIntelligence/mediaPipeline";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

export type CatalogImageEntityKind = "provider" | "meetupGroup";

export interface CatalogMediaFingerprint {
  catalogProject?: string;
  entityKind: CatalogImageEntityKind;
  entityId: string;
  imageField: "image" | "coverImageUrl";
  uploadedUrl: string;
  sourceImageUrl?: string;
  sourceDocumentUrl?: string;
  contentHash?: string;
  perceptualHash?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  publishedAt?: string;
  updatedAt?: string;
  createdAt: string;
  refreshedAt: string;
}

export interface CatalogImageRemediationQueueItem {
  catalogProject?: string;
  queueId: string;
  entityKind: CatalogImageEntityKind;
  entityId: string;
  incumbentEntityKind: CatalogImageEntityKind;
  incumbentEntityId: string;
  imageField: "image" | "coverImageUrl";
  duplicateKind: "exact" | "near";
  duplicateReason: string;
  uploadedUrl: string;
  sourceImageUrl?: string;
  sourceDocumentUrl?: string;
  status: "queued" | "retrying" | "resolved" | "blocked_no_unique_candidate";
  attempts: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface CatalogImageUsageRef {
  entityKind: CatalogImageEntityKind;
  entityId: string;
  imageField: "image" | "coverImageUrl";
  uploadedUrl: string;
  publishedAt?: string;
  updatedAt?: string;
}

export interface CatalogImageUniquenessIndex {
  imagesByUrl: Map<string, CatalogImageUsageRef[]>;
  fingerprints: CatalogMediaFingerprint[];
}

export interface CatalogImageDuplicateMatch {
  entityKind: CatalogImageEntityKind;
  entityId: string;
  uploadedUrl: string;
  reason: string;
  distance?: number;
}

export interface CatalogImageUniquenessDecision {
  status: "unique" | "duplicate_exact" | "duplicate_near";
  matches: CatalogImageDuplicateMatch[];
  incumbent?: CatalogImageDuplicateMatch;
}

function normalizeUrl(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function compareIso(a?: string, b?: string) {
  if (a && b) return a.localeCompare(b);
  if (a) return -1;
  if (b) return 1;
  return 0;
}

function isSameEntity(
  left: Pick<CatalogImageUsageRef, "entityKind" | "entityId">,
  right: Pick<CatalogImageUsageRef, "entityKind" | "entityId">,
) {
  return left.entityKind === right.entityKind && left.entityId === right.entityId;
}

function usageSortValue(usage: CatalogImageUsageRef) {
  return usage.publishedAt ?? usage.updatedAt ?? "9999-12-31T23:59:59.999Z";
}

function pickIncumbent(
  matches: CatalogImageDuplicateMatch[],
  index: CatalogImageUniquenessIndex,
): CatalogImageDuplicateMatch | undefined {
  return [...matches].sort((left, right) => {
    const leftUsage = index.imagesByUrl.get(normalizeUrl(left.uploadedUrl))?.find(
      (usage) => usage.entityKind === left.entityKind && usage.entityId === left.entityId,
    );
    const rightUsage = index.imagesByUrl.get(normalizeUrl(right.uploadedUrl))?.find(
      (usage) => usage.entityKind === right.entityKind && usage.entityId === right.entityId,
    );
    const freshnessOrder = compareIso(
      leftUsage ? usageSortValue(leftUsage) : undefined,
      rightUsage ? usageSortValue(rightUsage) : undefined,
    );
    if (freshnessOrder !== 0) return freshnessOrder;
    return `${left.entityKind}:${left.entityId}`.localeCompare(`${right.entityKind}:${right.entityId}`);
  })[0];
}

export function getEntityImageRef(entityKind: CatalogImageEntityKind, doc: Provider | MeetupGroup): CatalogImageUsageRef | null {
  const uploadedUrl = normalizeUrl(entityKind === "provider" ? (doc as Provider).image : (doc as MeetupGroup).coverImageUrl);
  if (!uploadedUrl) return null;
  return {
    entityKind,
    entityId: doc.id,
    imageField: entityKind === "provider" ? "image" : "coverImageUrl",
    uploadedUrl,
    publishedAt: entityKind === "provider" ? (doc as Provider).publishedAt : undefined,
    updatedAt: entityKind === "provider" ? (doc as Provider).updatedAt : undefined,
  };
}

export function buildCatalogImageUniquenessIndex(input: {
  providers: Provider[];
  meetups: MeetupGroup[];
  fingerprints?: CatalogMediaFingerprint[];
}): CatalogImageUniquenessIndex {
  const imagesByUrl = new Map<string, CatalogImageUsageRef[]>();
  const add = (usage: CatalogImageUsageRef | null) => {
    if (!usage) return;
    const key = normalizeUrl(usage.uploadedUrl);
    if (!key) return;
    const existing = imagesByUrl.get(key) ?? [];
    existing.push(usage);
    imagesByUrl.set(key, existing);
  };

  for (const provider of input.providers) add(getEntityImageRef("provider", provider));
  for (const meetup of input.meetups) add(getEntityImageRef("meetupGroup", meetup));

  return {
    imagesByUrl,
    fingerprints: input.fingerprints ?? [],
  };
}

export function computePerceptualHashDistance(left?: string, right?: string) {
  if (!left || !right || left.length !== right.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) distance += 1;
  }
  return distance;
}

export function evaluateCatalogImageUniqueness(input: {
  entityKind: CatalogImageEntityKind;
  entityId: string;
  uploadedUrl?: string;
  contentHash?: string;
  perceptualHash?: string;
  sourceImageUrl?: string;
  index: CatalogImageUniquenessIndex;
  nearDuplicateThreshold?: number;
}): CatalogImageUniquenessDecision {
  const selfRef = { entityKind: input.entityKind, entityId: input.entityId };
  const matches: CatalogImageDuplicateMatch[] = [];

  const uploadedUrl = normalizeUrl(input.uploadedUrl);
  if (uploadedUrl) {
    for (const usage of input.index.imagesByUrl.get(uploadedUrl) ?? []) {
      if (isSameEntity(selfRef, usage)) continue;
      matches.push({
        entityKind: usage.entityKind,
        entityId: usage.entityId,
        uploadedUrl: usage.uploadedUrl,
        reason: "uploaded_url",
      });
    }
  }

  for (const fingerprint of input.index.fingerprints) {
    if (isSameEntity(selfRef, fingerprint)) continue;
    if (input.contentHash && fingerprint.contentHash && fingerprint.contentHash === input.contentHash) {
      matches.push({
        entityKind: fingerprint.entityKind,
        entityId: fingerprint.entityId,
        uploadedUrl: fingerprint.uploadedUrl,
        reason: "content_hash",
      });
      continue;
    }
    if (input.sourceImageUrl && fingerprint.sourceImageUrl && normalizeUrl(fingerprint.sourceImageUrl) === normalizeUrl(input.sourceImageUrl)) {
      matches.push({
        entityKind: fingerprint.entityKind,
        entityId: fingerprint.entityId,
        uploadedUrl: fingerprint.uploadedUrl,
        reason: "source_image_url",
      });
      continue;
    }
    const distance = computePerceptualHashDistance(input.perceptualHash, fingerprint.perceptualHash);
    if (Number.isFinite(distance) && distance <= (input.nearDuplicateThreshold ?? 8)) {
      matches.push({
        entityKind: fingerprint.entityKind,
        entityId: fingerprint.entityId,
        uploadedUrl: fingerprint.uploadedUrl,
        reason: "perceptual_hash",
        distance,
      });
    }
  }

  const uniqueMatches = matches.filter(
    (match, index, list) =>
      list.findIndex(
        (candidate) =>
          candidate.entityKind === match.entityKind &&
          candidate.entityId === match.entityId &&
          candidate.reason === match.reason,
      ) === index,
  );

  const hasExact = uniqueMatches.some((match) => match.reason !== "perceptual_hash");
  const hasNear = uniqueMatches.some((match) => match.reason === "perceptual_hash");
  if (!hasExact && !hasNear) {
    return {
      status: "unique",
      matches: [],
    };
  }

  return {
    status: hasExact ? "duplicate_exact" : "duplicate_near",
    matches: uniqueMatches,
    incumbent: pickIncumbent(uniqueMatches, input.index),
  };
}

export function buildCatalogMediaFingerprintFromResult(input: {
  entityKind: CatalogImageEntityKind;
  entityId: string;
  imageField: "image" | "coverImageUrl";
  mediaResult: UploadedImageResult;
  publishedAt?: string;
  updatedAt?: string;
  nowIso?: string;
}): CatalogMediaFingerprint {
  const nowIso = input.nowIso ?? new Date().toISOString();
  return {
    entityKind: input.entityKind,
    entityId: input.entityId,
    imageField: input.imageField,
    uploadedUrl: input.mediaResult.uploadedUrl,
    sourceImageUrl: input.mediaResult.originalUrl,
    sourceDocumentUrl: input.mediaResult.sourceDocumentUrl,
    contentHash: input.mediaResult.contentHash || undefined,
    perceptualHash: input.mediaResult.perceptualHash || undefined,
    mimeType: input.mediaResult.mimeType || undefined,
    width: input.mediaResult.width,
    height: input.mediaResult.height,
    publishedAt: input.publishedAt,
    updatedAt: input.updatedAt,
    createdAt: nowIso,
    refreshedAt: nowIso,
  };
}

export async function listCatalogMediaFingerprints(db: Db) {
  return (await db
    .collection(COL.mediaFingerprints)
    .find(buildCatalogScopeFilter({}))
    .toArray()) as unknown as CatalogMediaFingerprint[];
}

export async function removeCatalogMediaFingerprintsForEntity(db: Db, entityKind: CatalogImageEntityKind, entityId: string) {
  await db
    .collection(COL.mediaFingerprints)
    .deleteMany(buildCatalogScopeFilter({ entityKind, entityId }));
}

export async function upsertCatalogMediaFingerprint(db: Db, record: CatalogMediaFingerprint) {
  const { createdAt, ...rest } = record;
  const scopedRecord = {
    ...rest,
    catalogProject: normalizeCatalogProject(record),
  };
  await db.collection(COL.mediaFingerprints).updateOne(
    buildCatalogScopeFilter({
      entityKind: scopedRecord.entityKind,
      entityId: scopedRecord.entityId,
      imageField: scopedRecord.imageField,
    }),
    {
      $set: {
        ...scopedRecord,
        refreshedAt: new Date().toISOString(),
      },
      $setOnInsert: {
        createdAt,
      },
    },
    { upsert: true },
  );
}

export async function syncCatalogImageFingerprintForEntity(
  db: Db,
  input:
    | {
        entityKind: "provider";
        document: Provider;
        mediaResult?: UploadedImageResult | null;
      }
    | {
        entityKind: "meetupGroup";
        document: MeetupGroup;
        mediaResult?: UploadedImageResult | null;
      },
) {
  const usage = getEntityImageRef(input.entityKind, input.document);
  if (!usage) {
    await removeCatalogMediaFingerprintsForEntity(db, input.entityKind, input.document.id);
    return;
  }

  const record =
    input.mediaResult && input.mediaResult.status === "ready"
      ? buildCatalogMediaFingerprintFromResult({
          entityKind: input.entityKind,
          entityId: input.document.id,
          imageField: usage.imageField,
          mediaResult: input.mediaResult,
          publishedAt: input.entityKind === "provider" ? input.document.publishedAt : undefined,
          updatedAt: input.entityKind === "provider" ? input.document.updatedAt : undefined,
        })
      : {
          entityKind: input.entityKind,
          entityId: input.document.id,
          imageField: usage.imageField,
          uploadedUrl: usage.uploadedUrl,
          publishedAt: usage.publishedAt,
          updatedAt: usage.updatedAt,
          createdAt: new Date().toISOString(),
          refreshedAt: new Date().toISOString(),
        };

  await upsertCatalogMediaFingerprint(db, record);
}

export async function enqueueCatalogImageRemediation(
  db: Db,
  item: Omit<CatalogImageRemediationQueueItem, "queueId" | "createdAt" | "updatedAt" | "attempts" | "status"> & {
    status?: CatalogImageRemediationQueueItem["status"];
    attempts?: number;
    queueId?: string;
  },
) {
  const nowIso = new Date().toISOString();
  const queueId = item.queueId ?? `${item.entityKind}:${item.entityId}:${item.duplicateKind}`;
  const record: CatalogImageRemediationQueueItem = {
    catalogProject: normalizeCatalogProject({}),
    queueId,
    status: item.status ?? "queued",
    attempts: item.attempts ?? 0,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...item,
  };
  const { createdAt, ...rest } = record;
  await db.collection(COL.imageRemediationQueue).updateOne(
    buildCatalogScopeFilter({ queueId }),
    {
      $set: {
        ...rest,
        updatedAt: nowIso,
      },
      $setOnInsert: {
        createdAt,
      },
    },
    { upsert: true },
  );
  return record;
}

export async function listCatalogImageRemediationQueue(db: Db) {
  return (await db
    .collection(COL.imageRemediationQueue)
    .find(buildCatalogScopeFilter({}))
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray()) as unknown as CatalogImageRemediationQueueItem[];
}

export async function updateCatalogImageRemediationQueueItem(
  db: Db,
  queueId: string,
  patch: Partial<
    Pick<
      CatalogImageRemediationQueueItem,
      "status" | "attempts" | "resolutionNotes" | "resolvedAt"
    >
  >,
) {
  const nextPatch = {
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await db
    .collection(COL.imageRemediationQueue)
    .updateOne(buildCatalogScopeFilter({ queueId }), { $set: nextPatch });
  return (await db
    .collection(COL.imageRemediationQueue)
    .findOne(buildCatalogScopeFilter({ queueId }))) as unknown as CatalogImageRemediationQueueItem | null;
}
