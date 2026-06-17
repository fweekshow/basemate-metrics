import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";

import { HomeRoadmap } from "@/components/site/home-roadmap";
import { SiteShell } from "@/components/site/site-shell";
import { SITE } from "@/lib/site";
import type { AnalyticsPayload } from "@/lib/types";

export const metadata: Metadata = {
  title: `${SITE.name} — The Base-native trading agent`,
  description:
    "Trade perps, swap, earn yield, and scout launches — all by messaging. The Base-native agent that lives in your chats.",
};

const features = [
  {
    label: "PERPS",
    headline: 'Two words — "Long COIN" or "Short ETH"',
    body: "Basemate opens an Avantis position with TP/SL, leverage, and amount all preset.",
    color: "#0505FF",
  },
  {
    label: "TRENDING",
    headline: "Scout launches before they moon",
    body: 'Ask "what\'s trending?" and get a live Bankr feed with top movers and one-tap buy.',
    color: "#16A34A",
  },
  {
    label: "EARN",
    headline: "Park idle USDC, earn yield",
    body: "Tell Basemate to earn and it finds the best rate on Base, executes, and confirms — one message.",
    color: "#0505FF",
  },
  {
    label: "LAUNCH",
    headline: "Ship a token from the chat",
    body: "Describe it, confirm the details, and it's on-chain — no launchpad interface required.",
    color: "#16A34A",
  },
] as const;

const roadmap = [
  { label: "Agent launched on Base App", done: true },
  { label: "Basemate token launched", done: true },
  { label: "Avantis perps integration live", done: true },
  { label: "Hundreds of tokens launched via Basemate", done: true },
  { label: "Millions in trading volume", done: true },
  { label: "Thousands of active users", done: true },
  { label: "Trade in iMessage", done: false, next: true },
  { label: "Basemate on web", done: false, pending: true },
  {
    label: "Your onramp to Base — inside iMessage",
    done: false,
    destination: true,
  },
] as const;

async function getMetrics(): Promise<AnalyticsPayload | null> {
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    if (!host) return null;

    const protocol = host.includes("localhost") ? "http" : "https";
    const res = await fetch(`${protocol}://${host}/api/metrics`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as AnalyticsPayload;
  } catch {
    return null;
  }
}

function formatUsers(total: number): string {
  if (total >= 1000) return `${Math.floor(total / 1000)}K+`;
  return total.toLocaleString("en-US");
}

function buildStats(metrics: AnalyticsPayload | null) {
  return [
    { value: "$2M+", label: "VOLUME TRADED", live: false },
    {
      value: metrics ? formatUsers(metrics.users.total) : "1000s",
      label: "USERS",
      live: Boolean(metrics),
    },
    {
      value: metrics
        ? metrics.tokenLaunches.allTime.success.toLocaleString("en-US")
        : "100s",
      label: "TOKENS LAUNCHED",
      live: Boolean(metrics),
    },
    { value: "Avantis", label: "PERPS PARTNER", live: false },
  ] as const;
}

export default async function HomePage() {
  const metrics = await getMetrics();
  const stats = buildStats(metrics);
  const hasLiveStats = stats.some((stat) => stat.live);

  return (
    <SiteShell>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="flex flex-col gap-14 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1 space-y-8">
            <div className="flex items-center gap-2.5">
              <Image
                src="/brand/logo/basemate-logo-flat.png"
                alt="Basemate"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span
                className="text-sm font-bold text-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Basemate
              </span>
            </div>

            <h1
              className="font-display text-5xl font-bold leading-[1.04] tracking-tight text-foreground sm:text-6xl"
              style={{ textWrap: "balance" }}
            >
              Trade, Earn, <span className="text-primary">and Launch.</span>
            </h1>

            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              Basemate is the Base Agent that lives in your chats. Long COIN, Short ETH,
              Swap Tokens, Earn Yield, Discover Trending Tokens or Launch your own token
              and connect with Community all inside of chats.
            </p>

            <a
              href={SITE.baseAppStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center gap-2.5 self-start rounded-full bg-primary px-7 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(5,5,255,0.25)] transition-all hover:shadow-[0_4px_32px_rgba(5,5,255,0.4)] hover:brightness-110 active:scale-[0.97]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Download the Base App
            </a>
          </div>

          <div className="flex flex-1 justify-center lg:justify-end">
            <ChatMockup />
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {hasLiveStats ? (
            <div className="flex items-center justify-end gap-2 pt-4">
              <span className="size-1.5 rounded-full bg-up animate-pulse" />
              <span
                className="text-[10px] font-medium tracking-[0.2em] text-up"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                LIVE
              </span>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-px sm:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-1 px-4 py-8 sm:px-6">
                <span
                  className="text-2xl font-bold text-primary sm:text-3xl"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {value}
                </span>
                <span
                  className="text-xs font-medium text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h2 className="font-display mb-3 text-2xl font-bold sm:text-3xl">
          One agent. Everything on Base.
        </h2>
        <p className="mb-10 text-muted-foreground">
          Every action confirmed in the chat — no app-switching, no forms.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ label, headline, body, color }) => (
            <div
              key={label}
              className="group rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span
                className="mb-3 block text-xs font-bold tracking-widest"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color }}
              >
                {label}
              </span>
              <h3 className="font-display mb-2 text-lg font-bold">{headline}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <HomeRoadmap items={roadmap} />

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-12 sm:px-14 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p
                className="mb-2 text-xs font-bold tracking-widest text-white/60"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}
              >
                ONE TAP · ONE WIN
              </p>
              <h2 className="font-display mb-4 text-3xl font-bold text-white sm:text-4xl">
                Ready to trade in the chat?
              </h2>
              <p className="mb-7 max-w-md text-white/75">
                Add @basemate to your Base App group and start trading with a single
                message.
              </p>
              <a
                href={SITE.baseAppStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2.5 self-start rounded-full bg-white px-7 text-sm font-semibold text-primary shadow-lg transition-all hover:brightness-95 active:scale-[0.97]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Download the Base App
              </a>
            </div>

            <div className="hidden shrink-0 sm:flex sm:items-center sm:justify-center">
              <div className="rounded-2xl bg-white p-4 shadow-[0_0_40px_rgba(25,251,68,0.4),0_0_0_1px_rgba(25,251,68,0.3)]">
                <Image
                  src="/brand/mascot/mate-win-buff.png"
                  alt=""
                  width={120}
                  height={120}
                  className="select-none"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function ChatMockup() {
  return (
    <div className="w-full max-w-[340px] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_40px_rgba(5,5,255,0.1),0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3">
        <Image
          src="/brand/logo/basemate-logo-flat.png"
          alt="Basemate"
          width={28}
          height={28}
          className="rounded-lg"
        />
        <div>
          <p className="text-xs font-semibold text-foreground">Basemate</p>
          <p
            className="text-[10px] font-medium text-up"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            ● LIVE ON BASE
          </p>
        </div>
      </div>

      <div className="space-y-3 bg-muted/30 px-3 py-4">
        <div className="flex justify-end">
          <div
            className="max-w-[75%] rounded-[20px] px-3.5 py-2.5 text-sm font-medium text-white"
            style={{ background: "#0505FF" }}
          >
            Long SPCX
          </div>
        </div>

        <div className="flex justify-start">
          <div className="max-w-[88%] rounded-[20px] border border-border bg-white px-3.5 py-3 text-sm shadow-sm">
            <p className="font-semibold text-foreground">
              Open SPCX Long 10× with $200 Collateral.
            </p>
            <div className="mt-2.5">
              <span className="inline-flex w-full items-center justify-center rounded-full bg-primary py-2 text-xs font-bold text-white">
                Sign Transaction
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <div
            className="max-w-[75%] rounded-[20px] px-3.5 py-2.5 text-sm font-medium text-white"
            style={{ background: "#0505FF" }}
          >
            Sign Transaction
          </div>
        </div>

        <div className="flex justify-start">
          <div
            className="max-w-[90%] rounded-[20px] border bg-white px-3.5 py-2.5 text-sm shadow-[0_0_12px_rgba(22,163,74,0.12)]"
            style={{ borderColor: "rgba(22,163,74,0.25)" }}
          >
            <p className="font-semibold text-up">Transaction confirmed ✓</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              SPCX Long 10× · settled on Base
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
