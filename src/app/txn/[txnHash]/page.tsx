import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TxnRedirect } from "@/components/txn-redirect";
import {
  basemateEmbedMetadata,
  basemateTxnOgImage,
  basemateTxnUrl,
  basescanTxUrl,
  isValidTxHash,
} from "@/lib/embed";
import { getRequestOrigin } from "@/lib/request-origin";

type PageProps = {
  params: Promise<{ txnHash: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { txnHash } = await params;
  if (!isValidTxHash(txnHash)) {
    return { title: "Transaction · Basemate" };
  }

  const origin = await getRequestOrigin();
  const url = basemateTxnUrl(txnHash, origin);
  return basemateEmbedMetadata({
    title: "Trade confirmed · Basemate",
    description: "Trade executed on Base via Basemate.",
    url,
    origin,
    imageUrl: basemateTxnOgImage(origin),
    buttonTitle: "View on BaseScan",
    imageWidth: 1200,
    imageHeight: 800,
  });
}

export default async function TxnPage({ params }: PageProps) {
  const { txnHash } = await params;
  if (!isValidTxHash(txnHash)) notFound();

  return <TxnRedirect url={basescanTxUrl(txnHash)} />;
}
