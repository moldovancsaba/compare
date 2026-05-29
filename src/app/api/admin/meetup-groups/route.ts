import { NextResponse } from "next/server";
import { getDb, COL } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import type { MeetupGroup } from "@/types/meetup";
import { applyIngestOperation } from "@/lib/ingestOperations";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });
  return NextResponse.json(await db.collection(COL.meetupGroups).find({}).toArray());
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });
  const body = (await req.json()) as MeetupGroup & { _id?: unknown };
  const result = await applyIngestOperation(db, { resource: "meetupGroup", action: "upsert", document: body });
  if (result.ok === false) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, data: result.data ?? null });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });
  const body = (await req.json()) as Partial<MeetupGroup> & { id: string };
  const result = await applyIngestOperation(db, { resource: "meetupGroup", action: "patch", id: body.id, patch: body });
  if (result.ok === false) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, data: result.data ?? null });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query required" }, { status: 400 });
  const result = await applyIngestOperation(db, { resource: "meetupGroup", action: "delete", id });
  if (result.ok === false) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
