import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SITE_URL } from "@/lib/site";

const siteDescription =
  "AI-powered community discovery inside group chats on Base.";

const txnImagePath = "/txnmate.jpeg";
const txnImageWidth = 1536;
const txnImageHeight = 1024;
const txnImageAlt = "Basemate transaction";

const txnImage = {
  url: txnImagePath,
  secureUrl: txnImagePath,
  width: txnImageWidth,
  height: txnImageHeight,
  alt: txnImageAlt,
  type: "image/jpeg",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Basemate - Community Discovery",
    template: "%s · Basemate",
  },
  description: siteDescription,
  icons: {
    icon: [
      {
        url: txnImagePath,
        type: "image/jpeg",
        sizes: `${txnImageWidth}x${txnImageHeight}`,
      },
    ],
    shortcut: [{ url: txnImagePath, type: "image/jpeg" }],
    apple: [
      {
        url: txnImagePath,
        type: "image/jpeg",
        sizes: `${txnImageWidth}x${txnImageHeight}`,
      },
    ],
    other: [
      {
        rel: "mask-icon",
        url: txnImagePath,
        type: "image/jpeg",
        color: "#0052ff",
      },
    ],
  },
  openGraph: {
    title: "Basemate - Community Discovery",
    description: siteDescription,
    type: "website",
    images: [txnImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Basemate - Community Discovery",
    description: siteDescription,
    images: [txnImage],
  },
};

export default async function TxnPage({
  params,
}: {
  params: Promise<{ txnHash: string }>;
}) {
  const { txnHash } = await params;
  redirect(`https://basescan.org/tx/${txnHash}`);
}
