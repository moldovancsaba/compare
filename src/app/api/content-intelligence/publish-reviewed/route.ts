import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { runRangeScoutPublishService } from "@/lib/contentIntelligence/publishService";
import { requireIngestKey } from "@/lib/requireIngestKey";

export async function POST(request: Request) {
  const denied = requireIngestKey(request);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const body = await request.json();
    const origin = new URL(request.url).origin;
    const { result, gateResult } = await runRangeScoutPublishService(db, body, { origin });

    return NextResponse.json(
      {
        ...result,
        gateResult,
      },
      { status: result.status === "blocked" ? 422 : result.status === "published" ? 200 : 207 },
    );
  } catch (error) {
    console.error("[API:ContentIntelligence:PublishReviewed] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
