"use client";

import { ProductNav } from "@/components/shell/product-nav";
import { SITE } from "@/lib/site";

/** Reg S disclaimer — required on every /istonks page. Kept as small print. */
export function RegSFooter() {
  return (
    <footer className="mx-auto max-w-[1400px] px-5 pb-10">
      <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
        Regulation S
      </p>
      <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-muted-foreground">
        Coinbase tokenized stocks are offered under Regulation S and are available only to eligible
        non-US persons. Nothing here is investment advice. iStonks tokens are community-launched
        assets paired against a tokenized stock — not equity, no shareholder rights, no dividends.
        Confirm your own eligibility.
      </p>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[12px] text-muted-foreground">
        <a
          href={SITE.termsUrl}
          className="inline-flex min-h-11 items-center transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Terms
        </a>
        <a
          href={SITE.privacyUrl}
          className="inline-flex min-h-11 items-center transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Privacy
        </a>
        <a
          href="https://base.org/stocks"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          base.org/stocks ↗
        </a>
      </p>
    </footer>
  );
}

export function IstonksShell({
  children,
  signedIn = false,
}: {
  children: React.ReactNode;
  signedIn?: boolean;
}) {
  return (
    <div className="relative min-h-screen bg-grid">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
      <ProductNav brand="istonks" signedIn={signedIn} />
      <main className="mx-auto max-w-[1400px] px-5 pb-10 pt-6">{children}</main>
      <RegSFooter />
    </div>
  );
}

/** Top chrome for /app so wallet is never a dead end. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] bg-background">
      <ProductNav brand="basemate" signedIn />
      {children}
    </div>
  );
}
