import { NextResponse } from "next/server";
import { buildCatalogScopeFilter, COL, getDb } from "@/lib/mongodb";
import { listCatalogMediaFingerprints } from "@/lib/contentIntelligence/catalogImageUniqueness";
import { buildDedupeIndexForGate, buildImageUniquenessIndexForGate, runRangeScoutPublishGate } from "@/lib/contentIntelligence/publishGate";
import { requireAdmin } from "@/lib/requireAdmin";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const body = await request.json();
    const [providers, meetups, fingerprints] = await Promise.all([
      db.collection(COL.providers).find(buildCatalogScopeFilter({})).toArray() as unknown as Promise<Provider[]>,
      db.collection(COL.meetupGroups).find(buildCatalogScopeFilter({})).toArray() as unknown as Promise<MeetupGroup[]>,
      listCatalogMediaFingerprints(db),
    ]);
    const result = await runRangeScoutPublishGate({
      entityKind: body.entityKind,
      draftPayload: body.draftPayload,
      adapterVersion: body.adapterVersion,
      mediaResult: body.mediaResult,
      dedupeIndex: buildDedupeIndexForGate(providers, meetups),
      imageUniquenessIndex: buildImageUniquenessIndexForGate(providers, meetups, fingerprints),
    });
    return NextResponse.json(result, { status: result.approved ? 200 : 422 });
  } catch (error) {
    console.error("[API:ContentIntelligence:PublishGate] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
