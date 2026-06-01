import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { ColorSchemeScript } from "@mantine/core";
import { cookies } from "next/headers";
import { Providers } from "./providers";
import { localeCookieName, normalizeLocale } from "@/lib/i18n/config";
import { getMetadata } from "@/lib/i18n/messages";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(localeCookieName)?.value);
  const dynamicMetadata = getMetadata(locale);
  return {
    ...dynamicMetadata,
    authors: [{ name: "Compare" }],
    icons: {
      icon: "/images/class_scout_logo_favicon.png",
      shortcut: "/images/class_scout_logo_favicon.png",
      apple: "/images/class_scout_logo_favicon.png",
    },
    openGraph: {
      ...dynamicMetadata.openGraph,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(localeCookieName)?.value);
  const dir = "ltr";
  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
