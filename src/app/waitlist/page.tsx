import type { Metadata } from "next";

import { SiteShell } from "@/components/site/site-shell";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { SITE } from "@/lib/site";

const SETS = [
  {
    letter: "S",
    title: "Send",
    body: "Pay friends, split costs, move USDC in a text.",
  },
  {
    letter: "E",
    title: "Earn",
    body: "5%+ APY on idle USDC, best rate found automatically.",
  },
  {
    letter: "T",
    title: "Trade",
    body: "Long, short, swap. One message to execute.",
  },
  {
    letter: "S",
    title: "Save",
    body: "USDC as your base. Stable and growing.",
  },
] as const;

const TRACTION = [
  { value: "8,700+", label: "USERS" },
  { value: "700", label: "TOKENS LAUNCHED" },
  { value: "$110K+", label: "NOTIONAL VOLUME" },
] as const;

export const metadata: Metadata = {
  title: "Waitlist · Basemate",
  description:
    "Basemate is coming to iMessage. Every Base Account should have an agent — Send, Earn, Trade, Save, all by text.",
  openGraph: {
    title: "Waitlist · Basemate",
    description:
      "Basemate is coming to iMessage. Every Base Account should have an agent — Send, Earn, Trade, Save, all by text.",
    type: "website",
    images: [SITE.pfp],
  },
};

export default function WaitlistPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:px-6 sm:pt-12 sm:pb-20">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-6 lg:-mt-2">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                coming soon · iMessage
              </div>
              <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
                Trade on Base, right in your{" "}
                <span className="bm-emphasis">messages.</span>
              </h1>
              <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
                Every Base Account should have an agent. That agent should have a
                phone number.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {SETS.map(({ letter, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-white p-5 shadow-sm"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-bold text-white"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {letter}
                    </span>
                    <span className="font-display text-base font-bold text-foreground">
                      {title}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <WaitlistForm />
        </div>

        <div className="mt-10 grid grid-cols-3 gap-3 border-t border-border pt-8 sm:mt-12">
          {TRACTION.map(({ value, label }) => (
            <div key={label} className="text-center sm:text-left">
              <div
                className="font-display text-xl font-bold text-primary sm:text-2xl"
                style={{ fontFeatureSettings: "'tnum' 1" }}
              >
                {value}
              </div>
              <div
                className="mt-0.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
