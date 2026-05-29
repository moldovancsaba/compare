import { ObjectId } from "mongodb";
import type { Provider } from "@/types/provider";

function inferTimestampFromId(value: unknown): string | null {
  if (value instanceof ObjectId) return value.getTimestamp().toISOString();
  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value).getTimestamp().toISOString();
  }
  return null;
}

export function inferPublishedAt(
  doc: Pick<Provider, "publishedAt" | "updatedAt"> & { _id?: unknown },
  fallbackIso: string,
): string {
  return doc.publishedAt ?? doc.updatedAt ?? inferTimestampFromId(doc._id) ?? fallbackIso;
}

export function withProviderFreshness(
  next: Provider,
  existing: (Provider & { _id?: unknown }) | null,
  nowIso = new Date().toISOString(),
): Provider {
  return {
    ...next,
    publishedAt: inferPublishedAt(existing ?? next, nowIso),
    updatedAt: nowIso,
  };
}

export function normalizeProviderFreshness(
  provider: Provider & { _id?: unknown },
  fallbackIso = new Date(0).toISOString(),
): Provider {
  const publishedAt = inferPublishedAt(provider, fallbackIso);
  return {
    ...provider,
    publishedAt,
    updatedAt: provider.updatedAt ?? publishedAt,
  };
}
