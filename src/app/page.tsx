import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.name} — The Base-native trading agent`,
  description: "Trade perps, swap, earn yield, and scout launches — all by messaging. The Base-native agent that lives in your chats.",
};

const stats = [
  { value: "$2M+", label: "VOLUME TRADED" },
  { value: "1000s", label: "USERS" },
  { value: "100s", label: "TOKENS LAUNCHED" },
  { value: "Avantis", label: "PERPS PARTNER" },
] as const;

const roadmap = [
  { label: "Agent launched on Base App", done: true },
  { label: "Basemate token launched", done: true },
  { label: "Avantis perps integration live", done: true },
  { label: "Hundreds of tokens launched via Basemate", done: true },
  { label: "Millions in trading volume", done: true },
  { label: "Thousands of active users", done: true },
  { label: "Basemate on iMessage", done: false, final: true },
] as const;

export default function HomePage() {
  return (
    <SiteShell>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-5xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">

          {/* Left — headline + CTA */}
          <div className="flex-1 space-y-7">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Base-native · on-chain · in the chat
            </div>

            <h1
              className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
              style={{ textWrap: "balance" }}
            >
              Trade, earn, and launch.{" "}
              <span className="text-primary">By just messaging.</span>
            </h1>

            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              Basemate is the Base-native agent that lives in your chats.
              Long a perp, swap tokens, earn yield, or scout the next launch —
              every action is one tap away.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={SITE.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]"
              >
                Add @basemate on Base
              </a>
              <Link
                href="/pay"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border/70 bg-transparent px-6 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.97]"
              >
                Fund your wallet
              </Link>
            </div>
          </div>

          {/* Right — chat mockup */}
          <div className="flex flex-1 justify-center lg:justify-end">
            <ChatMockup />
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────── */}
      <section className="border-y border-border/50 bg-card/20">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px px-4 sm:grid-cols-4 sm:px-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col gap-1 px-4 py-8 sm:px-6">
              <span
                className="text-3xl font-bold text-up"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {value}
              </span>
              <span
                className="text-xs font-medium tracking-widest text-muted-foreground"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── What you can do ──────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-display mb-10 text-2xl font-bold sm:text-3xl">
          One agent. Everything on Base.
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              label: "PERPS",
              headline: "Long or short anything",
              body: 'Say "long eth 5×" — Basemate opens the Avantis position with TP/SL set, settled on Base.',
              accent: "text-primary",
            },
            {
              label: "TRENDING",
              headline: "Scout launches before they moon",
              body: 'Ask "what\'s trending?" and get a live Bankr feed with top movers and one-tap buy.',
              accent: "text-up",
            },
            {
              label: "EARN",
              headline: "Park idle USDC, earn yield",
              body: "Tell Basemate to earn and it finds the best rate on Base, executes, and confirms — one message.",
              accent: "text-primary",
            },
            {
              label: "LAUNCH",
              headline: "Ship a token from the chat",
              body: "Describe it, confirm the details, and it's on-chain — no launchpad interface required.",
              accent: "text-up",
            },
          ].map(({ label, headline, body, accent }) => (
            <div
              key={label}
              className="rounded-2xl border border-border/60 bg-card/60 p-6 transition-colors hover:bg-card/90"
            >
              <span
                className={`mb-3 block text-xs font-semibold tracking-widest ${accent}`}
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}
              >
                {label}
              </span>
              <h3 className="font-display mb-2 text-lg font-bold">{headline}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Roadmap ──────────────────────────────────────────────── */}
      <section className="border-t border-border/50 bg-card/10">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Roadmap</h2>
            <span
              className="text-xs font-medium text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              DESTINATION: iMESSAGE
            </span>
          </div>

          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border/60 sm:left-[11px]" />

            <ol className="space-y-0">
              {roadmap.map(({ label, done, final }, i) => (
                <li key={i} className="relative flex items-start gap-5 pb-8 last:pb-0">
                  {/* dot */}
                  <span
                    className={`relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 sm:h-6 sm:w-6 ${
                      final
                        ? "border-primary bg-primary/20 shadow-[0_0_12px_rgba(10,10,255,0.5)]"
                        : done
                        ? "border-up bg-up/15"
                        : "border-border/60 bg-background"
                    }`}
                  >
                    {done && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-up" />
                      </svg>
                    )}
                    {final && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </span>

                  {/* label */}
                  <span
                    className={`pt-0.5 text-sm leading-snug ${
                      final
                        ? "font-semibold text-primary"
                        : done
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {label}
                    {final && (
                      <span
                        className="ml-2 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        NEXT
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-8 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-up/5 blur-2xl"
          />
          <div className="relative flex items-center gap-8 sm:gap-12">
            {/* text + cta */}
            <div className="flex-1">
              <h2 className="font-display mb-3 text-2xl font-bold sm:text-3xl">
                Ready to trade in the chat?
              </h2>
              <p className="mb-6 max-w-md text-muted-foreground">
                Add @basemate to your Base App group. One message. One tap. One win.
              </p>
              <a
                href={SITE.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]"
              >
                Add @basemate on Base
              </a>
            </div>
            {/* mascot — buff flat version on white sticker tile */}
            <div className="hidden shrink-0 sm:flex sm:items-center sm:justify-center">
              <div className="rounded-2xl bg-white p-3 shadow-[0_0_32px_rgba(25,251,68,0.3),0_0_0_1px_rgba(25,251,68,0.2)]">
                <Image
                  src="/brand/mascot/mate-win-buff.png"
                  alt=""
                  width={128}
                  height={128}
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
    <div className="w-full max-w-[340px] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-border/50 bg-card/80 px-4 py-3 backdrop-blur-md">
        <Image
          src="/brand/logo/basemate-logo-flat.png"
          alt="Basemate"
          width={28}
          height={28}
          className="rounded-lg"
        />
        <div>
          <p className="text-xs font-semibold text-foreground">Basemate</p>
          <p className="text-[10px] text-up" style={{ fontFamily: "var(--font-mono)" }}>● LIVE ON BASE</p>
        </div>
      </div>

      {/* messages */}
      <div className="space-y-3 px-3 py-4">
        {/* user — solid blue, no tail (design system flat bubble) */}
        <div className="flex justify-end">
          <div className="max-w-[75%] rounded-[20px] px-3.5 py-2.5 text-sm font-medium text-white" style={{ background: "#0505FF" }}>
            long eth
          </div>
        </div>

        {/* agent — white card, blue-tinted border */}
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-[20px] px-3.5 py-2.5 text-sm" style={{ background: "#ffffff", color: "#0F172A", border: "1.5px solid #E8E8FF", boxShadow: "0 1px 4px rgba(5,5,255,0.06)" }}>
            <p>Open <strong>ETH long, 5×</strong> with $200 collateral?</p>
            <p className="mt-1 text-xs" style={{ color: "#64748B" }}>
              tactical tier · TP +20% / SL −10%
            </p>
          </div>
        </div>

        {/* inline pill actions */}
        <div className="flex flex-wrap gap-2 pl-1">
          {["Long 5×", "Change size", "Not now"].map((a, i) => (
            <span
              key={a}
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={i === 0
                ? { background: "#0505FF", color: "#fff" }
                : { border: "1.5px solid rgba(203,213,225,0.3)", color: "#64748B" }
              }
            >
              {a}
            </span>
          ))}
        </div>

        {/* user confirms */}
        <div className="flex justify-end">
          <div className="max-w-[75%] rounded-[20px] px-3.5 py-2.5 text-sm font-medium text-white" style={{ background: "#0505FF" }}>
            long 5×
          </div>
        </div>

        {/* agent win — green accent */}
        <div className="flex justify-start">
          <div className="max-w-[90%] rounded-[20px] px-3.5 py-2.5 text-sm" style={{ background: "#ffffff", color: "#0F172A", border: "1.5px solid rgba(25,251,68,0.3)", boxShadow: "0 0 12px rgba(25,251,68,0.15)" }}>
            <p>Done — settled on Base.</p>
            <p
              className="mt-1 text-base font-bold"
              style={{ fontFamily: "var(--font-mono)", color: "#16A34A" }}
            >
              +82% on collateral ↗
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
