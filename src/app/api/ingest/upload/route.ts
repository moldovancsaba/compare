import { NextResponse } from "next/server";
import { requireIngestKey } from "@/lib/requireIngestKey";

export async function POST(req: Request) {
  const denied = requireIngestKey(req);
  if (denied) return denied;

  const key = process.env.IMGBB_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "IMGBB_API_KEY is not set" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");
  const body = new URLSearchParams();
  body.set("key", key);
  body.set("image", base64);

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: { url: string; display_url: string; delete_url?: string };
    error?: { message?: string };
  };
  if (!json.success || !json.data?.url) {
    return NextResponse.json(
      { error: json.error?.message || "ImgBB upload failed" },
      { status: 502 },
    );
  }
  return NextResponse.json({ url: json.data.url, displayUrl: json.data.display_url });
}
