import type { Metadata } from "next";
import Link from "next/link";

import { HomeRoadmap } from "@/components/site/home-roadmap";
import { SiteShell } from "@/components/site/site-shell";
import { IMESSAGE_HREF, SITE } from "@/lib/site";
import type { AnalyticsPayload } from "@/lib/types";
import { getCachedAnalytics } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Stablemate: Money that lives in your texts",
  description:
    "Send money home in a text. Funds arrive in their bank account. No new app, no wallet, no crypto. Stablemate routes it through the local stablecoin rail, invisibly.",
};

// ── Data ──────────────────────────────────────────────────────────────────────

type NodeStatus = "LIVE" | "SECURED" | "IN TALKS" | "SEARCHING";
const nodes: { country: string; coin: string; status: NodeStatus }[] = [
  { country: "United States", coin: "USDC", status: "LIVE" },
  { country: "Indonesia", coin: "IDRX", status: "SECURED" },
  { country: "Singapore", coin: "XSGD", status: "IN TALKS" },
  { country: "Malaysia", coin: "MYRC", status: "IN TALKS" },
  { country: "Japan", coin: "JPYC", status: "SEARCHING" },
];

const gapStats = [
  { value: "25+", label: "local stablecoins on Base" },
  { value: "$857B", label: "sent cross-border yearly" },
  { value: "6.36%", label: "avg fee today" },
];

const sets = [
  {
    label: "SEND",
    headline: "You text it. It arrives in their bank.",
    body: 'Text "send $200 to Mum" and it moves. The stablecoin rail is invisible. Receiver sees cash in their account.',
  },
  {
    label: "EARN",
    headline: "Idle balance earns ~5% automatically",
    body: "Tell Stablemate to earn and it finds the best onchain rate: Moonwell, Morpho, or Aave. One message.",
  },
  {
    label: "TRADE",
    headline: "Swap in a text. Trade in Base App.",
    body: "Spot swaps on Uniswap and Aerodrome from the chat. Perps and full trading in Base App.",
  },
  {
    label: "SAVE",
    headline: "USDC as your base currency.",
    body: "Stable, dollar-denominated money in your agent wallet, ready to send, earn, or trade any time.",
  },
];

const roadmap = [
  { label: "Live on Base App + iMessage beta", done: true },
  { label: "USDC send to any phone number", done: true },
  { label: "Apple Pay + card funding", done: true },
  { label: "~5% yield on idle USDC", done: true },
  { label: "Spot swaps in chat", done: true },
  { label: "10K+ users · $260K+ moved", done: true },
  { label: "WhatsApp receive-side", done: false, next: true },
  { label: "First corridor live: Singapore ⇄ Indonesia", done: false, pending: true },
  { label: "Send money home, cash out to local currency", done: false, destination: true },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMessages(n: number) {
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
  return n.toLocaleString("en-US");
}
function buildStats(metrics: AnalyticsPayload | null) {
  return [
    { value: metrics ? formatMessages(metrics.users.messagesReceived) : "75,000+", label: "MESSAGES RECEIVED", live: Boolean(metrics) },
  ] as const;
}


// ── Page ──────────────────────────────────────────────────────────────────────

export const revalidate = 3_600; // 1 h

export default async function LandingPage() {
  const metrics = await getCachedAnalytics();
  const stats = buildStats(metrics);
  const hasLiveStats = stats.some((s) => s.live);

  return (
    <SiteShell>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        id="start"
        className="relative overflow-hidden border-b border-border/60"
        style={{
          background: "linear-gradient(135deg, #EBE9F7 0%, #F6F5FC 50%, #E9EDFB 100%)",
        }}
      >
        {/* Subtle dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(5,5,255,0.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Blue glow blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-15 blur-[80px]"
          style={{ background: "#0505FF" }}
        />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="py-14 sm:py-20">
            <div className="max-w-2xl space-y-6">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold"
                style={{ background: "rgba(5,5,255,0.09)", color: "#0505FF", border: "1px solid rgba(5,5,255,0.18)" }}
              >
                <span className="size-1.5 rounded-full bg-[#0505FF] opacity-70 inline-block" />
                Live · iMessage · Base
              </div>

              <h1
                className="font-display text-5xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-6xl"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                Money that lives in your{" "}
                <em
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontStyle: "italic",
                    color: "#0505FF",
                  }}
                >
                  texts.
                </em>
              </h1>

              <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                No new app. No wallet. No crypto knowledge. Text Stablemate and
                the money moves. Funds arrive in the receiver&apos;s bank account.
                The stablecoin rail is invisible.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={IMESSAGE_HREF}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 self-start rounded-full px-7 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 hover:shadow-xl active:scale-[0.97]"
                  style={{ background: "#0505FF", boxShadow: "0 4px 24px rgba(5,5,255,0.30)" }}
                >
                  Text{" "}
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {SITE.imessagePhoneDisplay}
                  </span>
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                Opens iMessage.{" "}
                <Link href="/messaging" className="font-medium text-primary underline-offset-4 hover:underline">
                  Messaging &amp; opt-in
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live stats strip ─────────────────────────────────────── */}
      <section className="border-b border-border/60 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {hasLiveStats && (
            <div className="flex items-center gap-2 pt-3">
              <span className="size-1.5 animate-pulse rounded-full bg-primary opacity-70" />
              <span
                className="text-[10px] font-semibold tracking-[0.2em] text-primary"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                LIVE
              </span>
            </div>
          )}
          <div className="flex">
            {stats.map(({ value, label }) => (
              <div key={label} className="py-5 pr-8">
                <p
                  className="text-3xl font-bold tabular-nums sm:text-4xl"
                  style={{ fontFamily: "var(--font-mono)", color: "#0505FF" }}
                >
                  {value}
                </p>
                <p
                  className="mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The gap ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p
              className="mb-3 text-xs font-bold tracking-[0.18em] text-primary"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              THE GAP
            </p>
            <h2 className="font-display mb-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              iMessage + WhatsApp are the world&apos;s largest{" "}
              <em
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  color: "#0505FF",
                }}
              >
                unbanked
              </em>{" "}
              network.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              3.3 billion people message every day with no way to move money
              without leaving the app. Every country is licensing its own
              stablecoin. Each one is an island. We connect them.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {gapStats.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl p-5"
                style={{
                  background: "white",
                  border: "1px solid rgba(5,5,255,0.10)",
                  boxShadow: "0 2px 12px rgba(5,5,255,0.05)",
                }}
              >
                <p
                  className="text-2xl font-bold tabular-nums"
                  style={{ fontFamily: "var(--font-mono)", color: "#0505FF" }}
                >
                  {value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The problem ──────────────────────────────────────────── */}
      <section
        className="border-y border-border/60"
        style={{ background: "#F5F4FC" }}
      >
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <p
            className="mb-3 text-xs font-bold tracking-[0.18em] text-primary"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            THE PROBLEM
          </p>
          <h2 className="font-display mb-8 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Sending money home is still{" "}
            <em
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                color: "#FF4D67",
              }}
            >
              broken.
            </em>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className="rounded-2xl p-6"
              style={{
                background: "white",
                border: "1px solid rgba(255,77,103,0.15)",
              }}
            >
              <p
                className="mb-3 text-xs font-bold tracking-widest"
                style={{ fontFamily: "var(--font-mono)", color: "#FF4D67" }}
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
            <div
              className="rounded-2xl p-6"
              style={{
                background: "white",
                border: "1px solid rgba(5,5,255,0.15)",
              }}
            >
              <p
                className="mb-3 text-xs font-bold tracking-widest text-primary"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                SHOULD BE
              </p>
              <p className="font-display text-3xl font-semibold tracking-tight text-foreground">
                a text.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SETS ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
        <p
          className="mb-3 text-xs font-bold tracking-[0.18em] text-primary"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          HOW IT WORKS
        </p>
        <h2 className="font-display mb-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          One agent.{" "}
          <em
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              color: "#0505FF",
            }}
          >
            Four jobs.
          </em>
        </h2>
        <p className="mb-8 max-w-xl text-muted-foreground">
          Send · Earn · Trade · Save. Cross-border send is the front door.
          Once your money&apos;s in, Stablemate does the rest.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {sets.map(({ label, headline, body }) => (
            <div
              key={label}
              className="rounded-2xl p-6"
              style={{
                background: "white",
                border: "1px solid rgba(5,5,255,0.10)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
              }}
            >
              <div className="mb-3">
                <div
                  className="inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-widest"
                  style={{
                    background: "rgba(5,5,255,0.08)",
                    color: "#0505FF",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {label}
                </div>
              </div>
              <h3 className="font-display mb-2 text-lg font-semibold leading-snug tracking-tight text-foreground">
                {headline}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Network ──────────────────────────────────────────────── */}
      <section
        className="border-y border-border/60"
        style={{ background: "#F5F4FC" }}
      >
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div>
              <p
                className="mb-3 text-xs font-bold tracking-[0.18em] text-primary"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                THE NETWORK
              </p>
              <h2 className="font-display mb-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                One number per country.{" "}
                <em
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontStyle: "italic",
                    color: "#0505FF",
                  }}
                >
                  One local partner.
                </em>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Each node is a local stablecoin issuer. They own the licence,
                the banking, and the mint. We own the messaging and the routing.
                One network. The sender texts. The partner converts. The
                receiver&apos;s bank account gets the money.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                First corridor:{" "}
                <span className="font-semibold text-foreground">
                  Singapore ⇄ Indonesia
                </span>
                . In Singapore now with the Base APAC Circuit Accelerator.
              </p>
            </div>

            <div
              className="overflow-hidden rounded-2xl"
              style={{
                background: "white",
                border: "1px solid rgba(5,5,255,0.10)",
              }}
            >
              {nodes.map(({ country, coin, status }, i) => {
                const isLive = status === "LIVE";
                const isSecured = status === "SECURED";
                return (
                  <div
                    key={country}
                    className="flex items-center gap-4 px-5 py-4"
                    style={{
                      borderBottom: i < nodes.length - 1 ? "1px solid rgba(5,5,255,0.07)" : "none",
                    }}
                  >
                    <span
                      className="w-6 shrink-0 text-xs tabular-nums text-muted-foreground/40"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-foreground">
                      {country}
                    </span>
                    <span
                      className="text-xs tabular-nums text-muted-foreground/60"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {coin}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.06em]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        ...(isLive
                          ? { background: "rgba(5,5,255,0.10)", color: "#0505FF" }
                          : isSecured
                          ? { background: "rgba(5,5,255,0.06)", color: "#4444CC" }
                          : { background: "rgba(0,0,0,0.04)", color: "#88889A" }),
                      }}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <HomeRoadmap items={roadmap} />

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-12 sm:px-14 sm:py-14"
          style={{
            background: "linear-gradient(135deg, #0505FF 0%, #2828FF 100%)",
            boxShadow: "0 24px 80px rgba(5,5,255,0.22)",
          }}
        >
          {/* Dot grid texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          {/* Soft top-right glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-20"
            style={{ background: "white" }}
          />

          <div className="relative">
            <p
              className="mb-3 text-xs font-bold tracking-[0.18em] text-white/40"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ONE ACTION · ONE WIN
            </p>
            <h2 className="font-display mb-4 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              The bank that lives in your texts.
            </h2>
            <p className="mb-8 max-w-lg text-white/65 leading-relaxed">
              Text a number. Money moves. Arrives as cash in their bank account.
              No app, no wallet, no seed phrase.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={IMESSAGE_HREF}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 self-start rounded-full bg-white px-7 text-sm font-semibold text-primary shadow-lg transition-all hover:brightness-95 active:scale-[0.97]"
              >
                Text{" "}
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {SITE.imessagePhoneDisplay}
                </span>
              </a>
              <a
                href={SITE.metricsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2.5 self-start rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.97]"
              >
                See live metrics
              </a>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
