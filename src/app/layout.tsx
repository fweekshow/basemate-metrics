import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
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

const siteDescription =
  "AI-powered community discovery inside group chats on Base.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://basemate-metrics.up.railway.app",
  ),
  title: {
    default: "Basemate - Community Discovery",
    template: "%s · Basemate",
  },
  description: siteDescription,
  openGraph: {
    title: "Basemate - Community Discovery",
    description: siteDescription,
    images: [
      {
        url: "/basemate-og.png",
        width: 1536,
        height: 1024,
        alt: "Basemate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Basemate - Community Discovery",
    description: siteDescription,
    images: ["/basemate-og.png"],
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
