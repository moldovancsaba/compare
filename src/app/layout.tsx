import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";

import { appName, appVersionLabel } from "@/lib/config/app";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: appName,
  description: `${appName} ${appVersionLabel} turns supported comparison domains into verdict-led, evidence-aware decision guidance.`
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${spaceGrotesk.variable} antialiased`}>{children}</body>
    </html>
  );
}
