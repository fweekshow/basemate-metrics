import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";

export const metadata: Metadata = {
  title: "Relay - The Global Money Layer",
  description:
    "Money should move as effortlessly as a message. Relay routes every payment through the fastest, cheapest and most reliable path - you simply send money.",
};

const useCases = [
  {
    title: "Support family abroad",
    body: "Money reaches them without waiting days.",
    accent: "#FF5A3D",
  },
  {
    title: "Help students overseas",
    body: "Tuition, living expenses, pocket money.",
    accent: "#0505FF",
  },
  {
    title: "Pay freelancers anywhere",
    body: "Global teams, no payment headaches.",
    accent: "#0505FF",
  },
  {
    title: "Split travel expenses",
    body: "Different currencies, one experience.",
    accent: "#16A34A",
  },
  {
    title: "Donate instantly",
    body: "When every second matters.",
    accent: "#FF5A3D",
  },
] as const;

const closing = [
  "Global by default",
  "Simple by design",
  "Infrastructure underneath",
  "Magic on top",
] as const;

export default function RelayPage() {
  return (
    <SiteShell>
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <section className="grid items-center gap-10 py-12 sm:py-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-12">
          <div>
            <h1
              className="font-display text-4xl font-semibold leading-[1.15] tracking-normal text-foreground sm:text-5xl"
              style={{ textWrap: "balance" }}
            >
              Money should move as effortlessly as a message.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              The internet became global. Money never did. Relay is the missing
              layer — one simple experience across borders.
            </p>
            <div id="send" className="mt-7 flex flex-wrap items-center gap-4">
              <a
                href="#layer"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#FF5A3D] px-8 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(255,90,61,.28)] transition hover:brightness-110 active:scale-[0.97]"
              >
                Send money
              </a>
              <p className="text-sm text-muted-foreground">
                We&apos;ll figure out the rest.
              </p>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[380px]">
            <div
              className="absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-3xl"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-white shadow-[0_8px_40px_rgba(5,5,255,0.08)]">
              <Image
                src="/relay-bg.png"
                alt="Relay illustration - money moving through one global layer"
                width={1024}
                height={1536}
                priority
                className="relative h-auto w-full"
              />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl pb-6">
          <section id="layer" className="border-t border-border py-10 sm:py-12">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              01 — The Layer
            </p>
            <h2 className="font-display mt-3 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              One Global Money Layer.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Behind a simple Send button, Relay routes every payment through
              the fastest, cheapest and most reliable path. You don&apos;t
              choose the rail, the network or the stablecoin.
            </p>
            <p className="mt-3 text-base font-semibold text-foreground">
              You simply send money.
            </p>
          </section>

          <section id="real-life" className="border-t border-border py-10 sm:py-12">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              02 — Real life
            </p>
            <h2 className="font-display mt-3 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              Built for real life.
            </h2>
            <ul className="mt-6">
              {useCases.map((useCase) => (
                <li
                  key={useCase.title}
                  className="flex flex-col gap-1 border-t border-border/70 py-4 first:border-t-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <span className="flex items-baseline gap-3">
                    <span
                      className="size-2 shrink-0 self-center rounded-full"
                      style={{ background: useCase.accent }}
                      aria-hidden
                    />
                    <span className="text-base font-semibold text-foreground">
                      {useCase.title}
                    </span>
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground sm:text-right">
                    {useCase.body}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section
            id="infrastructure"
            className="border-t border-border py-10 sm:py-12"
          >
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              03 — Infrastructure
            </p>
            <h2 className="font-display mt-3 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              Invisible infrastructure.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Relay automatically chooses the best settlement path for every
              destination. The technology adapts to the destination — not the
              other way around.
            </p>
          </section>

          <section className="border-t border-border py-12 text-center sm:py-14">
            <p
              className="font-display mx-auto max-w-xl text-2xl font-semibold leading-snug tracking-normal text-foreground sm:text-3xl"
              style={{ textWrap: "balance" }}
            >
              People just want money to arrive. Relay makes that happen.
            </p>
            <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {closing.join("  ·  ")}
            </p>
          </section>

          <section className="relative border-t border-border py-12 text-center sm:py-14">
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-64 opacity-70"
              style={{
                background:
                  "radial-gradient(circle at 50% 100%, rgba(5,5,255,.08), transparent 60%)",
              }}
              aria-hidden
            />
            <Image
              src="/relay/logo-mark.png"
              alt=""
              width={56}
              height={56}
              className="relative mx-auto rounded-2xl"
              aria-hidden
            />
            <h2 className="font-display relative mt-5 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Welcome to Relay.
            </h2>
            <p className="relative mt-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#FF5A3D]">
              The Global Money Layer
            </p>
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#send"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#FF5A3D] px-8 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(255,90,61,.28)] transition hover:brightness-110 active:scale-[0.97]"
              >
                Send money
              </a>
              <Link
                href="/landing"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white px-7 text-sm font-semibold text-foreground transition hover:bg-muted/50"
              >
                Back to Basemate
              </Link>
            </div>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
