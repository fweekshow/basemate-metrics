import type { Metadata } from "next";
import { redirect } from "next/navigation";

const siteDescription =
  "AI-powered community discovery inside group chats on Base.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://basemate.app",
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
        url: "/txnmate.jpeg",
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
    images: ["/txnmate.jpeg"],
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
