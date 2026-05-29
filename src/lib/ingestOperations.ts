import type { AnyBulkWriteOperation, Db, Document } from "mongodb";
import { COL, buildCatalogScopeFilter, normalizeCatalogProject } from "@/lib/mongodb";
import type { Borough, Provider } from "@/types/provider";
import type { MeetupGroup } from "@/types/meetup";
import type { SiteDoc } from "@/types/site";
import { mergeSiteDocument } from "@/lib/siteMerge";
import { validateMeetupCover, validateProviderImages, validateSiteRasterUrls } from "@/lib/imgbbUrl";
import { validateMeetupDocument } from "@/lib/meetupValidation";
import { validateProviderDocument } from "@/lib/providerValidation";
import { normalizeProviderFreshness, withProviderFreshness } from "@/lib/providerFreshness";
import {
  buildCatalogImageUniquenessIndex,
  evaluateCatalogImageUniqueness,
  listCatalogMediaFingerprints,
  removeCatalogMediaFingerprintsForEntity,
  syncCatalogImageFingerprintForEntity,
} from "@/lib/contentIntelligence/catalogImageUniqueness";

export type IngestOpResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: string };

type LocRow = { borough: Borough; neighborhoods: string[] };

const MAX_REPLACE_ALL = 2000;
const MAX_DELETE_IDS = 500;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function stripId<T extends object>(doc: T): T {
  const o = { ...doc } as Record<string, unknown>;
  delete o._id;
  return o as T;
}

function withCatalogProject<T extends { catalogProject?: string }>(doc: T): T & { catalogProject: string } {
  return { ...doc, catalogProject: normalizeCatalogProject(doc) } as T & { catalogProject: string };
}

function scopedIdFilter(id: string) {
  return buildCatalogScopeFilter({ id });
}

function scopedIdFilterMap(ids: string[]) {
  return buildCatalogScopeFilter({ id: { $in: ids } });
}

async function loadExistingProvidersById(db: Db, ids: string[]) {
  if (ids.length === 0) return new Map<string, Provider & { _id?: unknown }>();
  const rows = (await db
    .collection(COL.providers)
    .find(scopedIdFilterMap(ids))
    .toArray()) as unknown as (Provider & { _id?: unknown })[];
  return new Map(rows.map((row) => [row.id, row]));
}

async function validateCatalogImageUniqueness(
  db: Db,
  input: {
    entityKind: "provider" | "meetupGroup";
    document: Provider | MeetupGroup;
    providers?: Provider[];
    meetups?: MeetupGroup[];
  },
) {
  const [providers, meetups, fingerprints] = await Promise.all([
    input.providers
      ? Promise.resolve(input.providers)
      : (db.collection(COL.providers).find(buildCatalogScopeFilter({})).toArray() as unknown as Promise<Provider[]>),
    input.meetups
      ? Promise.resolve(input.meetups)
      : (db.collection(COL.meetupGroups).find(buildCatalogScopeFilter({})).toArray() as unknown as Promise<MeetupGroup[]>),
    listCatalogMediaFingerprints(db),
  ]);
  const index = buildCatalogImageUniquenessIndex({ providers, meetups, fingerprints });
  const uploadedUrl =
    input.entityKind === "provider"
      ? String((input.document as Provider).image || "").trim()
      : String((input.document as MeetupGroup).coverImageUrl || "").trim();
  if (!uploadedUrl) return null;
  const result = evaluateCatalogImageUniqueness({
    entityKind: input.entityKind,
    entityId: input.document.id,
    uploadedUrl,
    index,
  });
  if (result.status === "unique") return null;
  const incumbent = result.incumbent;
  return incumbent
    ? `duplicate image rejected: ${incumbent.entityKind} ${incumbent.entityId} already uses this image`
    : "duplicate image rejected: another live catalog row already uses this image";
}

export async function applyIngestOperation(db: Db, op: unknown): Promise<IngestOpResult> {
  if (!isPlainObject(op)) return { ok: false, error: "each operation must be a JSON object" };
  const resource = op.resource;
  const action = op.action;

  // --- reads (return data on success) ---
  if (resource === "providers" && action === "list") {
    const rows = (await db.collection(COL.providers).find(buildCatalogScopeFilter({})).toArray()) as unknown as (Provider & {
      _id?: unknown;
    })[];
    return { ok: true, data: rows.map((row) => stripId(normalizeProviderFreshness(row))) };
  }

  if (resource === "provider" && action === "get") {
    const id = op.id;
    if (typeof id !== "string" || !id) return { ok: false, error: "provider.get requires id string" };
    const doc = (await db.collection(COL.providers).findOne(scopedIdFilter(id))) as unknown as (Provider & { _id?: unknown }) | null;
    if (!doc) return { ok: false, error: "provider not found" };
    return { ok: true, data: stripId(normalizeProviderFreshness(doc)) };
  }

  if (resource === "meetupGroups" && action === "list") {
    const rows = (await db.collection(COL.meetupGroups).find(buildCatalogScopeFilter({})).toArray()) as unknown as (MeetupGroup & {
      _id?: unknown;
    })[];
    return { ok: true, data: rows.map(stripId) };
  }

  if (resource === "meetupGroup" && action === "get") {
    const id = op.id;
    if (typeof id !== "string" || !id) return { ok: false, error: "meetupGroup.get requires id string" };
    const doc = (await db.collection(COL.meetupGroups).findOne(scopedIdFilter(id))) as unknown as MeetupGroup | null;
    if (!doc) return { ok: false, error: "meetupGroup not found" };
    return { ok: true, data: stripId(doc) };
  }

  if (resource === "site" && action === "get") {
    const doc = (await db.collection(COL.site).findOne({ _id: "main" } as never)) as unknown as Partial<SiteDoc> | null;
    return { ok: true, data: mergeSiteDocument(doc) };
  }

  if (resource === "locations" && action === "list") {
    const rows = await db.collection(COL.locations).find({}).toArray();
    return { ok: true, data: rows };
  }

  // --- bulk writes ---
  if (resource === "providers" && action === "replaceAll") {
    const documents = op.documents;
    if (!Array.isArray(documents)) return { ok: false, error: "providers.replaceAll requires documents array" };
    if (documents.length > MAX_REPLACE_ALL) {
      return { ok: false, error: `providers.replaceAll: at most ${MAX_REPLACE_ALL} documents` };
    }
    for (const raw of documents) {
      if (!isPlainObject(raw)) return { ok: false, error: "providers.replaceAll: each item must be an object" };
      const rest = raw as unknown as Provider;
      if (!rest.id || typeof rest.id !== "string") return { ok: false, error: "providers.replaceAll: each document needs string id" };
      const imgErr = validateProviderImages(rest);
      if (imgErr) return { ok: false, error: imgErr };
      const providerErr = validateProviderDocument(rest);
      if (providerErr) return { ok: false, error: providerErr };
    }
    const ids = documents.map((raw) => (raw as Provider).id);
    const existingById = await loadExistingProvidersById(db, ids);
    const nowIso = new Date().toISOString();
    const meetups = (await db.collection(COL.meetupGroups).find(buildCatalogScopeFilter({})).toArray()) as unknown as MeetupGroup[];
    const preparedProviders = documents.map((raw) => {
      const { _id, ...rest } = raw as unknown as Provider & { _id?: unknown };
      return withCatalogProject(withProviderFreshness(rest as Provider, existingById.get(rest.id) ?? null, nowIso));
    });
    for (const provider of preparedProviders) {
      const duplicateError = await validateCatalogImageUniqueness(db, {
        entityKind: "provider",
        document: provider,
        providers: preparedProviders,
        meetups,
      });
      if (duplicateError) return { ok: false, error: duplicateError };
    }
    await db.collection(COL.providers).deleteMany(buildCatalogScopeFilter({}));
    await db.collection(COL.mediaFingerprints).deleteMany(buildCatalogScopeFilter({ entityKind: "provider" }));
    if (documents.length > 0) {
      const scoped = preparedProviders.map(withCatalogProject);
      await db.collection(COL.providers).insertMany(scoped as unknown as Document[]);
      for (const provider of preparedProviders) {
        await syncCatalogImageFingerprintForEntity(db, { entityKind: "provider", document: provider });
      }
    }
    return { ok: true, data: { replaced: documents.length } };
  }

  if (resource === "meetupGroups" && action === "replaceAll") {
    const documents = op.documents;
    if (!Array.isArray(documents)) return { ok: false, error: "meetupGroups.replaceAll requires documents array" };
    if (documents.length > MAX_REPLACE_ALL) {
      return { ok: false, error: `meetupGroups.replaceAll: at most ${MAX_REPLACE_ALL} documents` };
    }
    for (const raw of documents) {
      if (!isPlainObject(raw)) return { ok: false, error: "meetupGroups.replaceAll: each item must be an object" };
      const rest = raw as unknown as MeetupGroup;
      if (!rest.id || typeof rest.id !== "string") return { ok: false, error: "meetupGroups.replaceAll: each document needs string id" };
      const imgErr = validateMeetupCover(rest);
      if (imgErr) return { ok: false, error: imgErr };
      const meetupErr = validateMeetupDocument(rest);
      if (meetupErr) return { ok: false, error: meetupErr };
    }
    const providers = (await db.collection(COL.providers).find(buildCatalogScopeFilter({})).toArray()) as unknown as Provider[];
    const normalizedMeetups = documents.map((raw) => {
      const { _id, ...rest } = raw as unknown as MeetupGroup & { _id?: unknown };
      return withCatalogProject(rest) as MeetupGroup;
    });
    for (const meetup of normalizedMeetups) {
      const duplicateError = await validateCatalogImageUniqueness(db, {
        entityKind: "meetupGroup",
        document: meetup,
        providers,
        meetups: normalizedMeetups,
      });
      if (duplicateError) return { ok: false, error: duplicateError };
    }
    await db.collection(COL.meetupGroups).deleteMany(buildCatalogScopeFilter({}));
    await db.collection(COL.mediaFingerprints).deleteMany(buildCatalogScopeFilter({ entityKind: "meetupGroup" }));
    if (documents.length > 0) {
      await db.collection(COL.meetupGroups).insertMany(normalizedMeetups as unknown as Document[]);
      for (const meetup of normalizedMeetups) {
        await syncCatalogImageFingerprintForEntity(db, { entityKind: "meetupGroup", document: meetup });
      }
    }
    return { ok: true, data: { replaced: documents.length } };
  }

  if (resource === "providers" && action === "deleteMany") {
    const ids = op.ids;
    if (!Array.isArray(ids) || ids.length === 0) return { ok: false, error: "providers.deleteMany requires non-empty ids array" };
    if (ids.length > MAX_DELETE_IDS) return { ok: false, error: `providers.deleteMany: at most ${MAX_DELETE_IDS} ids` };
    for (const id of ids) {
      if (typeof id !== "string" || !id) return { ok: false, error: "providers.deleteMany: each id must be a non-empty string" };
    }
    const r = await db.collection(COL.providers).deleteMany(scopedIdFilterMap(ids));
    return { ok: true, data: { deletedCount: r.deletedCount } };
  }

  if (resource === "meetupGroups" && action === "deleteMany") {
    const ids = op.ids;
    if (!Array.isArray(ids) || ids.length === 0) return { ok: false, error: "meetupGroups.deleteMany requires non-empty ids array" };
    if (ids.length > MAX_DELETE_IDS) return { ok: false, error: `meetupGroups.deleteMany: at most ${MAX_DELETE_IDS} ids` };
    for (const id of ids) {
      if (typeof id !== "string" || !id) return { ok: false, error: "meetupGroups.deleteMany: each id must be a non-empty string" };
    }
    const r = await db.collection(COL.meetupGroups).deleteMany(scopedIdFilterMap(ids));
    return { ok: true, data: { deletedCount: r.deletedCount } };
  }

  if (resource === "site" && action === "put") {
    const doc = op.document;
    if (!isPlainObject(doc)) return { ok: false, error: "site.put requires document object" };
    const { _id, ...rest } = doc as unknown as SiteDoc & { _id?: unknown };
    const full = { _id: "main" as const, ...rest } as SiteDoc;
    const imgErr = validateSiteRasterUrls(full as unknown as Record<string, unknown>);
    if (imgErr) return { ok: false, error: imgErr };
    await db.collection(COL.site).replaceOne({ _id: "main" as never }, full, { upsert: true });
    return { ok: true };
  }

  // --- single-document writes ---
  if (resource === "provider" && action === "upsert") {
    const doc = op.document;
    if (!isPlainObject(doc)) return { ok: false, error: "provider.upsert requires document object" };
    const { _id, ...rest } = doc as unknown as Provider & { _id?: unknown };
    if (!rest.id || typeof rest.id !== "string") return { ok: false, error: "provider.document.id required" };
    const imgErr = validateProviderImages(rest);
    if (imgErr) return { ok: false, error: imgErr };
    const providerErr = validateProviderDocument(rest);
    if (providerErr) return { ok: false, error: providerErr };
    const existing = (await db.collection(COL.providers).findOne(scopedIdFilter(rest.id))) as unknown as (Provider & { _id?: unknown }) | null;
    const prepared = withProviderFreshness(withCatalogProject(rest as Provider), existing, new Date().toISOString());
    const duplicateError = await validateCatalogImageUniqueness(db, { entityKind: "provider", document: prepared });
    if (duplicateError) return { ok: false, error: duplicateError };
    await db.collection(COL.providers).replaceOne(
      scopedIdFilter(rest.id),
      prepared as Provider,
      { upsert: true },
    );
    await syncCatalogImageFingerprintForEntity(db, { entityKind: "provider", document: prepared });
    return { ok: true };
  }

  if (resource === "provider" && action === "patch") {
    const id = op.id;
    if (typeof id !== "string" || !id) return { ok: false, error: "provider.patch requires id string" };
    const patchIn = op.patch;
    if (!isPlainObject(patchIn)) return { ok: false, error: "provider.patch requires patch object" };
    const { id: _drop, ...patch } = patchIn as { id?: string };
    if (Object.keys(patch).length === 0) return { ok: false, error: "provider.patch patch must not be empty" };
    const cur = (await db.collection(COL.providers).findOne(scopedIdFilter(id))) as unknown as (Provider & { _id?: unknown }) | null;
    const { _id: _currentId, ...currentDoc } = (cur ?? {}) as Provider & { _id?: unknown };
    const merged: Partial<Provider> = { ...currentDoc, ...patch };
    const imgErr = validateProviderImages(merged);
    if (imgErr) return { ok: false, error: imgErr };
    const providerErr = validateProviderDocument(merged);
    if (providerErr) return { ok: false, error: providerErr };
    const prepared = withCatalogProject(withProviderFreshness(merged as Provider, cur, new Date().toISOString()));
    const duplicateError = await validateCatalogImageUniqueness(db, { entityKind: "provider", document: prepared });
    if (duplicateError) return { ok: false, error: duplicateError };
    await db
      .collection(COL.providers)
      .updateOne(scopedIdFilter(id), {
        $set: {
          ...patch,
          catalogProject: prepared.catalogProject,
          publishedAt: prepared.publishedAt,
          updatedAt: prepared.updatedAt,
        },
      });
    await syncCatalogImageFingerprintForEntity(db, { entityKind: "provider", document: prepared });
    return { ok: true };
  }

  if (resource === "provider" && action === "delete") {
    const id = op.id;
    if (typeof id !== "string" || !id) return { ok: false, error: "provider.delete requires id string" };
    await db.collection(COL.providers).deleteOne(scopedIdFilter(id));
    await removeCatalogMediaFingerprintsForEntity(db, "provider", id);
    return { ok: true };
  }

  if (resource === "providers" && action === "upsertMany") {
    const documents = op.documents;
    if (!Array.isArray(documents) || documents.length === 0) {
      return { ok: false, error: "providers.upsertMany requires non-empty documents array" };
    }
    const ids = documents.map((raw) => (raw as Provider).id);
    const existingById = await loadExistingProvidersById(db, ids);
    const nowIso = new Date().toISOString();
    const currentProviders = (await db.collection(COL.providers).find(buildCatalogScopeFilter({})).toArray()) as unknown as Provider[];
    const currentMeetups = (await db.collection(COL.meetupGroups).find(buildCatalogScopeFilter({})).toArray()) as unknown as MeetupGroup[];
    const nextProvidersById = new Map(currentProviders.map((provider) => [provider.id, provider]));
    const writes: AnyBulkWriteOperation<Document>[] = [];
    const preparedProviders: Provider[] = [];
    for (const raw of documents) {
      if (!isPlainObject(raw)) return { ok: false, error: "providers.upsertMany: each item must be an object" };
      const { _id, ...rest } = raw as unknown as Provider & { _id?: unknown };
      if (!rest.id || typeof rest.id !== "string") return { ok: false, error: "providers.upsertMany: each document needs string id" };
      const imgErr = validateProviderImages(rest);
      if (imgErr) return { ok: false, error: imgErr };
      const providerErr = validateProviderDocument(rest);
      if (providerErr) return { ok: false, error: providerErr };
      const prepared = withCatalogProject(withProviderFreshness(rest as Provider, existingById.get(rest.id) ?? null, nowIso));
      nextProvidersById.set(rest.id, prepared);
      preparedProviders.push(prepared);
      writes.push({
        replaceOne: {
          filter: scopedIdFilter(rest.id),
          replacement: prepared as unknown as Document,
          upsert: true,
        },
      });
    }
    const prospectiveProviders = [...nextProvidersById.values()];
    for (const provider of preparedProviders) {
      const duplicateError = await validateCatalogImageUniqueness(db, {
        entityKind: "provider",
        document: provider,
        providers: prospectiveProviders,
        meetups: currentMeetups,
      });
      if (duplicateError) return { ok: false, error: duplicateError };
    }
    await db.collection(COL.providers).bulkWrite(writes, { ordered: false });
    for (const provider of preparedProviders) {
      await syncCatalogImageFingerprintForEntity(db, { entityKind: "provider", document: provider });
    }
    return { ok: true };
  }

  if (resource === "meetupGroup" && action === "upsert") {
    const doc = op.document;
    if (!isPlainObject(doc)) return { ok: false, error: "meetupGroup.upsert requires document object" };
    const { _id, ...rest } = doc as unknown as MeetupGroup & { _id?: unknown };
    if (!rest.id || typeof rest.id !== "string") return { ok: false, error: "meetupGroup.document.id required" };
    const imgErr = validateMeetupCover(rest);
    if (imgErr) return { ok: false, error: imgErr };
    const meetupErr = validateMeetupDocument(rest);
    if (meetupErr) return { ok: false, error: meetupErr };
    const scopedRest = withCatalogProject(rest);
    const duplicateError = await validateCatalogImageUniqueness(db, { entityKind: "meetupGroup", document: scopedRest as MeetupGroup });
    if (duplicateError) return { ok: false, error: duplicateError };
    await db.collection(COL.meetupGroups).replaceOne(scopedIdFilter(rest.id), scopedRest as MeetupGroup, {
      upsert: true,
    });
    await syncCatalogImageFingerprintForEntity(db, { entityKind: "meetupGroup", document: scopedRest as MeetupGroup });
    return { ok: true };
  }

  if (resource === "meetupGroup" && action === "patch") {
    const id = op.id;
    if (typeof id !== "string" || !id) return { ok: false, error: "meetupGroup.patch requires id string" };
    const patchIn = op.patch;
    if (!isPlainObject(patchIn)) return { ok: false, error: "meetupGroup.patch requires patch object" };
    const { id: _drop, ...patch } = patchIn as { id?: string };
    if (Object.keys(patch).length === 0) return { ok: false, error: "meetupGroup.patch patch must not be empty" };
    const cur = (await db.collection(COL.meetupGroups).findOne(scopedIdFilter(id))) as unknown as MeetupGroup | null;
    const merged: Partial<MeetupGroup> = { ...(cur ?? {}), ...patch };
    const imgErr = validateMeetupCover(merged);
    if (imgErr) return { ok: false, error: imgErr };
    const meetupErr = validateMeetupDocument(merged);
    if (meetupErr) return { ok: false, error: meetupErr };
    const scopedMerged = withCatalogProject(merged as MeetupGroup);
    const duplicateError = await validateCatalogImageUniqueness(db, { entityKind: "meetupGroup", document: scopedMerged as MeetupGroup });
    if (duplicateError) return { ok: false, error: duplicateError };
    await db.collection(COL.meetupGroups).updateOne(scopedIdFilter(id), { $set: { ...patch, catalogProject: scopedMerged.catalogProject } });
    await syncCatalogImageFingerprintForEntity(db, { entityKind: "meetupGroup", document: scopedMerged as MeetupGroup });
    return { ok: true };
  }

  if (resource === "meetupGroup" && action === "delete") {
    const id = op.id;
    if (typeof id !== "string" || !id) return { ok: false, error: "meetupGroup.delete requires id string" };
    await db.collection(COL.meetupGroups).deleteOne(scopedIdFilter(id));
    await removeCatalogMediaFingerprintsForEntity(db, "meetupGroup", id);
    return { ok: true };
  }

  if (resource === "meetupGroups" && action === "upsertMany") {
    const documents = op.documents;
    if (!Array.isArray(documents) || documents.length === 0) {
      return { ok: false, error: "meetupGroups.upsertMany requires non-empty documents array" };
    }
      const currentProviders = (await db.collection(COL.providers).find(buildCatalogScopeFilter({})).toArray()) as unknown as Provider[];
    const currentMeetups = (await db.collection(COL.meetupGroups).find(buildCatalogScopeFilter({})).toArray()) as unknown as MeetupGroup[];
    const nextMeetupsById = new Map(currentMeetups.map((meetup) => [meetup.id, meetup]));
    const writes: AnyBulkWriteOperation<Document>[] = [];
    const normalizedMeetups: MeetupGroup[] = [];
    for (const raw of documents) {
      if (!isPlainObject(raw)) return { ok: false, error: "meetupGroups.upsertMany: each item must be an object" };
      const { _id, ...rest } = raw as unknown as MeetupGroup & { _id?: unknown };
      if (!rest.id || typeof rest.id !== "string") return { ok: false, error: "meetupGroups.upsertMany: each document needs string id" };
      const imgErr = validateMeetupCover(rest);
      if (imgErr) return { ok: false, error: imgErr };
      const meetupErr = validateMeetupDocument(rest);
      if (meetupErr) return { ok: false, error: meetupErr };
      const prepared = withCatalogProject(rest) as MeetupGroup;
      nextMeetupsById.set(rest.id, prepared);
      normalizedMeetups.push(prepared);
      writes.push({
        replaceOne: {
          filter: scopedIdFilter(rest.id),
          replacement: prepared as unknown as Document,
          upsert: true,
        },
      });
    }
    const prospectiveMeetups = [...nextMeetupsById.values()];
    for (const meetup of normalizedMeetups) {
      const duplicateError = await validateCatalogImageUniqueness(db, {
        entityKind: "meetupGroup",
        document: meetup,
        providers: currentProviders,
        meetups: prospectiveMeetups,
      });
      if (duplicateError) return { ok: false, error: duplicateError };
    }
    await db.collection(COL.meetupGroups).bulkWrite(writes, { ordered: false });
    for (const meetup of normalizedMeetups) {
      await syncCatalogImageFingerprintForEntity(db, { entityKind: "meetupGroup", document: meetup });
    }
    return { ok: true };
  }

  if (resource === "site" && action === "patch") {
    const patch = op.patch;
    if (!isPlainObject(patch)) return { ok: false, error: "site.patch requires patch object" };
    const { _id: _dropId, ...rest } = patch as Partial<SiteDoc>;
    const imgErr = validateSiteRasterUrls(rest as unknown as Record<string, unknown>);
    if (imgErr) return { ok: false, error: imgErr };
    await db.collection(COL.site).updateOne(
      { _id: "main" as never },
      { $set: { ...rest, _id: "main" } },
      { upsert: true },
    );
    return { ok: true };
  }

  if (resource === "locations" && action === "replace") {
    const locations = op.locations;
    if (!Array.isArray(locations)) return { ok: false, error: "locations.replace requires locations array" };
    for (const row of locations) {
      if (!isPlainObject(row)) return { ok: false, error: "locations.replace: each row must be an object" };
      if (typeof row.borough !== "string") return { ok: false, error: "locations.replace: each row needs borough" };
      if (!Array.isArray(row.neighborhoods)) return { ok: false, error: "locations.replace: each row needs neighborhoods array" };
    }
    await db.collection(COL.locations).deleteMany({});
    if (locations.length > 0) {
      await db.collection(COL.locations).insertMany(locations as LocRow[]);
    }
    return { ok: true };
  }

  return { ok: false, error: `unknown resource/action: ${String(resource)}/${String(action)}` };
}
