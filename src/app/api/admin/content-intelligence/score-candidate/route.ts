import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { scoreRangeScoutCandidate } from "@/lib/contentIntelligence/scarcityRulebook";
import { loadRangeScoutScoringContext } from "@/lib/contentIntelligence/loadScoringContext";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!body.normalizedListing || typeof body.normalizedListing !== "object" || Array.isArray(body.normalizedListing)) {
      return NextResponse.json({ error: "normalizedListing is required" }, { status: 400 });
    }

    const { providers, meetups, snapshot } = await loadRangeScoutScoringContext();
    const result = await scoreRangeScoutCandidate({
      normalizedListing: body.normalizedListing,
      providers,
      meetups,
      snapshot,
    });

    return NextResponse.json({ ok: true, result, snapshotGeneratedAt: snapshot.generatedAt });
  } catch (error) {
    console.error("[API:ContentIntelligence:ScoreCandidate] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
