import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { buildCatalogScopeFilter, COL, getDb } from "@/lib/mongodb";
import { listCatalogMediaFingerprints } from "@/lib/contentIntelligence/catalogImageUniqueness";
import { prepareRangeScoutReviewPacket } from "@/lib/contentIntelligence/prepareReviewPacket";
import { requireIngestKey } from "@/lib/requireIngestKey";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

export async function POST(request: Request) {
  const denied = requireIngestKey(request);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const body = await request.json();
    const origin = new URL(request.url).origin;
    const [providers, meetups, fingerprintRows] = await Promise.all([
      db.collection(COL.providers).find(buildCatalogScopeFilter({})).toArray() as unknown as Promise<Provider[]>,
      db.collection(COL.meetupGroups).find(buildCatalogScopeFilter({})).toArray() as unknown as Promise<MeetupGroup[]>,
      listCatalogMediaFingerprints(db),
    ]);

    const result = await prepareRangeScoutReviewPacket(
      {
        normalizedListing: body.normalizedListing,
        draftId: body.draftId,
        evidenceSummary:
          body.evidenceSummary && typeof body.evidenceSummary === "object" && !Array.isArray(body.evidenceSummary)
            ? body.evidenceSummary
            : {},
        workflowMetadata:
          body.workflowMetadata && typeof body.workflowMetadata === "object" && !Array.isArray(body.workflowMetadata)
            ? body.workflowMetadata
            : {},
        mediaRequest:
          body.mediaRequest && typeof body.mediaRequest === "object" && !Array.isArray(body.mediaRequest)
            ? body.mediaRequest
            : null,
        metadata:
          body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : null,
      },
      {
        providers,
        meetups,
        uploadImage: async (file) => {
          const form = new FormData();
          form.set("file", file);
          const response = await fetch(`${origin}/api/ingest/upload`, {
            method: "POST",
            headers: {
              "x-ingest-key": process.env.INGEST_API_KEY || "",
            },
            body: form,
          });
          const json = (await response.json()) as { url?: string; error?: string };
          if (!response.ok || !json.url) {
            throw new Error(json.error || "ImgBB upload failed");
          }
          return { url: json.url };
        },
        hashBuffer: async (arrayBuffer) => createHash("sha256").update(Buffer.from(arrayBuffer)).digest("hex"),
        fingerprintRows,
        db,
      },
    );

    return NextResponse.json(result, {
      status:
        result.status === "blocked" ? 422 : result.status === "review_submitted" ? 200 : 207,
    });
  } catch (error) {
    console.error("[API:ContentIntelligence:PrepareReviewMachine] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
