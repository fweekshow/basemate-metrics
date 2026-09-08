import { SITE } from "@/lib/site";

/** Reg S disclaimer — required on every /istonks page. */
export function RegSFooter() {
  return (
    <footer className="pb-4">
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
