import type { Metadata } from "next";

import { StablecoinDirectoryClient } from "@/components/stablecoin-directory/stablecoin-directory-client";
import { loadStablecoinDirectoryPage } from "@/lib/stablecoin-directory-page";

export const metadata: Metadata = {
  title: "Base Stablecoin World Directory — Stablemate Partnerships",
  description:
    "Country-by-country stablecoin issuers on Base — synced from Notion issuer & corridor pipeline.",
  openGraph: {
    title: "Stablemate Stablecoin Directory",
    url: "https://basemate.app/stablecoins",
  },
};

export const dynamic = "force-dynamic";

export default async function StablecoinsPage() {
  const { view, narrativeHtml } = await loadStablecoinDirectoryPage();
  return <StablecoinDirectoryClient view={view} narrativeHtml={narrativeHtml} />;
}
