import type { Metadata } from "next";
import { Wallet } from "lucide-react";

import { SiteShell } from "@/components/site/site-shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pay · Basemate",
  description: "Fund your wallet on Base to use Basemate — coming soon.",
  openGraph: {
    title: "Pay · Basemate",
    description: "Fund your wallet on Base to use Basemate — coming soon.",
    type: "website",
    images: [SITE.pfp],
  },
};

export default function PayPage() {
  return (
    <SiteShell>
      <section className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 px-4 py-28 text-center sm:px-6 sm:py-40">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          <Wallet className="h-8 w-8" />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            coming soon
          </div>
          <h1 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            Fund your wallet
          </h1>
          <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground">
            Pay with card or bank to get USDC on Base — ready to trade, earn,
            or buy keyword boosts inside Basemate.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
