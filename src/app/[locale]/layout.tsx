import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMetadata } from "@/lib/i18n/messages";
import { isSupportedLocale, normalizeLocale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = normalizeLocale(locale);
  const dynamicMetadata = getMetadata(resolvedLocale);
  return {
    ...dynamicMetadata,
    authors: [{ name: "Compare" }],
    openGraph: {
      ...dynamicMetadata.openGraph,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const resolved = await params;
  if (!isSupportedLocale(resolved.locale)) {
    notFound();
  }

  return <>{children}</>;
}
