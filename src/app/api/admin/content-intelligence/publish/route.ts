import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { runRangeScoutPublishService } from "@/lib/contentIntelligence/publishService";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const body = await request.json();
    const origin = new URL(request.url).origin;
    const { result } = await runRangeScoutPublishService(db, body, { origin });

    return NextResponse.json(result, {
      status: result.status === "blocked" ? 422 : result.status === "published" ? 200 : 207,
    });
  } catch (error) {
    console.error("[API:ContentIntelligence:Publish] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
