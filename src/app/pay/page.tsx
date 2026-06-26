import type { Metadata } from "next";

import { PayClient } from "@/app/pay/pay-client";
import { SiteShell } from "@/components/site/site-shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pay · Basemate",
  description: "Fund your Basemate wallet on Base with Apple Pay.",
  openGraph: {
    title: "Pay · Basemate",
    description: "Fund your Basemate wallet on Base with Apple Pay.",
    type: "website",
    images: [SITE.pfp],
  },
};

type PayPageProps = {
  searchParams: Promise<{
    s?: string | string[];
  }>;
};

export default async function PayPage({ searchParams }: PayPageProps) {
  const params = await searchParams;
  const sessionToken = Array.isArray(params.s) ? params.s[0] ?? "" : params.s ?? "";

  return (
    <SiteShell>
      <PayClient sessionToken={sessionToken} />
    </SiteShell>
  );
}
