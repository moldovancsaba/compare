import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { createLiveListingRevisionPacket } from "@/lib/contentIntelligence/liveRevisionBridge";
import { requireIngestKey } from "@/lib/requireIngestKey";

export async function POST(request: Request) {
  const denied = requireIngestKey(request);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const listingId = typeof body.listingId === "string" ? body.listingId : "";
    const listingType = body.listingType === "provider" || body.listingType === "meetupGroup" ? body.listingType : null;
    if (!listingId || !listingType) {
      return NextResponse.json({ error: "listingId and listingType are required" }, { status: 400 });
    }

    const result = await createLiveListingRevisionPacket(db, {
      checklistCompanyId: typeof body.checklistCompanyId === "string" ? body.checklistCompanyId : null,
      listingType,
      listingId,
      origin: new URL(request.url).origin,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : result.status });
  } catch (error) {
    console.error("[API:ContentIntelligence:MachineLiveListingRevision] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
