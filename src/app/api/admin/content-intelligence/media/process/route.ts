import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { processOfficialImage } from "@/lib/contentIntelligence/mediaPipeline";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const origin = new URL(request.url).origin;
    const result = await processOfficialImage(body, {
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
    });

    return NextResponse.json(result, { status: result.status === "ready" ? 200 : 422 });
  } catch (error) {
    console.error("[API:ContentIntelligence:MediaProcess] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
