import { NextResponse } from "next/server";
import { buildCatalogScopeFilter, getDb, COL } from "@/lib/mongodb";
import type { MeetupGroup } from "@/types/meetup";
import { sanitizeMeetupForPublic } from "@/lib/contentIntelligence/publicCopySanitizer";
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

function stripId<T extends object>(doc: T): T {
  const o = { ...doc } as Record<string, unknown>;
  delete o._id;
  return o as T;
}

function normalizeMeetup(row: MeetupGroup): MeetupGroup {
  const normalizedBorough = normalizeBorough((row as { borough?: unknown }).borough);
  if (!normalizedBorough || normalizedBorough === row.borough) return row;
  return { ...row, borough: normalizedBorough } as MeetupGroup;
}

export async function GET() {
  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured (MONGODB_URI)" }, { status: 503 });
  }
  await ensureLaunchCatalogSeeded(db);
  const rows = (await db.collection(COL.meetupGroups).find(buildCatalogScopeFilter({})).toArray()) as unknown as (MeetupGroup & {
    _id?: unknown;
  })[];
  const scoped = rows
    .map(normalizeMeetup)
    .filter((row) => Boolean(normalizeBorough((row as { borough?: unknown }).borough)));
  const sanitized = scoped.map((row) => sanitizeMeetupForPublic(row).payload).map(stripId);
  return NextResponse.json(filterObsoleteContent(sanitized));
}
