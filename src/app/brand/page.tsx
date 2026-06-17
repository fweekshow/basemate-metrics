import type { Metadata } from "next";
import Image from "next/image";

import { SiteShell } from "@/components/site/site-shell";

export const metadata: Metadata = {
  title: "Brand · Basemate",
  description: "Basemate brand guidelines — colors, typography, logo, mascots, and voice.",
};

export default function BrandPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 space-y-16">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <span
            className="text-xs font-bold tracking-widest text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}
          >
            BASEMATE BRAND GUIDELINES
          </span>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Brand Kit</h1>
          <p className="max-w-xl text-muted-foreground">
            Light canvas. Electric blue is the brand. Neon green means win.
            Everything else gets out of the way.
          </p>
        </div>

        {/* ── Positioning ──────────────────────────────────────── */}
        <Section title="POSITIONING">
          <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <Label>ONE-LINE</Label>
              <p className="mt-2 text-xl font-semibold leading-snug">
                The Base-native agent in your chats — trade, earn, and launch by just messaging.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Your Base-native mate.",
                "Trade in the chat. Win in the chat.",
                "One message. One tap. One win.",
              ].map((t) => (
                <div key={t} className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <Label>TAGLINE</Label>
                  <p className="mt-1 font-semibold italic">"{t}"</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>PERSONALITY</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["native", "fast", "plainspoken", "degen-fluent", "trustworthy", "playful", "calm-under-volatility"].map((k) => (
                    <span
                      key={k}
                      className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <Label>VOICE — DO</Label>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Talk like a sharp friend in the group chat</li>
                  <li>Lead with the action and outcome</li>
                  <li>Crypto-native lowercase is welcome (gm, wagmi)</li>
                </ul>
              </div>
            </div>
            <div>
              <Label>VOICE — DON'T</Label>
              <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <li>Sound like a chatbot ("As an AI…")</li>
                <li>Use jargon walls or hedge</li>
                <li>Mention being a "ChatGPT wrapper"</li>
                <li>Use emoji soup</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* ── Logo ─────────────────────────────────────────────── */}
        <Section title="LOGO & MARK">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-white p-8 shadow-sm">
              <Image src="/brand/logo/basemate-logo-flat.png" alt="Basemate flat logo" width={80} height={80} className="rounded-2xl" />
              <Label>FLAT — PREFERRED</Label>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-[#0A0A14] p-8">
              <Image src="/brand/logo/basemate-mark.png" alt="Basemate mark" width={80} height={80} className="rounded-2xl" />
              <Label className="text-white/40">MARK — DARK BG</Label>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-white p-8 shadow-sm">
              <Image src="/brand/logo/basemate-mark-light.jpg" alt="Basemate mark light" width={80} height={80} className="rounded-2xl" />
              <Label>MARK — LIGHT BG</Label>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-white p-8 shadow-sm">
              <Image src="/brand/logo-construction.png" alt="Logo construction" width={120} height={120} className="rounded-xl" />
              <Label>CONSTRUCTION GRID</Label>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
            <p>Minimum size: <Mono>24px</Mono> (favicon) · comfortable <Mono>64px</Mono> (avatar)</p>
            <p>Clear space: ≥ 10% of mark width on all sides</p>
            <p>Never place on a busy background. Never stretch or recolor the mark.</p>
          </div>
        </Section>

        {/* ── Mascots ──────────────────────────────────────────── */}
        <Section title="MASCOTS">
          <div className="grid grid-cols-3 gap-4">
            {[
              { file: "mate-win-buff.png", label: "Buff",  note: "Realized PnL · wins", whiteBg: true },
              { file: "mate-girl.png",     label: "Girl",  note: "Kawaii energy",        whiteBg: true },
              { file: "mate-rekt.png",     label: "Rekt",  note: "Losses · errors",      whiteBg: false },
            ].map(({ file, label, note, whiteBg }) => (
              <div key={file} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-6 shadow-sm">
                {whiteBg ? (
                  <div className="rounded-xl bg-muted/40 p-2">
                    <Image src={`/brand/mascot/${file}`} alt={label} width={80} height={80} />
                  </div>
                ) : (
                  <Image src={`/brand/mascot/${file}`} alt={label} width={80} height={80} />
                )}
                <div className="text-center">
                  <Mono className="text-xs font-bold text-primary">{label}</Mono>
                  <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            The mascot is the brand's expressive "icon" — use it for emotion, not UI affordances. Use sparingly.
          </p>
        </Section>

        {/* ── Colors ───────────────────────────────────────────── */}
        <Section title="COLORS">
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: "CANVAS", hex: "#00040A", label: "Dark product bg", swatch: { background: "#00040A", border: "1px solid #1A2230" } },
                { name: "BASE BLUE", hex: "#0505FF", label: "Brand mark · primary actions · user bubble", swatch: { background: "#0505FF" } },
                { name: "WIN GREEN", hex: "#19FB44", label: "PnL up · long · success accent", swatch: { background: "#19FB44" } },
                { name: "LOSS RED", hex: "#FF4D67", label: "PnL down · short · danger", swatch: { background: "#FF4D67" } },
              ].map(({ name, hex, label, swatch }) => (
                <div key={name} className="overflow-hidden rounded-xl border border-border shadow-sm">
                  <div className="h-20" style={swatch} />
                  <div className="bg-white p-3">
                    <Mono className="text-xs font-semibold text-foreground">{name}</Mono>
                    <Mono className="mt-0.5 block text-xs text-muted-foreground">{hex}</Mono>
                    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { name: "LILAC", hex: "#BFB4FE", label: "Mono labels: REALIZED PNL · WIN · 24H", swatch: { background: "#BFB4FE" } },
                { name: "VIOLET", hex: "#7C5CFF", label: "Secondary accent, risk tiers", swatch: { background: "#7C5CFF" } },
              ].map(({ name, hex, label, swatch }) => (
                <div key={name} className="flex items-center gap-4 overflow-hidden rounded-xl border border-border shadow-sm">
                  <div className="h-full w-16 shrink-0 self-stretch" style={swatch} />
                  <div className="py-3 pr-3">
                    <Mono className="text-xs font-semibold text-foreground">{name}</Mono>
                    <Mono className="mt-0.5 block text-xs text-muted-foreground">{hex}</Mono>
                    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Typography ───────────────────────────────────────── */}
        <Section title="TYPOGRAPHY">
          <div className="space-y-4">
            {[
              {
                family: "Space Grotesk",
                role: "DISPLAY",
                use: "Hero headlines, video end cards, campaign type",
                sample: "One tap. One win.",
                style: { fontFamily: "var(--font-space-grotesk)", fontSize: "2rem", fontWeight: 700, lineHeight: 1.05 },
              },
              {
                family: "Geist",
                role: "UI / BODY",
                use: "Chat copy, captions, body text, all interface copy",
                sample: "Done — settled on Base in one tap.",
                style: { fontFamily: "var(--font-geist-sans)", fontSize: "1.125rem", fontWeight: 400, lineHeight: 1.5 },
              },
              {
                family: "Geist Mono",
                role: "MONO",
                use: "Tickers, prices, addresses, status labels (UPPERCASE + wide tracking)",
                sample: "REALIZED PNL  +$1,010  WIN ↗",
                style: { fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 500, letterSpacing: "0.04em" },
              },
            ].map(({ family, role, use, sample, style }) => (
              <div key={family} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                <div className="px-6 py-5">
                  <div className="mb-3 flex items-center gap-3">
                    <Mono className="text-xs font-bold text-primary">{role}</Mono>
                    <span className="text-xs text-muted-foreground">{family} · {use}</span>
                  </div>
                  <p style={style} className="text-foreground">{sample}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Casing rule:</strong> Sentence case in chat. Crypto-native lowercase welcome (gm, wagmi).{" "}
            <Mono className="text-xs">MONO UPPERCASE</Mono> with wide tracking reserved for labels and status only.
          </div>
        </Section>

        {/* ── Shape language ───────────────────────────────────── */}
        <Section title="SHAPE LANGUAGE">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { name: "PILL", radius: "9999px", use: "Action buttons, chips, badges", demo: "rounded-full" },
              { name: "SQUIRCLE CARD", radius: "20px", use: "Feature cards, sheets, panels", demo: "rounded-2xl" },
              { name: "CHAT BUBBLE", radius: "22px / 4px tail", use: "Chat bubbles — no tails", demo: "rounded-[18px] rounded-bl-[4px]" },
            ].map(({ name, radius, use, demo }) => (
              <div key={name} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-center">
                  <div className={`h-12 w-24 border-2 border-primary bg-primary/8 ${demo}`} />
                </div>
                <Mono className="text-xs font-bold text-primary">{name}</Mono>
                <p className="mt-1 text-xs text-muted-foreground"><Mono>{radius}</Mono></p>
                <p className="mt-1 text-xs text-muted-foreground">{use}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Buttons are never rectangular web-form buttons — always pill or squircle. No speech-bubble tails.
          </p>
        </Section>

        {/* ── Voice example ────────────────────────────────────── */}
        <Section title="VOICE EXAMPLE">
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm">
            <Label className="mb-4 block">CANONICAL EXCHANGE</Label>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex gap-3">
                <span className="shrink-0 text-muted-foreground">user →</span>
                <span className="text-foreground">long eth</span>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 text-muted-foreground">agent →</span>
                <span className="text-foreground">
                  Open <strong>ETH long, 5×</strong> with your $200 default collateral?
                  <br />
                  You're on the <strong>tactical</strong> tier — I'll set TP +20% / SL −10%.
                  <br />
                  <span className="mt-1 inline-flex gap-2">
                    {["Long 5×", "Change size", "Not now"].map((a, i) => (
                      <span
                        key={a}
                        className={`rounded-full border px-2.5 py-0.5 text-xs ${
                          i === 0 ? "border-primary/50 bg-primary/6 text-primary" : "border-border text-muted-foreground"
                        }`}
                      >
                        {a}
                      </span>
                    ))}
                  </span>
                </span>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 text-muted-foreground">user →</span>
                <span className="text-foreground">long 5×</span>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 text-muted-foreground">agent →</span>
                <span className="text-up font-semibold">Done — settled on Base in one tap.</span>
              </div>
            </div>
          </div>
        </Section>

      </div>
    </SiteShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2
        className="text-xs font-bold tracking-widest text-muted-foreground"
        style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`text-xs font-bold tracking-widest text-muted-foreground ${className ?? ""}`}
      style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}
    >
      {children}
    </span>
  );
}

function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono ${className ?? ""}`}>{children}</span>
  );
}
