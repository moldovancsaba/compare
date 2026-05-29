import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { ColorSchemeScript } from "@mantine/core";
import { Providers } from "./providers";
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

export const metadata: Metadata = {
  title: "RangeScout EU — Discover Sport Shooting Venues Across Europe",
  description:
    "Curated EU sport shooting training, ranges, competitions, hunting grounds, and clubs by country and region. Save favorites and estimate costs.",
  authors: [{ name: "RangeScout EU" }],
  icons: {
    icon: "/images/class_scout_logo_favicon.png",
    shortcut: "/images/class_scout_logo_favicon.png",
    apple: "/images/class_scout_logo_favicon.png",
  },
  openGraph: {
    title: "RangeScout EU — Sport Shooting Directory",
    description:
      "Curated EU sport shooting training, ranges, competitions, hunting grounds, and clubs by country and region.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
