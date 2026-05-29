import { NextResponse } from "next/server";
import { getDb, COL } from "@/lib/mongodb";
import type { Provider } from "@/types/provider";
import { normalizeProviderFreshness } from "@/lib/providerFreshness";
import { deriveNextOccurrence } from "@/lib/providerSchedule";

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
  const rows = (await db.collection(COL.providers).find({}).toArray()) as unknown as (Provider & { _id?: unknown })[];
  const providers = rows
    .map((row) => {
      const normalized = normalizeProviderFreshness(row);
      return stripId({
        ...normalized,
        nextOccurrence: deriveNextOccurrence(normalized),
      });
    })
    .sort((left, right) => (right.publishedAt ?? "").localeCompare(left.publishedAt ?? ""));
  return NextResponse.json(providers);
}
