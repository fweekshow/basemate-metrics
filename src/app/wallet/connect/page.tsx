import type { Metadata } from "next";

import { ConnectClient } from "@/app/wallet/connect/connect-client";
import { SiteShell } from "@/components/site/site-shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Set up your Basemate account",
  description: "Sign in with email to set up your Basemate account — no wallet apps, no seed phrases.",
  openGraph: {
    title: "Set up your Basemate account",
    description: "Sign in with email to set up your Basemate account — no wallet apps, no seed phrases.",
    type: "website",
    images: [SITE.pfp],
  },
};

type PageProps = {
  searchParams: Promise<{ s?: string | string[] }>;
};

export default async function WalletConnectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionToken = Array.isArray(params.s) ? params.s[0] ?? "" : params.s ?? "";

  return (
    <SiteShell>
      <ConnectClient sessionToken={sessionToken} />
    </SiteShell>
  );
}
