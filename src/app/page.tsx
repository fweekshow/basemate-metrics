import type { Metadata } from "next";
import Image from "next/image";
import { Compass, MessageCircle, Sparkles, Users } from "lucide-react";

import { SiteCtaRow, SiteShell } from "@/components/site/site-shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.name} - ${SITE.tagline}`,
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} - ${SITE.tagline}`,
    description: SITE.description,
    type: "website",
    images: [SITE.pfp],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} - ${SITE.tagline}`,
    description: SITE.description,
    images: [SITE.pfp],
  },
};

const features = [
  {
    icon: Compass,
    title: "Discovery in the chat",
    body: "Basemate lives inside group conversations and surfaces communities when intent matches — no feed scrolling required.",
  },
  {
    icon: MessageCircle,
    title: "Intent-matched DMs",
    body: "When someone asks the right question, Basemate can DM them with a one-tap path into your group.",
  },
  {
    icon: Users,
    title: "Built for communities",
    body: "Group owners add @basemate for free. Advertisers bid on keywords in the miniapp when they want paid reach.",
  },
  {
    icon: Sparkles,
    title: "Agent-native on Base",
    body: "Swaps, launches, and wallet flows run through the Basemate agent on Base — with human-readable approvals when needed.",
  },
] as const;

export default function HomePage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-14">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              AI-powered · Base · group chats
            </div>

            <div className="space-y-4">
              <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-5xl">
                What if communities{" "}
                <span className="text-primary">found you?</span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {SITE.description} Add Basemate to your group, match intent in
                real time, and grow with agent-native discovery on Base.
              </p>
            </div>

            <SiteCtaRow />
          </div>

          <div className="flex flex-1 justify-center lg:justify-end">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-6 rounded-full bg-primary/20 blur-3xl"
              />
              <Image
                src={SITE.pfp}
                alt="@basemate profile"
                width={280}
                height={280}
                className="relative rounded-3xl border border-border/80 shadow-2xl glow-primary"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6">
          {features.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-xl border border-border/60 bg-card/60 p-5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="font-mono text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6 sm:p-8">
          <h2 className="font-mono text-xl font-semibold sm:text-2xl">
            Ready to unlock discovery?
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Add @basemate on Base to your group chat. For keyword ads and
            auctions, open the miniapp — fund your wallet first if you need USDC
            on Base.
          </p>
          <div className="mt-6">
            <SiteCtaRow />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
