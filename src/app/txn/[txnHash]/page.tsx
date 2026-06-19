import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TxnRedirect } from "@/components/txn-redirect";
import {
  BASEMATE_TXN_OG_IMAGE,
  basemateEmbedMetadata,
  basemateTxnUrl,
  basescanTxUrl,
  isValidTxHash,
} from "@/lib/embed";

type PageProps = {
  params: Promise<{ txnHash: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { txnHash } = await params;
  if (!isValidTxHash(txnHash)) {
    return { title: "Transaction · Basemate" };
  }

  const url = basemateTxnUrl(txnHash);
  return basemateEmbedMetadata({
    title: "Trade confirmed · Basemate",
    description: "Trade executed on Base via Basemate.",
    url,
    imageUrl: BASEMATE_TXN_OG_IMAGE,
    buttonTitle: "View on BaseScan",
    imageWidth: 1536,
    imageHeight: 1024,
  });
}

export default async function TxnPage({ params }: PageProps) {
  const { txnHash } = await params;
  if (!isValidTxHash(txnHash)) notFound();

  return <TxnRedirect url={basescanTxUrl(txnHash)} />;
}
