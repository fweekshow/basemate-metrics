import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";

import { basemateEmbedMetadata } from "@/lib/embed";
import { SITE } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const embed = basemateEmbedMetadata({
  title: `${SITE.name} — Community Discovery`,
  description: SITE.description,
  url: SITE.baseUrl,
  buttonTitle: "Launch Basemate",
});

export const metadata: Metadata = {
  ...embed,
  other: {
    ...embed.other,
    "base:app_id": "698f0e4ae0d5d2cf831b5a8b",
  },
  title: {
    default: `${SITE.name} — Community Discovery`,
    template: `%s · ${SITE.name}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
