import type { Metadata } from "next";

import { TxnRedirect } from "@/components/txn/txn-redirect";
import { SITE_URL } from "@/lib/site";

const siteDescription =
  "AI-powered community discovery inside group chats on Base.";

const txnImageUrl = new URL("/txnmate.jpeg", SITE_URL).href;
const txnImageWidth = 1536;
const txnImageHeight = 1024;
const txnImageAlt = "Basemate transaction";

const txnImage = {
  url: txnImageUrl,
  secureUrl: txnImageUrl,
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
        url: txnImageUrl,
        type: "image/jpeg",
        sizes: `${txnImageWidth}x${txnImageHeight}`,
      },
    ],
    shortcut: [{ url: txnImageUrl, type: "image/jpeg" }],
    apple: [
      {
        url: txnImageUrl,
        type: "image/jpeg",
        sizes: `${txnImageWidth}x${txnImageHeight}`,
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
  const basescanUrl = `https://basescan.org/tx/${encodeURIComponent(txnHash)}`;

  return <TxnRedirect url={basescanUrl} />;
}
