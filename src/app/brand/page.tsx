import type { Metadata } from "next";
import Image from "next/image";

import { SiteShell } from "@/components/site/site-shell";

export const metadata: Metadata = {
  title: "Brand · Basemate",
  description: "Basemate brand guidelines — colors, typography, logo, components, and voice.",
};

export default function BrandPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 space-y-16">

        {/* ── Header ── */}
        <div className="space-y-3">
          <Mono className="text-xs font-bold tracking-[0.14em] text-muted-foreground">BASEMATE BRAND GUIDELINES · DS V2</Mono>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Brand Kit</h1>
          <p className="max-w-xl text-muted-foreground">
            Light canvas. Electric blue is the only accent. Green is financial-only. Everything else gets out of the way.
          </p>
        </div>

        {/* ── Logo & Mark ── */}
        <Section title="THE MARK — BASEMATE IS THE MASCOT" subtitle="Blue googly-eyes speech bubble. The logo IS the mascot.">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2 flex items-center justify-center gap-3 rounded-2xl border border-border bg-white p-8 shadow-sm">
              <Image src="/brand/logo/basemate-mark-transparent.png" alt="mark" width={48} height={48} className="rounded-xl" />
              <span className="font-display text-2xl font-bold text-foreground">basemate</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white p-8 shadow-sm">
              <Image src="/brand/logo/basemate-mark-transparent.png" alt="mark on white" width={64} height={64} className="rounded-2xl" />
              <Label>ON WHITE</Label>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border p-8" style={{ background: "#0505FF" }}>
              <Image src="/brand/logo/basemate-mark-transparent.png" alt="mark on blue" width={64} height={64} className="rounded-2xl" />
              <Label style={{ color: "rgba(255,255,255,0.6)" }}>ON BLUE</Label>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Sits on a <strong className="text-foreground">blue tile</strong> in chat headers, nav, avatars. Transparent PNG on any surface.
            Minimum <Mono className="text-xs">24px</Mono> · comfortable <Mono className="text-xs">64px</Mono>.
            Never stretch, recolor, or place on a busy background.
          </div>
        </Section>

        {/* ── Voice ── */}
        <Section title="VOICE — THE BASE-NATIVE MATE" subtitle="Sharp friend in the chat. Lead with the action. Lowercase welcome.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-3">
              <Label className="text-up">DO</Label>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>Talk like a sharp friend in the group chat</li>
                <li>Lead with the action and outcome</li>
                <li>Crypto-native lowercase welcome (gm, wagmi)</li>
                <li>Blue emoji only 💙 — at most one per message</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-3">
              <Label className="text-down">DON'T</Label>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>Sound like a chatbot ("As an AI…")</li>
                <li>Hedge or build jargon walls</li>
                <li>Emoji soup — blue 💙 only, at most one</li>
                <li>Position as a "ChatGPT wrapper"</li>
              </ul>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <Label className="mb-4 block">CANONICAL EXCHANGE</Label>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex gap-3"><span className="shrink-0 text-muted-foreground">user →</span><span>long eth</span></div>
              <div className="flex gap-3">
                <span className="shrink-0 text-muted-foreground">agent →</span>
                <span>Open <strong>ETH long, 5×</strong> with your $200 collateral? TP +20% / SL −10%.
                  <span className="mt-1 flex flex-wrap gap-2">
                    {["Long 5×", "Change size", "Not now"].map((a, i) => (
                      <span key={a} className={`rounded-full border px-2.5 py-0.5 text-xs ${i === 0 ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{a}</span>
                    ))}
                  </span>
                </span>
              </div>
              <div className="flex gap-3"><span className="shrink-0 text-muted-foreground">user →</span><span>long 5×</span></div>
              <div className="flex gap-3"><span className="shrink-0 text-muted-foreground">agent →</span><span className="text-up font-semibold">Done — settled on Base in one tap.</span></div>
            </div>
          </div>
        </Section>

        {/* ── Colors — Base Blue ramp ── */}
        <Section title="BASE BLUE — THE ONE ACCENT" subtitle="#0505FF rationed; ramp + translucent tints for text/rings/fills">
          <div className="grid grid-cols-6 gap-2">
            {[
              { stop: "200", hex: "#B9C2FF" },
              { stop: "400", hex: "#4F66FF", label: "TEXT" },
              { stop: "500 ★", hex: "#0505FF", label: "BRAND", dark: true },
              { stop: "600", hex: "#0404CC", label: "PRESS", dark: true },
              { stop: "700", hex: "#03038F", dark: true },
              { stop: "900", hex: "#0A0E2E", dark: true },
            ].map(({ stop, hex, label, dark }) => (
              <div key={stop} className="overflow-hidden rounded-xl border border-border shadow-sm">
                <div className="h-16" style={{ background: hex }} />
                <div className="bg-white p-2">
                  <Mono className="text-[10px] font-semibold text-foreground">{stop}</Mono>
                  {label && <Mono className="block text-[10px] text-muted-foreground">{label}</Mono>}
                  <Mono className="block text-[10px] text-muted-foreground">{hex}</Mono>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Foreground tones ── */}
        <Section title="FOREGROUND — TEXT TONES" subtitle="Near-black → secondary → muted → faint on lavender canvas">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-3">
            {[
              { label: "FG-1 · PRIMARY", color: "#0A0A1A", sample: "Done — settled on Base." },
              { label: "FG-2 · SECONDARY", color: "#44446A", sample: "Done — settled on Base." },
              { label: "FG-3 · MUTED", color: "rgba(10,10,26,0.45)", sample: "Done — settled on Base." },
              { label: "FG-4 · FAINT", color: "rgba(10,10,26,0.30)", sample: "Done — settled on Base." },
            ].map(({ label, color, sample }) => (
              <div key={label} className="flex items-center gap-6">
                <Mono className="text-[10px] w-36 shrink-0 text-muted-foreground">{label}</Mono>
                <span className="font-display text-lg font-bold" style={{ color }}>{sample}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Semantic ── */}
        <Section title="SEMANTIC — FINANCIAL ONLY" subtitle="Calm green / red · used inside PnL and trade contexts only. Never brand chrome.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3" style={{ borderColor: "rgba(22,163,74,0.2)" }}>
              <Mono className="text-[10px] text-muted-foreground">REALIZED PNL</Mono>
              <div className="font-display text-3xl font-bold" style={{ color: "#16A34A" }}>+$1,010 ↗</div>
              <div className="flex gap-2">
                {["UP", "LONG", "CONFIRMED"].map(t => (
                  <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A", fontFamily: "var(--font-mono)" }}>{t}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3" style={{ borderColor: "rgba(255,77,103,0.2)" }}>
              <Mono className="text-[10px] text-muted-foreground">REALIZED PNL</Mono>
              <div className="font-display text-3xl font-bold" style={{ color: "#FF4D67" }}>−$420 ↘</div>
              <div className="flex gap-2">
                {["DOWN", "SHORT", "DANGER"].map(t => (
                  <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest" style={{ background: "rgba(255,77,103,0.1)", color: "#FF4D67", fontFamily: "var(--font-mono)" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Surfaces ── */}
        <Section title="SURFACES — LAVENDER CANVAS, WHITE CARDS" subtitle="Canvas → card → muted → well. Elevation via soft shadow.">
          <div className="grid grid-cols-5 gap-3">
            {[
              { name: "CANVAS", hex: "#EAE8F5" },
              { name: "SURFACE-1\nCARD", hex: "#FFFFFF" },
              { name: "SURFACE-2\nMUTED", hex: "#F1F0FA" },
              { name: "SURFACE-4\nWELL", hex: "#DEDCEE" },
              { name: "ACCENT", hex: "#0505FF" },
            ].map(({ name, hex }) => (
              <div key={name} className="overflow-hidden rounded-xl border border-border shadow-sm">
                <div className="h-16" style={{ background: hex }} />
                <div className="bg-white p-2">
                  <Mono className="text-[10px] font-semibold text-foreground whitespace-pre-line">{name}</Mono>
                  <Mono className="block text-[10px] text-muted-foreground">{hex}</Mono>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Data-viz ── */}
        <Section title="DATA-VIZ HUES — CHARTS ONLY" subtitle="Functional series encoding for the metrics dashboard. Not brand chrome.">
          <div className="grid grid-cols-6 gap-3">
            {[
              { name: "BLUE", hex: "#0505FF" },
              { name: "CYAN", hex: "#0284C7" },
              { name: "GREEN", hex: "#16A34A" },
              { name: "VIOLET", hex: "#7C5CFF" },
              { name: "AMBER", hex: "#D97706" },
              { name: "RED", hex: "#FF4D67" },
            ].map(({ name, hex }) => (
              <div key={name} className="overflow-hidden rounded-xl border border-border shadow-sm">
                <div className="h-14" style={{ background: hex }} />
                <div className="bg-white p-2">
                  <Mono className="text-[10px] font-semibold text-foreground">{name}</Mono>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Typography ── */}
        <Section title="TYPOGRAPHY">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm px-6 py-5">
              <div className="mb-2 flex items-center gap-3">
                <Label className="text-primary">DISPLAY</Label>
                <span className="text-xs text-muted-foreground">Clash Display · headlines, hero numbers, wordmark</span>
              </div>
              <p className="font-display text-[2rem] font-bold leading-[1.05] text-foreground">
                Trade in the <span className="bm-emphasis">chat.</span>
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm px-6 py-5">
              <div className="mb-2 flex items-center gap-3">
                <Label className="text-primary">UI / BODY</Label>
                <span className="text-xs text-muted-foreground">Geist · chat copy, captions, all interface text</span>
              </div>
              <p className="text-lg text-foreground">Done — settled on Base in one tap.</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm px-6 py-5">
              <div className="mb-2 flex items-center gap-3">
                <Label className="text-primary">MONO</Label>
                <span className="text-xs text-muted-foreground">Geist Mono · tickers, prices, addresses, UPPERCASE labels</span>
              </div>
              <p className="font-mono text-base font-medium tracking-[0.04em] text-foreground">REALIZED PNL  +$1,010  WIN ↗</p>
            </div>
          </div>
        </Section>

        {/* ── Components — Buttons ── */}
        <Section title="CORE — BUTTON · BADGE · CARD · AVATAR · STAT" subtitle="Pill buttons, mono badges, surface cards, brand avatar, hero stats">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-6">

            <div className="space-y-3">
              <Label>BUTTONS</Label>
              <div className="flex flex-wrap items-center gap-3">
                <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(5,5,255,0.25)]">Sign transaction</button>
                <button className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground">Change size</button>
                <button className="rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary">Long 5×</button>
                <button className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground">Not now</button>
                <button className="rounded-full border border-down/30 bg-down/10 px-5 py-2.5 text-sm font-medium text-down">Cancel</button>
                <button className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground opacity-45 cursor-not-allowed">Disabled</button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white">Small</button>
                <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">Medium</button>
                <button className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-white">Large</button>
                <button className="rounded-[14px] bg-primary px-6 py-3 text-base font-semibold text-white">Squircle</button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>BADGES</Label>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>
                  <span className="size-1.5 rounded-full bg-up animate-pulse" />LIVE ON BASE
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[10px] font-bold tracking-widest text-white" style={{ fontFamily: "var(--font-mono)" }}>BASEMATE</span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest" style={{ fontFamily: "var(--font-mono)", background: "rgba(22,163,74,0.12)", color: "#16A34A" }}>WIN ↗</span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest" style={{ fontFamily: "var(--font-mono)", background: "rgba(255,77,103,0.1)", color: "#FF4D67" }}>SHORT ↘</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold tracking-widest text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>TACTICAL TIER</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold tracking-widest text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>REALIZED PNL</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>CARDS + AVATAR</Label>
              <div className="flex flex-wrap gap-4">
                {/* Stat card */}
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm min-w-[160px]" style={{ boxShadow: "var(--shadow-card)" }}>
                  <Mono className="text-[10px] text-muted-foreground">CARD · SURFACE-1</Mono>
                  <div className="mt-2 font-display text-3xl font-bold text-primary">$2M+</div>
                  <Mono className="text-[10px] text-muted-foreground">TOKEN VOLUME</Mono>
                </div>
                {/* Raised stat card */}
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm min-w-[160px]" style={{ background: "var(--surface-2)", boxShadow: "var(--shadow-card)" }}>
                  <Mono className="text-[10px] text-muted-foreground">CARD · RAISED + BORDER</Mono>
                  <div className="mt-2 font-display text-3xl font-bold text-foreground">142</div>
                  <Mono className="text-[10px] text-muted-foreground">TOKENS LAUNCHED</Mono>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="font-mono text-[10px] font-semibold text-up">+8</span>
                    <span className="font-mono text-[10px] text-muted-foreground">/ 24h</span>
                  </div>
                </div>
                {/* Avatar card */}
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex size-10 items-center justify-center rounded-xl shrink-0" style={{ background: "#0505FF" }}>
                    <Image src="/brand/logo/basemate-mark-transparent.png" alt="mark" width={28} height={28} className="rounded-lg" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-foreground">Basemate</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="size-1.5 rounded-full bg-up animate-pulse" />
                      <Mono className="text-[10px] text-muted-foreground">ONLINE</Mono>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Section>

        {/* ── Shape language ── */}
        <Section title="SHAPE LANGUAGE">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { name: "PILL", radius: "999px", use: "All action buttons, chips, badges", demo: "rounded-full" },
              { name: "SQUIRCLE CARD", radius: "20px", use: "Cards, sheets, panels — signature silhouette", demo: "rounded-2xl" },
              { name: "CHAT BUBBLE", radius: "20px / 6px tucked", use: "One corner clipped toward speaker — no tails", demo: "rounded-[18px] rounded-bl-[4px]" },
            ].map(({ name, radius, use, demo }) => (
              <div key={name} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-center">
                  <div className={`h-12 w-24 border-2 border-primary bg-primary/10 ${demo}`} />
                </div>
                <Label className="text-primary">{name}</Label>
                <p className="mt-1 text-xs text-muted-foreground"><Mono>{radius}</Mono></p>
                <p className="mt-1 text-xs text-muted-foreground">{use}</p>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </SiteShell>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xs font-bold tracking-widest text-muted-foreground" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}>
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Label({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`text-xs font-bold tracking-widest text-muted-foreground ${className ?? ""}`} style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.12em", ...style }}>
      {children}
    </span>
  );
}

function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-mono ${className ?? ""}`}>{children}</span>;
}
