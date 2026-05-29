import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  listCatalogImageRemediationQueue,
  updateCatalogImageRemediationQueueItem,
} from "@/lib/contentIntelligence/catalogImageUniqueness";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const rows = await listCatalogImageRemediationQueue(db);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("[API:ContentIntelligence:ImageRemediation] list failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const body = (await request.json()) as {
      queueId?: string;
      status?: "queued" | "retrying" | "resolved" | "blocked_no_unique_candidate";
      resolutionNotes?: string;
      resolved?: boolean;
    };

    const queueId = String(body.queueId || "").trim();
    if (!queueId) return NextResponse.json({ error: "queueId required" }, { status: 400 });

    const patch = {
      status: body.status,
      resolutionNotes: typeof body.resolutionNotes === "string" ? body.resolutionNotes.trim() : undefined,
      resolvedAt: body.status === "resolved" || body.resolved ? new Date().toISOString() : undefined,
    };

    const row = await updateCatalogImageRemediationQueueItem(db, queueId, patch);
    if (!row) return NextResponse.json({ error: "queue item not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    console.error("[API:ContentIntelligence:ImageRemediation] patch failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
