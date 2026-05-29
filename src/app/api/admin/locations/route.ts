import { NextResponse } from "next/server";
import { getDb, COL } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import type { Borough } from "@/types/provider";

type LocRow = { borough: Borough; neighborhoods: string[] };

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });
  return NextResponse.json(await db.collection(COL.locations).find({}).toArray());
}

/** Replace all neighborhood rows (one document per borough). */
export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });
  const body = (await req.json()) as { locations?: LocRow[] };
  if (!Array.isArray(body.locations)) {
    return NextResponse.json({ error: "locations array required" }, { status: 400 });
  }
  await db.collection(COL.locations).deleteMany({});
  if (body.locations.length) {
    await db.collection(COL.locations).insertMany(body.locations);
  }
  return NextResponse.json({ ok: true });
}
