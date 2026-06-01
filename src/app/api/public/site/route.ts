import { NextResponse } from "next/server";
import { getDb, COL } from "@/lib/mongodb";
import { mergeSiteDocument } from "@/lib/siteMerge";
import type { SiteDoc } from "@/types/site";
import { normalizeLocale, type AppLocale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { localizeSiteDocument } from "@/lib/i18n/messages";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = normalizeLocale(url.searchParams.get("locale"));
  return getSitePayload(locale);
}

async function getSitePayload(locale: AppLocale = DEFAULT_LOCALE) {
  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }
  const doc = (await db.collection(COL.site).findOne({ _id: "main" } as never)) as unknown as Partial<SiteDoc> | null;
  const site = mergeSiteDocument(doc);
  if (!site) return NextResponse.json({ error: "Site document not found" }, { status: 404 });
  return NextResponse.json(localizeSiteDocument(site, locale));
}
