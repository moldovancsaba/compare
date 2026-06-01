import { NextResponse } from "next/server";
import { buildCatalogScopeFilter, getDb, COL } from "@/lib/mongodb";
import type { Provider } from "@/types/provider";
import { normalizeProviderFreshness } from "@/lib/providerFreshness";
import { deriveNextOccurrence } from "@/lib/providerSchedule";
import { sanitizeProviderForPublic } from "@/lib/contentIntelligence/publicCopySanitizer";
import { filterObsoleteContent } from "@/lib/catalogContentPolicy";
import { BOROUGHS } from "@/data/locations";
import { ensureLaunchCatalogSeeded } from "@/lib/catalogBootstrap";

function normalizeBorough(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim();
  if (!cleaned) return null;
  if (cleaned === "HU") return "Hungary";
  return BOROUGHS.includes(cleaned as never) ? cleaned : null;
}

function normalizeProvider(row: Provider): Provider {
  const normalizedBorough = normalizeBorough((row as { borough?: unknown }).borough);
  if (!normalizedBorough || normalizedBorough === row.borough) return row;
  return { ...row, borough: normalizedBorough } as Provider;
}

function stripId<T extends object>(doc: T): T {
  const o = { ...doc } as Record<string, unknown>;
  delete o._id;
  return o as T;
}

export async function GET() {
  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured (MONGODB_URI)" }, { status: 503 });
  }
  await ensureLaunchCatalogSeeded(db);
  const rows = (await db.collection(COL.providers).find(buildCatalogScopeFilter({})).toArray()) as unknown as (Provider & {
    _id?: unknown;
  })[];
  const scoped = rows
    .map(normalizeProvider)
    .filter((row) => Boolean(normalizeBorough((row as { borough?: unknown }).borough)));
  const providers = filterObsoleteContent(
    scoped
    .map((row) => {
      const normalized = normalizeProviderFreshness(row);
      const sanitized = sanitizeProviderForPublic({
        ...normalized,
      } as Provider).payload;
      return stripId({
        ...sanitized,
        nextOccurrence: deriveNextOccurrence(sanitized),
      });
    }),
  ).sort((left, right) => (right.publishedAt ?? "").localeCompare(left.publishedAt ?? ""));
  return NextResponse.json(providers);
}
