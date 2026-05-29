import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  runHistoricalDuplicateImageRemediation,
  seedHistoricalDuplicateImageQueue,
} from "@/lib/contentIntelligence/historicalImageRemediation";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: "seed" | "run";
      limit?: number;
    };

    if (body.action === "run") {
      const result = await runHistoricalDuplicateImageRemediation(db, {
        limit: typeof body.limit === "number" && Number.isFinite(body.limit) ? body.limit : 10,
      });
      return NextResponse.json({ action: "run", result });
    }

    const result = await seedHistoricalDuplicateImageQueue(db, {
      includeNearDuplicates: true,
      nearDuplicateThreshold: 0,
    });
    return NextResponse.json({ action: "seed", result });
  } catch (error) {
    console.error("[API:ContentIntelligence:ImageRemediationRun] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
