import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";

import { HomeRoadmap } from "@/components/site/home-roadmap";
import { SiteShell } from "@/components/site/site-shell";
import { SITE } from "@/lib/site";
import type { AnalyticsPayload } from "@/lib/types";
import { formatVolumeKpi, resolveChatTrading } from "@/lib/volume";

export const metadata: Metadata = {
  title: `${SITE.name} — Money that lives in your texts`,
  description:
    "Send across borders. Earn. Trade. Save. Basemate is the onchain agent that lives in iMessage and Base App — no app to download, no wallet to set up.",
};

const sets = [
  {
    letter: "S",
    label: "SEND",
    headline: "Send money home in a text",
    body: "Money to anyone with a phone number, across any border. Text “send $200 to Mum” and it moves in seconds.",
    color: "#0505FF",
  },
  {
    letter: "E",
    label: "EARN",
    headline: "Idle USDC earns ~5% automatically",
    body: "Tell Basemate to earn and it finds the best onchain rate on Base — Moonwell, Morpho, or Aave — in one message.",
    color: "#19FB44",
  },
  {
    letter: "T",
    label: "TRADE",
    headline: "Swap in a text. Trade in Base App",
    body: "Spot swaps on Uniswap and Aerodrome from the chat. Perps and full trading live in Base App.",
    color: "#0505FF",
  },
  {
    letter: "S",
    label: "SAVE",
    headline: "USDC as your base currency",
    body: "Stable, dollar-denominated money that stays in your agent wallet — ready to send, earn, or trade.",
    color: "#19FB44",
  },
] as const;

const gapStats = [
  { value: "3.3B+", label: "iMessage + WhatsApp users" },
  { value: "$800B+", label: "sent across borders yearly" },
  { value: "~6%", label: "average remittance fee today" },
] as const;

const moat = [
  {
    n: "01",
    title: "The sender side — iMessage",
    body: "Where the money comes from. 1.3B users across the US, EU, and Gulf — the world's remittance senders.",
  },
  {
    n: "02",
    title: "The receiver side — WhatsApp",
    body: "Where the money goes. Dominant in the Philippines, India, Mexico, Nigeria, and Brazil.",
  },
  {
    n: "03",
    title: "The unlock",
    body: "Zero apps, zero accounts, zero crypto knowledge. A text arrives. The money's there.",
  },
] as const;

const roadmap = [
  { label: "Live on Base App + iMessage beta", done: true },
  { label: "USDC send to any phone number", done: true },
  { label: "Apple Pay + card funding", done: true },
  { label: "~5% yield on idle USDC", done: true },
  { label: "Spot swaps in chat", done: true },
  { label: "10K+ users · $260K+ moved", done: true },
  { label: "WhatsApp receive-side", done: false, next: true },
  { label: "Multi-corridor remittance rails", done: false, pending: true },
  {
    label: "Send money home — cash out to local currency",
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
  if (total >= 10_000) return `${(total / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  if (total >= 1000) return `${Math.floor(total / 1000)}K+`;
  return total.toLocaleString("en-US");
}

function formatMessages(total: number): string {
  if (total >= 1000) return `${Math.floor(total / 1000)}K+`;
  return total.toLocaleString("en-US");
}

function buildStats(metrics: AnalyticsPayload | null) {
  const trading = metrics ? resolveChatTrading(metrics) : null;

  return [
    {
      value: metrics ? formatUsers(metrics.users.total) : "10.7K",
      label: "USERS",
      live: Boolean(metrics),
    },
    {
      value: metrics
        ? formatMessages(metrics.users.messagesReceived)
        : "49K+",
      label: "MESSAGES",
      live: Boolean(metrics),
    },
    {
      value: trading ? formatVolumeKpi(trading.notionalLifetime) : "$262K+",
      label: "NOTIONAL MOVED",
      live: Boolean(metrics),
    },
  ] as const;
}

export default async function LandingPage() {
  const metrics = await getMetrics();
  const stats = buildStats(metrics);
  const hasLiveStats = stats.some((stat) => stat.live);

  return (
    <SiteShell>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-5xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
        <div className="max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Live on iMessage · Base App
          </div>

          <h1
            className="font-display text-4xl font-semibold leading-[1.12] tracking-normal text-foreground sm:text-5xl"
            style={{ textWrap: "balance" }}
          >
            Money that lives in your <span className="bm-emphasis">texts.</span>
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Send across borders. Earn. Trade. Save. All in the app you already have
            open — no wallet to set up, no seed phrase, no new app to download.
          </p>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <Link
              href="/"
              className="inline-flex min-h-[48px] items-center justify-center gap-2.5 self-start rounded-full bg-primary px-7 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(5,5,255,0.25)] transition-all hover:shadow-[0_4px_32px_rgba(5,5,255,0.4)] hover:brightness-110 active:scale-[0.97]"
            >
              Text Basemate to start
            </Link>
            <a
              href={SITE.baseAppStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center gap-2.5 self-start rounded-full border border-border bg-white px-7 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted/50 active:scale-[0.97]"
            >
              Try on Base App
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {hasLiveStats ? (
            <div className="flex items-center justify-end gap-2 pt-4">
              <span className="size-1.5 animate-pulse rounded-full bg-up" />
              <span
                className="text-[10px] font-medium tracking-[0.2em] text-up"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                LIVE
              </span>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-px sm:grid-cols-3">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-1 px-4 py-5 sm:px-6">
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

      {/* ── The gap ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div>
            <p
              className="mb-2 font-mono text-xs font-bold tracking-[0.14em] text-primary"
            >
              THE GAP
            </p>
            <h2 className="font-display mb-3 text-2xl font-semibold tracking-normal sm:text-3xl">
              iMessage + WhatsApp are the world&apos;s largest{" "}
              <span className="bm-emphasis">unbanked</span> network.
            </h2>
            <p className="text-muted-foreground">
              3.3 billion people message every day — with no way to send, earn, or
              grow money without leaving the app.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {gapStats.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm"
              >
                <span
                  className="block text-2xl font-bold text-primary"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {value}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The problem ──────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
          <p className="mb-2 font-mono text-xs font-bold tracking-[0.14em] text-primary">
            THE PROBLEM
          </p>
          <h2 className="font-display mb-5 text-2xl font-semibold tracking-normal sm:text-3xl">
            Sending money home is still <span className="bm-emphasis">broken.</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-down/20 bg-white p-6">
              <p
                className="mb-3 text-xs font-bold tracking-widest text-down"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                TODAY
              </p>
              <p
                className="text-sm leading-relaxed text-muted-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                up to 6% fees · 1–3 days · download an app · create an account
              </p>
            </div>
            <div className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-6">
              <p
                className="mb-3 text-xs font-bold tracking-widest text-primary"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                SHOULD BE
              </p>
              <p className="font-display text-2xl font-semibold tracking-normal text-foreground">
                a text.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SETS ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <p className="mb-2 font-mono text-xs font-bold tracking-[0.14em] text-primary">
          HOW IT WORKS
        </p>
        <h2 className="font-display mb-2 text-2xl font-semibold tracking-normal sm:text-3xl">
          One agent. Four <span className="bm-emphasis">jobs.</span>
        </h2>
        <p className="mb-6 max-w-2xl text-muted-foreground">
          Send · Earn · Trade · Save. Cross-border send is the front door — once your
          money&apos;s in, Basemate does the other three.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {sets.map(({ letter, label, headline, body, color }) => (
            <div
              key={label}
              className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{ background: color, fontFamily: "var(--font-display)" }}
                >
                  {letter}
                </span>
                <span
                  className="font-mono text-xs font-bold tracking-[0.14em]"
                  style={{ color }}
                >
                  {label}
                </span>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-foreground">{headline}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Moat ─────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
          <p className="mb-2 font-mono text-xs font-bold tracking-[0.14em] text-primary">
            THE MOAT
          </p>
          <h2 className="font-display mb-2 text-2xl font-semibold tracking-normal sm:text-3xl">
            Built on the rails remittances <span className="bm-emphasis">actually</span>{" "}
            run on.
          </h2>
          <p className="mb-6 max-w-2xl text-muted-foreground">
            Every incumbent makes the recipient do the work. We flipped it. The sender
            uses iMessage. The receiver uses WhatsApp. Nobody installs anything.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {moat.map(({ n, title, body }) => (
              <div
                key={n}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm"
              >
                <span className="mb-3 block font-mono text-xs font-bold text-primary">
                  {n}
                </span>
                <h3 className="mb-1.5 text-base font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeRoadmap items={roadmap} />

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-10 sm:px-12 sm:py-12"
          style={{ background: "#0000FF" }}
        >
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
                ONE ACTION · ONE WIN
              </p>
              <h2 className="font-display mb-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                Come build the bank that lives in your texts.
              </h2>
              <p className="mb-5 max-w-md text-white/75">
                Fund with Apple Pay, send USDC in a text, earn yield automatically —
                all on Base.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2.5 self-start rounded-full bg-white px-7 text-sm font-semibold text-primary shadow-lg transition-all hover:brightness-95 active:scale-[0.97]"
                >
                  Text Basemate to start
                </Link>
                <a
                  href={SITE.metricsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2.5 self-start rounded-full border border-white/30 px-7 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.97]"
                >
                  See live metrics
                </a>
              </div>
            </div>

            <div className="hidden shrink-0 sm:flex sm:items-center sm:justify-center">
              {/* Full-blue eyes mark — same blue as the CTA so only the eyes read */}
              <Image
                src="/brand/mascot/mate-eyes-blue.png"
                alt=""
                width={140}
                height={140}
                className="select-none rounded-2xl"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
