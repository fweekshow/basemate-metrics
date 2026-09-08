import type { Metadata } from "next";

import { IstonksShell } from "@/components/istonks/shell";
import { getAppSession } from "@/lib/app-session";
import { appUiPreviewServerEnabled } from "@/lib/app-ui-preview";
import { isAddress, normalizeToken, shortAddress } from "@/lib/istonks";
import { fetchAgentJson } from "@/lib/istonks-server";
import { TokenClient } from "./token-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadToken(address: string) {
  if (!isAddress(address)) return null;
  const result = await fetchAgentJson(
    `/api/agent/istonks/token/${encodeURIComponent(address.toLowerCase())}`,
  );
  if (!result.ok) return null;
  return normalizeToken(result.data);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  const token = await loadToken(address);

  if (!token) {
    return {
      title: `iStonks — ${shortAddress(address)}`,
      description: "An iStonks token paired against a Coinbase tokenized stock on Base.",
    };
  }

  const ticker = token.symbol ? `$${token.symbol}` : shortAddress(address);
  const pair = token.pairSymbol ? ` paired against ${token.pairSymbol}` : "";

  return {
    title: `iStonks — ${ticker}`,
    description: `${token.name ?? ticker}${pair} on Base. Launched from a text message.`,
    openGraph: {
      title: `${ticker} · iStonks`,
      description: `${token.name ?? ticker}${pair} on Base.`,
    },
  };
}

export default async function IstonksTokenPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const session = await getAppSession();
  const signedIn = Boolean(session) || appUiPreviewServerEnabled();

  return (
    <IstonksShell signedIn={signedIn}>
      <TokenClient address={address} valid={isAddress(address)} />
    </IstonksShell>
  );
}
