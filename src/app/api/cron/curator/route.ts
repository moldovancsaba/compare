import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { runCuratorDiscovery } from "@/lib/curator/runCuratorDiscovery";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

/** Vercel Cron + manual runs: Authorization: Bearer <CRON_SECRET> (see Vercel cron docs). */
function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization")?.trim() ?? "";
  const x = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return x.length > 0 && x === secret;
}

/**
 * Scheduled curator: external search → fetch official page → deterministic local extraction
 * → validate → dedupe → Mongo upsert (same path as /api/ingest).
 *
 * Env:
 *   CRON_SECRET           — required for this route (Vercel injects on cron when set)
 *   CURATOR_ENABLED=true  — master switch
 *   SERPER_API_KEY        — serper.dev Google search
 *
 * External LLM extraction is intentionally prohibited for Compare curator runs.
 * Search/fetch may use external sources, but interpretation must remain local.
 */
export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }

  try {
    const result = await runCuratorDiscovery(db);
    /** Always 200 for cron body so Vercel does not retry on "no candidate" business outcomes. */
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
