import type { Metadata } from "next";

import { SiteShell } from "@/components/site/site-shell";
import { SITE } from "@/lib/site";
import { WalletSetupClient } from "./wallet-setup-client";

export const metadata: Metadata = {
  title: "Create Wallet · Basemate",
  description: "Create or connect your Base Account for Basemate without installing an app.",
  openGraph: {
    title: "Create Wallet · Basemate",
    description: "Create or connect your Base Account for Basemate without installing an app.",
    type: "website",
    images: [SITE.pfp],
  },
};

type WalletSetupPageProps = {
  searchParams: Promise<{
    s?: string | string[];
  }>;
};

export default async function WalletSetupPage({ searchParams }: WalletSetupPageProps) {
  const params = await searchParams;
  const sessionToken = Array.isArray(params.s) ? params.s[0] ?? "" : params.s ?? "";

  return (
    <SiteShell>
      <WalletSetupClient sessionToken={sessionToken} />
    </SiteShell>
  );
}
