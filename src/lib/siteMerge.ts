import type { SiteDoc } from "@/types/site";

/** Return the stored site document as-is. No fallback content is synthesized here. */
export function mergeSiteDocument(doc: Partial<SiteDoc> | null | undefined): SiteDoc | null {
  if (!doc) return null;
  return { _id: "main", ...(doc as Omit<SiteDoc, "_id">) } as SiteDoc;
}
