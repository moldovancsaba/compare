import { NextResponse } from "next/server";
import { getDb, COL } from "@/lib/mongodb";
import { mergeSiteDocument } from "@/lib/siteMerge";
import type { SiteDoc } from "@/types/site";

export async function GET() {
  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }
  const doc = (await db.collection(COL.site).findOne({ _id: "main" } as never)) as unknown as Partial<SiteDoc> | null;
  const site = mergeSiteDocument(doc);
  if (!site) return NextResponse.json({ error: "Site document not found" }, { status: 404 });
  return NextResponse.json(site);
}
