import { NextResponse } from "next/server";
import { getDb, COL } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { mergeSiteDocument } from "@/lib/siteMerge";
import type { SiteDoc } from "@/types/site";
import { validateSiteRasterUrls } from "@/lib/imgbbUrl";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });
  const doc = (await db.collection(COL.site).findOne({ _id: "main" } as never)) as unknown as Partial<SiteDoc> | null;
  const site = mergeSiteDocument(doc);
  if (!site) return NextResponse.json({ error: "Site document not found" }, { status: 404 });
  return NextResponse.json(site);
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });
  const patch = (await req.json()) as Partial<Omit<SiteDoc, "_id">>;
  const imgErr = validateSiteRasterUrls(patch as unknown as Record<string, unknown>);
  if (imgErr) return NextResponse.json({ error: imgErr }, { status: 400 });
  await db.collection(COL.site).updateOne(
    { _id: "main" as never },
    { $set: { ...patch, _id: "main" } },
    { upsert: true },
  );
  return NextResponse.json({ ok: true });
}
