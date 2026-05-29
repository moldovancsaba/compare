import { NextResponse } from "next/server";
import { getLiveListingRevisionStatus } from "@/lib/contentIntelligence/liveRevisionBridge";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const listingId = typeof body.listingId === "string" ? body.listingId : "";
    const listingType = body.listingType === "provider" || body.listingType === "meetupGroup" ? body.listingType : null;
    if (!listingId || !listingType) {
      return NextResponse.json(
        { error: "listingId and listingType are required" },
        { status: 400 },
      );
    }

    const result = await getLiveListingRevisionStatus({
      checklistCompanyId: typeof body.checklistCompanyId === "string" ? body.checklistCompanyId : null,
      listingId,
      listingType,
    });
    return NextResponse.json(
      result,
      { status: result.ok ? 200 : result.status },
    );
  } catch (error) {
    console.error("[API:ContentIntelligence:LiveListingRevisionStatus] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
