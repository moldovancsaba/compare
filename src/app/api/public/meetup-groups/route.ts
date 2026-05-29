import { NextResponse } from "next/server";
import { buildCatalogScopeFilter, getDb, COL } from "@/lib/mongodb";
import type { MeetupGroup } from "@/types/meetup";
import { filterObsoleteContent } from "@/lib/catalogContentPolicy";

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
  const rows = (await db.collection(COL.meetupGroups).find(buildCatalogScopeFilter({})).toArray()) as unknown as (MeetupGroup & {
    _id?: unknown;
  })[];
  return NextResponse.json(filterObsoleteContent(rows.map(stripId)));
}
