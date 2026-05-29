import { NextResponse } from "next/server";
import { resolveRangeScoutDraft } from "@/lib/contentIntelligence/rangeScoutAdapter";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const result = resolveRangeScoutDraft(body);
    return NextResponse.json(result, { status: result.blockingIssues.length ? 422 : 200 });
  } catch (error) {
    console.error("[API:ContentIntelligence:ResolveDraft] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
