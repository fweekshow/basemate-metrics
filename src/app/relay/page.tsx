import type { Metadata } from "next";
import Image from "next/image";

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
    accent: "#A56EFF",
  },
  {
    title: "Pay freelancers anywhere",
    body: "Global teams, no payment headaches.",
    accent: "#2147FF",
  },
  {
    title: "Split travel expenses",
    body: "Different currencies, one experience.",
    accent: "#C8FF00",
  },
  {
    title: "Donate instantly",
    body: "When every second matters.",
    accent: "#F3E9D2",
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
    <main className="relative min-h-screen overflow-hidden bg-[#08080B] text-[#F3E9D2]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] opacity-70"
        style={{
          background:
            "radial-gradient(circle at 20% 8%, rgba(33,71,255,.32), transparent 34%), radial-gradient(circle at 82% 16%, rgba(165,110,255,.26), transparent 32%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-6 sm:px-8">
        <header className="flex items-center justify-between py-8">
          <a href="/relay" className="flex items-center gap-3">
            <Image
              src="/relay/logo-mark.png"
              alt="Relay"
              width={36}
              height={36}
              priority
              className="rounded-xl"
            />
            <span className="font-display text-lg font-bold tracking-[0.08em]">
              Relay
            </span>
          </a>
          <a
            href="#send"
            className="rounded-full border border-[#F3E9D2]/25 px-5 py-2 text-sm font-semibold tracking-[0.04em] transition hover:bg-[#F3E9D2]/10"
          >
            Send money
          </a>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-14 py-20 sm:py-24 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <h1
              className="font-display text-4xl font-bold leading-[1.15] tracking-[0.03em] sm:text-5xl"
              style={{ textWrap: "balance" }}
            >
              Money should move as effortlessly as a message.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 tracking-[0.02em] text-[#F3E9D2]/60">
              The internet became global. Money never did. Relay is the missing
              layer — one simple experience across borders.
            </p>
            <div id="send" className="mt-10 flex items-center gap-5">
              <a
                href="#layer"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#FF5A3D] px-8 text-sm font-bold tracking-[0.06em] text-[#08080B] shadow-[0_0_36px_rgba(255,90,61,.28)] transition hover:brightness-110"
              >
                Send money
              </a>
              <p className="text-sm tracking-[0.03em] text-[#F3E9D2]/50">
                We&apos;ll figure out the rest.
              </p>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="absolute -inset-8 rounded-[3rem] bg-[#2147FF]/18 blur-3xl" aria-hidden />
            <Image
              src="/relay-bg.png"
              alt="Relay illustration - money moving through one global layer"
              width={1024}
              height={1536}
              priority
              className="relative h-auto w-full rounded-[2rem]"
            />
          </div>
        </section>

        <div className="mx-auto max-w-3xl">
          {/* One Global Money Layer */}
          <section id="layer" className="border-t border-[#F3E9D2]/12 py-20">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-[#C8FF00]">
              01 — The Layer
            </p>
            <h2 className="font-display mt-6 text-2xl font-bold tracking-[0.04em] sm:text-3xl">
              One Global Money Layer.
            </h2>
            <p className="mt-6 max-w-xl leading-8 tracking-[0.02em] text-[#F3E9D2]/60">
              Behind a simple Send button, Relay routes every payment through
              the fastest, cheapest and most reliable path. You don&apos;t
              choose the rail, the network or the stablecoin.
            </p>
            <p className="mt-4 font-semibold tracking-[0.03em] text-[#F3E9D2]">
              You simply send money.
            </p>
          </section>

          {/* Built for real life */}
          <section className="border-t border-[#F3E9D2]/12 py-20">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-[#A56EFF]">
              02 — Real life
            </p>
            <h2 className="font-display mt-6 text-2xl font-bold tracking-[0.04em] sm:text-3xl">
              Built for real life.
            </h2>
            <ul className="mt-10">
              {useCases.map((useCase) => (
                <li
                  key={useCase.title}
                  className="flex flex-col gap-1 border-t border-[#F3E9D2]/8 py-5 first:border-t-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <span className="flex items-baseline gap-3">
                    <span
                      className="size-2 shrink-0 self-center rounded-full"
                      style={{ background: useCase.accent }}
                      aria-hidden
                    />
                    <span className="font-display font-bold tracking-[0.04em]">
                      {useCase.title}
                    </span>
                  </span>
                  <span className="text-sm tracking-[0.02em] text-[#F3E9D2]/50 sm:text-right">
                    {useCase.body}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Invisible infrastructure */}
          <section className="border-t border-[#F3E9D2]/12 py-20">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-[#2147FF]">
              03 — Infrastructure
            </p>
            <h2 className="font-display mt-6 text-2xl font-bold tracking-[0.04em] sm:text-3xl">
              Invisible infrastructure.
            </h2>
            <p className="mt-6 max-w-xl leading-8 tracking-[0.02em] text-[#F3E9D2]/60">
              Relay automatically chooses the best settlement path for every
              destination. The technology adapts to the destination — not the
              other way around.
            </p>
          </section>

          {/* Statement */}
          <section className="border-t border-[#F3E9D2]/12 py-24 text-center">
            <p
              className="font-display mx-auto max-w-xl text-2xl font-bold leading-relaxed tracking-[0.04em] sm:text-3xl"
              style={{ textWrap: "balance" }}
            >
              People just want money to arrive. Relay makes that happen.
            </p>
            <p className="mt-10 font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-[#F3E9D2]/45">
              {closing.join("  ·  ")}
            </p>
          </section>

          {/* Welcome */}
          <footer className="relative border-t border-[#F3E9D2]/12 py-24 text-center">
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-64 opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 50% 100%, rgba(255,90,61,.2), transparent 60%)",
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
            <h2 className="font-display relative mt-6 text-3xl font-bold tracking-[0.05em] sm:text-4xl">
              Welcome to Relay.
            </h2>
            <p className="relative mt-5 font-mono text-xs font-bold uppercase tracking-[0.4em] text-[#FF5A3D]">
              The Global Money Layer
            </p>
            <a
              href="#send"
              className="relative mt-10 inline-flex min-h-12 items-center justify-center rounded-full bg-[#FF5A3D] px-8 text-sm font-bold tracking-[0.06em] text-[#08080B] shadow-[0_0_36px_rgba(255,90,61,.28)] transition hover:brightness-110"
            >
              Send money
            </a>
          </footer>
        </div>
      </div>
    </main>
  );
}
