import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireIngestKey } from "@/lib/requireIngestKey";
import { applyIngestOperation } from "@/lib/ingestOperations";

const MAX_OPS = 100;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Lightweight discovery for clients (same auth as POST). */
export async function GET(req: Request) {
  const denied = requireIngestKey(req);
  if (denied) return denied;
  return NextResponse.json({
    ok: true,
    post: "POST /api/ingest — batch JSON operations (see /api docs)",
    upload: "POST /api/ingest/upload — multipart field `file` → ImgBB URL",
    resources: [
      "providers (list, replaceAll, upsertMany, deleteMany)",
      "provider (get, upsert, patch, delete)",
      "meetupGroups (list, replaceAll, upsertMany, deleteMany)",
      "meetupGroup (get, upsert, patch, delete)",
      "site (get, patch, put)",
      "locations (list, replace)",
    ],
    limits: { maxOperationsPerRequest: MAX_OPS },
  });
}

export async function POST(req: Request) {
  const denied = requireIngestKey(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ops: unknown[] = Array.isArray((body as { operations?: unknown }).operations)
    ? ((body as { operations: unknown[] }).operations ?? [])
    : isPlainObject(body) && typeof (body as { resource?: unknown }).resource === "string"
      ? [body]
      : [];

  if (ops.length === 0) {
    return NextResponse.json(
      { error: "Send { operations: [...] } or a single operation { resource, action, ... }" },
      { status: 400 },
    );
  }
  if (ops.length > MAX_OPS) {
    return NextResponse.json({ error: `At most ${MAX_OPS} operations per request` }, { status: 400 });
  }

  const results: { index: number; ok: boolean; error?: string; data?: unknown }[] = [];
  for (let i = 0; i < ops.length; i++) {
    const res = await applyIngestOperation(db, ops[i]);
    if (res.ok === false) {
      results.push({ index: i, ok: false, error: res.error });
      continue;
    }
    results.push({
      index: i,
      ok: true,
      ...(res.data !== undefined ? { data: res.data } : {}),
    });
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 422 });
}
