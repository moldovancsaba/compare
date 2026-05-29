import { NextResponse } from "next/server";
import { getDb, COL } from "@/lib/mongodb";
import type { Borough } from "@/types/provider";
import { BOROUGHS, NEIGHBORHOODS as FALLBACK } from "@/data/locations";

function canonicalBorough(raw: unknown): Borough | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const normalized = cleaned === "HU" ? "Hungary" : cleaned;
  return BOROUGHS.includes(normalized as never) ? (normalized as Borough) : null;
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
    if (b && Array.isArray(n)) map[b] = n;
  }
  BOROUGHS.forEach((borough) => {
    if (!map[borough]) map[borough] = FALLBACK[borough] ?? [];
  });
  return NextResponse.json(map as Record<Borough, string[]>);
}
