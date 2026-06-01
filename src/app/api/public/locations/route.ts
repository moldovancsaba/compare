import { NextResponse } from "next/server";
import { getDb, COL } from "@/lib/mongodb";
import type { Borough } from "@/types/provider";
import { BOROUGHS, NEIGHBORHOODS as FALLBACK } from "@/data/locations";

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
  const fallbackAllowed = new Set(FALLBACK[borough] ?? []);
  const inFallback = withoutPlaceholders.filter((name) => fallbackAllowed.has(name));
  return inFallback.length > 0 ? inFallback : (FALLBACK[borough] ?? []);
}

export async function GET() {
  const db = await getDb();
  if (!db) {
    return NextResponse.json(FALLBACK);
  }
  const rows = await db.collection(COL.locations).find({}).toArray();
  if (!rows.length) {
    return NextResponse.json(FALLBACK);
  }
  const map: Record<string, string[]> = {};
  for (const r of rows) {
    const row = r as unknown as { borough?: Borough; neighborhoods?: string[] };
    const rawBorough = row.borough;
    const b = canonicalBorough(rawBorough);
    const n = row.neighborhoods;
    if (b) map[b] = sanitizeNeighborhoods(b, n);
  }
  BOROUGHS.forEach((borough) => {
    if (!map[borough]) map[borough] = FALLBACK[borough] ?? [];
  });
  return NextResponse.json(map as Record<Borough, string[]>);
}
