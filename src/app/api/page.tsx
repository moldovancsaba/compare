import type { Metadata } from "next";
import { headers } from "next/headers";
import { ApiDocsPage } from "@/components/api/ApiDocsPage";

export const metadata: Metadata = {
  title: "HTTP API reference | RangeScout",
  description:
    "RangeScout HTTP APIs: public catalog, machine ingest, and admin session endpoints for EU shooting discovery.",
  robots: { index: true, follow: true },
};

export default async function ApiReferencePage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  return <ApiDocsPage origin={origin} />;
}
