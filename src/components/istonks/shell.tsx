"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { IMESSAGE_HREF, SITE } from "@/lib/site";

const NAV = [
  { href: "/istonks", label: "Board" },
  { href: "/istonks/stocks", label: "Stocks" },
  { href: "/istonks/launch", label: "Launch" },
  { href: "/istonks/fund", label: "Fund" },
  { href: "/istonks/fees", label: "Fees" },
] as const;

function IstonksNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <Link href="/istonks" className="group flex items-center gap-3">
          <Image
            src="/brand/logo/basemate-logo-flat.png"
            alt="Basemate"
            width={32}
            height={32}
            className="rounded-lg transition-opacity group-hover:opacity-80"
            priority
          />
          <div className="leading-tight">
            <h1 className="font-mono text-sm font-semibold tracking-wide text-foreground transition-colors group-hover:text-primary">
              iStonks
              <span className="text-muted-foreground"> / launchpad</span>
            </h1>
            <span className="font-mono text-[11px] text-muted-foreground">
              stock pairs on Base
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/istonks"
                ? pathname === "/istonks"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <a
            href={IMESSAGE_HREF}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 font-mono text-[11px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]"
          >
            <MessageCircle className="size-3" />
            <span className="hidden sm:inline">{SITE.imessagePhoneDisplay}</span>
            <span className="sm:hidden">text us</span>
          </a>
          <Link
            href="/app"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Wallet
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Reg S disclaimer — required on every /istonks page. */
export function RegSFooter() {
  return (
    <footer className="mx-auto max-w-[1400px] px-5 pb-12">
      <div className="rounded-lg border border-border bg-card/70 px-4 py-4 backdrop-blur-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Regulation S
        </p>
        <p className="mt-2 max-w-4xl text-[11px] leading-relaxed text-muted-foreground">
          Coinbase tokenized stocks are offered under Regulation S and are available only to
          eligible non-US persons. Nothing here is investment advice, an offer, or a solicitation
          to buy or sell any security. iStonks tokens are community-launched assets paired against
          a tokenized stock — they are not equity, they carry no shareholder rights, and they do
          not entitle you to any dividend or distribution. You are responsible for confirming your
          own eligibility under the laws that apply to you.
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground">
          <a href={SITE.termsUrl} className="transition-colors hover:text-primary">
            Terms
          </a>
          <a href={SITE.privacyUrl} className="transition-colors hover:text-primary">
            Privacy
          </a>
          <a
            href="https://base.org/stocks"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-primary"
          >
            base.org/stocks ↗
          </a>
        </p>
      </div>
    </footer>
  );
}

export function IstonksShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-grid">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
      <IstonksNav />
      <main className="mx-auto max-w-[1400px] px-5 pb-10 pt-6">{children}</main>
      <RegSFooter />
    </div>
  );
}
