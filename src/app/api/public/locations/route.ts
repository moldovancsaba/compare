import { NextResponse } from "next/server";
import { getDb, COL } from "@/lib/mongodb";
import type { Borough } from "@/types/provider";
import { NEIGHBORHOODS as FALLBACK } from "@/data/locations";

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
    const b = row.borough;
    const n = row.neighborhoods;
    if (b && Array.isArray(n)) map[b] = n;
  }
  return NextResponse.json(map as Record<Borough, string[]>);
}
