import { NextResponse } from "next/server";
import { discoverRangeScoutCandidates } from "@/lib/contentIntelligence/discoveryWorker";
import { loadRangeScoutScoringContext } from "@/lib/contentIntelligence/loadScoringContext";
import { requireIngestKey } from "@/lib/requireIngestKey";

export async function POST(request: Request) {
  const denied = requireIngestKey(request);
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    const context = await loadRangeScoutScoringContext();
    const result = await discoverRangeScoutCandidates({
      snapshot: context.snapshot,
      providers: context.providers,
      meetups: context.meetups,
      maxTargets: typeof body.maxTargets === "number" ? body.maxTargets : undefined,
      maxCandidates: typeof body.maxCandidates === "number" ? body.maxCandidates : undefined,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[API:ContentIntelligence:DiscoverCandidates] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
