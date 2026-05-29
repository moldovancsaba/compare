import { NextResponse } from "next/server";
import { buildCatalogScopeFilter, getDb, COL } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import type { Provider } from "@/types/provider";
import { applyIngestOperation } from "@/lib/ingestOperations";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });
  const rows = await db.collection(COL.providers).find(buildCatalogScopeFilter({})).toArray();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });
  const body = (await req.json()) as Provider & { _id?: unknown };
  const result = await applyIngestOperation(db, { resource: "provider", action: "upsert", document: body });
  if (result.ok === false) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, data: result.data ?? null });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });
  const body = (await req.json()) as Partial<Provider> & { id: string };
  const result = await applyIngestOperation(db, { resource: "provider", action: "patch", id: body.id, patch: body });
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
  const result = await applyIngestOperation(db, { resource: "provider", action: "delete", id });
  if (result.ok === false) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
