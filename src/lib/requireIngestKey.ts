import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function extractIngestKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }
  const x = req.headers.get("x-ingest-key")?.trim();
  if (x) return x;
  return null;
}

/** Returns a NextResponse when the request must be rejected; otherwise null. */
export function requireIngestKey(req: Request): NextResponse | null {
  const configured = process.env.INGEST_API_KEY?.trim();
  if (!configured) {
    return NextResponse.json({ error: "Ingest API is not configured (set INGEST_API_KEY)" }, { status: 503 });
  }
  const provided = extractIngestKey(req);
  if (!provided) {
    return NextResponse.json(
      { error: "Missing credentials: Authorization Bearer <key> or X-Ingest-Key" },
      { status: 401 },
    );
  }
  const a = Buffer.from(configured, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
