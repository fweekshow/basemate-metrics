"use client";

import Link from "next/link";
import { MessageCircle, Percent, Rocket, Send, Sparkles } from "lucide-react";

import { SectionLabel } from "@/components/dashboard/primitives";
import { EmptyState, ErrorBand, useIstonks } from "@/components/istonks/ui";
import { useSession } from "@/components/shell/session-provider";
import {
  formatDate,
  normalizeLaunch,
  sortLaunchesNewestFirst,
  toArray,
} from "@/lib/istonks";
import { IMESSAGE_HREF, SITE } from "@/lib/site";

const VERBS = [
  { href: "/account?send=1", label: "Send", icon: Send, onchain: true },
  { href: "/account/earn", label: "Earn", icon: Percent, onchain: true },
  { href: "/istonks/launch", label: "Launch", icon: Rocket, onchain: true },
  { href: IMESSAGE_HREF, label: "Text Basemate", icon: MessageCircle, onchain: false, external: true },
  { href: "/skills/send-stock", label: "Muse skill", icon: Sparkles, onchain: false },
] as const;

export function ProductHome() {
  const { signedIn, openSignIn } = useSession();
  const launchesFetch = useIstonks<unknown>("/api/istonks/launches");
  const launches = sortLaunchesNewestFirst(
    toArray(launchesFetch.data)
      .map(normalizeLaunch)
      .filter((l) => Boolean(l.tokenAddress)),
  ).slice(0, 8);

  function onVerb(e: React.MouseEvent, onchain: boolean) {
    if (onchain && !signedIn) {
      e.preventDefault();
      openSignIn();
    }
  }

  return (
    <div className="animate-ticker-in space-y-10">
      <div>
        <SectionLabel>home</SectionLabel>
        <h1 className="mt-1 font-display text-[28px] font-semibold tracking-tight sm:text-[32px]">
          Send anything onchain, from your texts
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
          iMessage and Android chats now. WhatsApp coming soon. Web is for discovery — onchain
          actions sign you in, then settle on Base.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {VERBS.map((verb) => {
          const Icon = verb.icon;
          const className =
            "inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-[14px] font-medium transition-colors hover:border-primary/40 hover:text-primary";
          if ("external" in verb && verb.external) {
            return (
              <a key={verb.label} href={verb.href} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-[14px] font-semibold text-primary-foreground hover:brightness-110">
                <Icon className="size-4" />
                {verb.label}
              </a>
            );
          }
          return (
            <Link
              key={verb.label}
              href={verb.href}
              onClick={(e) => onVerb(e, verb.onchain)}
              className={className}
            >
              <Icon className="size-4" />
              {verb.label}
            </Link>
          );
        })}
        {signedIn ? (
          <Link
            href="/account"
            className="inline-flex min-h-11 items-center rounded-full px-3 text-[13px] text-muted-foreground hover:text-primary"
          >
            Your balance →
          </Link>
        ) : null}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionLabel>discovery</SectionLabel>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
              Recent launches
            </h2>
          </div>
          <Link
            href="/istonks"
            className="inline-flex min-h-11 items-center font-mono text-[12px] text-muted-foreground hover:text-primary"
          >
            Full board →
          </Link>
        </div>

        {launchesFetch.error ? <ErrorBand message={launchesFetch.error} /> : null}
        {launchesFetch.loading ? (
          <div className="h-24 animate-pulse rounded-[20px] bg-muted" />
        ) : launches.length === 0 ? (
          <EmptyState
            title="No launches yet"
            body="Be first. Pick a live stock and launch a pair."
            mascot="mate-peace.png"
            action={
              <Link
                href="/istonks/launch"
                onClick={(e) => onVerb(e, true)}
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-[14px] font-semibold text-primary-foreground"
              >
                Launch one
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border/70 rounded-[20px] border border-border bg-card">
            {launches.map((launch) => (
              <li key={launch.tokenAddress ?? launch.symbol}>
                {launch.tokenAddress ? (
                  <Link
                    href={`/istonks/token/${launch.tokenAddress}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-accent/40"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[14px] font-medium">${launch.symbol ?? "—"}</p>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {launch.name ?? "unnamed"}
                        {launch.pairSymbol ? ` · ${launch.pairSymbol}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-[12px] text-muted-foreground">
                      {formatDate(launch.launchedAt)}
                    </p>
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="font-mono text-[13px] text-muted-foreground">
        {SITE.imessagePhoneDisplay}
        <span className="mx-2">·</span>
        WhatsApp coming soon
      </p>
    </div>
  );
}
