"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { IstonksWordmark } from "@/components/shell/istonks-wordmark";
import { SignInDialog } from "@/components/shell/sign-in-dialog";
import { cn } from "@/lib/utils";
import { IMESSAGE_HREF, SITE } from "@/lib/site";

const ISTONKS_NAV = [
  { href: "/istonks", label: "Board" },
  { href: "/istonks/stocks", label: "Stocks" },
  { href: "/istonks/launch", label: "Launch" },
  { href: "/istonks/fund", label: "Fund" },
  { href: "/istonks/fees", label: "Fees" },
] as const;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function ProductNav({
  brand = "istonks",
  signedIn = false,
}: {
  brand?: "istonks" | "basemate";
  signedIn?: boolean;
}) {
  const pathname = usePathname();
  const [signInOpen, setSignInOpen] = useState(false);
  const onApp = pathname === "/app" || pathname.startsWith("/app/");

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2.5">
          {brand === "istonks" ? (
            <Link
              href="/istonks"
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-full pr-2",
                focusRing,
              )}
            >
              <Image
                src="/brand/logo/basemate-logo-flat.png"
                alt=""
                width={32}
                height={32}
                className="rounded-lg transition-opacity group-hover:opacity-80"
                priority
              />
              <div className="leading-tight">
                <IstonksWordmark size="sm" className="block" />
                <span className="font-mono text-[12px] text-muted-foreground">
                  by Basemate · stock pairs on Base
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/app"
              className={cn(
                "group flex min-h-11 items-center gap-2.5 rounded-full pr-2",
                focusRing,
              )}
            >
              <Image
                src="/brand/logo/basemate-logo-flat.png"
                alt=""
                width={32}
                height={32}
                className="rounded-lg transition-opacity group-hover:opacity-80"
                priority
              />
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                Basemate
              </span>
            </Link>
          )}

          {brand === "istonks" ? (
            <nav className="flex flex-wrap items-center gap-1" aria-label="iStonks">
              {ISTONKS_NAV.map((item) => {
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
                      "inline-flex min-h-11 items-center rounded-full px-3.5 font-mono text-[12px] uppercase tracking-[0.14em] transition-colors",
                      focusRing,
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
          ) : (
            <nav className="flex flex-wrap items-center gap-1" aria-label="Basemate">
              <Link
                href="/istonks"
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  focusRing,
                )}
              >
                iStonks
              </Link>
              <Link
                href="/app"
                aria-current={onApp ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-3.5 font-mono text-[12px] uppercase tracking-[0.14em] transition-colors",
                  focusRing,
                  onApp
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                Wallet
              </Link>
            </nav>
          )}

          <div className="ml-auto flex items-center gap-2">
            <a
              href={IMESSAGE_HREF}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 font-mono text-[12px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]",
                focusRing,
              )}
            >
              <MessageCircle className="size-3.5" />
              <span className="hidden sm:inline">{SITE.imessagePhoneDisplay}</span>
              <span className="sm:hidden">Text us</span>
            </a>
            {brand === "istonks" ? (
              signedIn || onApp ? (
                <Link
                  href="/app"
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 font-mono text-[12px] text-foreground transition-colors hover:border-primary/40",
                    focusRing,
                  )}
                >
                  Wallet
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setSignInOpen(true)}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-card px-4 font-mono text-[12px] text-foreground transition-colors hover:border-primary/40",
                    focusRing,
                  )}
                >
                  Sign in
                </button>
              )
            ) : null}
          </div>
        </div>
      </header>
      <SignInDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
