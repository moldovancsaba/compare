import { NextResponse } from "next/server";
import { getDb, COL } from "@/lib/mongodb";
import type { Borough } from "@/types/provider";
import { BOROUGHS, NEIGHBORHOODS as FALLBACK } from "@/data/locations";
import { buildCatalogScopeFilter } from "@/lib/mongodb";

const BLOCKED_PLACEHOLDER_NEIGHBORHOODS = [
  "black forest",
  "brittany",
  "andalusia",
  "view all",
  "budapest hills",
];

function canonicalBorough(raw: unknown): Borough | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const normalized = cleaned === "HU" ? "Hungary" : cleaned;
  return BOROUGHS.includes(normalized as never) ? (normalized as Borough) : null;
}

function sanitizeNeighborhoods(borough: Borough, input: unknown): string[] {
  const values = Array.isArray(input) ? input.map((item) => String(item || "").trim()).filter(Boolean) : [];
  const deduped = [...new Set(values)];
  const withoutPlaceholders = deduped.filter((name) => {
    const normalized = name.toLowerCase();
    return !BLOCKED_PLACEHOLDER_NEIGHBORHOODS.some((token) => normalized.includes(token));
  });
  return withoutPlaceholders;
}

function addRegion(map: Record<string, Set<string>>, boroughRaw: unknown, neighborhoodRaw: unknown) {
  const borough = canonicalBorough(boroughRaw);
  if (!borough || typeof neighborhoodRaw !== "string") return;
  const [region] = sanitizeNeighborhoods(borough, [neighborhoodRaw]);
  if (!region) return;
  if (!map[borough]) map[borough] = new Set();
  map[borough].add(region);
}

export async function GET() {
  const db = await getDb();
  if (!db) {
    return NextResponse.json(FALLBACK);
  }
  const [providerRows, meetupRows] = await Promise.all([
    db.collection(COL.providers).find(buildCatalogScopeFilter({})).project({ borough: 1, neighborhood: 1 }).toArray(),
    db.collection(COL.meetupGroups).find(buildCatalogScopeFilter({})).project({ borough: 1, neighborhood: 1 }).toArray(),
  ]);
  const regionSets: Record<string, Set<string>> = {};
  for (const row of [...providerRows, ...meetupRows] as Array<{ borough?: unknown; neighborhood?: unknown }>) {
    addRegion(regionSets, row.borough, row.neighborhood);
  }
  const map: Record<string, string[]> = {};
  BOROUGHS.forEach((borough) => {
    map[borough] = [...(regionSets[borough] ?? new Set<string>())].sort((left, right) => left.localeCompare(right, "hu"));
  });
  return NextResponse.json(map as Record<Borough, string[]>);
}
