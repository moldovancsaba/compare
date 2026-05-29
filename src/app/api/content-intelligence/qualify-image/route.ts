import { NextResponse } from "next/server";
import { qualifyOfficialImageCandidate, validateOfficialImageCandidate } from "@/lib/contentIntelligence/mediaPipeline";
import { requireIngestKey } from "@/lib/requireIngestKey";

export async function POST(request: Request) {
  const denied = requireIngestKey(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const validation = validateOfficialImageCandidate(body);
    if (!validation.ok) {
      return NextResponse.json({ ok: false, qualification: { status: "rejected", findings: validation.diagnostics } }, { status: 422 });
    }

    const response = await fetch(body.sourceImageUrl);
    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          qualification: {
            status: "upload_failed",
            findings: [
              {
                code: "image_fetch_failed",
                severity: "error",
                message: `Official image download failed with status ${response.status}.`,
                retryable: response.status >= 500,
                remediationHint: "Retry if the source is temporarily unavailable or choose another official image.",
              },
            ],
          },
        },
        { status: 502 },
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    const qualification = qualifyOfficialImageCandidate(body, {
      mimeType: response.headers.get("content-type") || "application/octet-stream",
      byteLength: arrayBuffer.byteLength,
    });

    return NextResponse.json({
      ok: qualification.status === "accepted",
      qualification,
      diagnostics: qualification.findings,
    });
  } catch (error) {
    console.error("[API:ContentIntelligence:QualifyImage] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
