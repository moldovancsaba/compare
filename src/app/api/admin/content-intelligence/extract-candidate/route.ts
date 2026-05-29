import { NextResponse } from "next/server";
import { extractRangeScoutCandidate } from "@/lib/contentIntelligence/extractionEngine";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    if (!body.discoveryArtifact || typeof body.discoveryArtifact !== "object" || Array.isArray(body.discoveryArtifact)) {
      return NextResponse.json({ error: "discoveryArtifact is required" }, { status: 400 });
    }
    const result = extractRangeScoutCandidate(body.discoveryArtifact);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[API:Admin:ContentIntelligence:ExtractCandidate] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
