"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  BonePanel,
  LilacDots,
  LilacMesh,
  MonoEyebrow,
  PhaseLabel,
} from "@/components/site/brand-primitives";

type RoadmapItem = {
  label: string;
  done: boolean;
  next?: boolean;
  destination?: boolean;
  pending?: boolean;
};

const INFLIGHT_START_INDEX = 6;
const REVEAL_MS = 700;

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" className={className}>
      <path
        d="M1 5l3.5 3.5L11 1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomeRoadmap({ items }: { items: readonly RoadmapItem[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [displayPercent, setDisplayPercent] = useState(0);

  const destination = useMemo(
    () => items.find((item) => item.destination),
    [items],
  );
  const timelineItems = useMemo(
    () => items.filter((item) => !item.destination),
    [items],
  );
  const shippedItems = useMemo(
    () => timelineItems.slice(0, INFLIGHT_START_INDEX),
    [timelineItems],
  );
  const inflightItems = useMemo(
    () => timelineItems.slice(INFLIGHT_START_INDEX),
    [timelineItems],
  );

  const doneCount = items.filter((item) => item.done).length;
  const progressPercent = Math.round((doneCount / items.length) * 100);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min((now - start) / REVEAL_MS, 1);
      const eased = 1 - (1 - t) ** 3;
      setDisplayPercent(Math.round(eased * progressPercent));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, progressPercent]);

  return (
    <section className="relative border-t border-border bg-muted/30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-lilac/8 to-transparent"
      />

      <div ref={sectionRef} className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.55s ease, transform 0.55s ease",
          }}
        >
        <BonePanel accent="lilac" className="overflow-hidden">
          {/* Header */}
          <div className="relative overflow-hidden border-b border-lilac/20 px-6 py-8 sm:px-10 sm:py-10">
            <LilacMesh />
            <LilacDots />

            <div className="relative">
              <MonoEyebrow tone="lilac">BUILD LOG</MonoEyebrow>
              <h2 className="font-display mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                What&apos;s shipped. What&apos;s next.
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                From cross-border send to local payout — one win at a time.
              </p>

              <div className="mt-7">
                <div
                  className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span>
                    <span className="text-lilac">{doneCount}</span> of {items.length} wins
                  </span>
                  <span className="tabular-nums font-semibold text-[#16A34A]">
                    {displayPercent}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full border border-lilac/30 bg-lilac/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#16A34A] to-[#2EBD77] transition-[width] duration-700 ease-out"
                    style={{ width: visible ? `${displayPercent}%` : "0%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Phase columns */}
          <div className="grid divide-y divide-lilac/15 bg-bone md:grid-cols-3 md:divide-x md:divide-y-0">
            {/* Shipped */}
            <div
              className="relative bg-white/50 p-6 sm:p-7"
              style={{
                animation: visible
                  ? "roadmap-item-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both"
                  : undefined,
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-lilac/40 via-lilac/10 to-transparent"
              />
              <PhaseLabel color="lilac">SHIPPED</PhaseLabel>
              <ul className="mt-5 space-y-3">
                {shippedItems.map((item, i) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-3"
                    style={{
                      animation: visible
                        ? `roadmap-item-in 0.4s ease-out ${0.15 + i * 0.05}s both`
                        : undefined,
                    }}
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-lilac/30 bg-lilac/20 text-[#16A34A]">
                      <CheckIcon />
                    </span>
                    <span className="text-sm leading-snug text-foreground">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* In flight */}
            <div
              className="relative bg-white/70 p-6 sm:p-7"
              style={{
                animation: visible
                  ? "roadmap-item-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both"
                  : undefined,
              }}
            >
              <PhaseLabel color="blue">IN FLIGHT</PhaseLabel>
              <ul className="mt-5 space-y-3">
                {inflightItems.map((item) => (
                  <li key={item.label}>
                    {item.next ? (
                      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] to-lilac/[0.08] p-4">
                        <div className="flex items-center gap-2">
                          <span className="size-2 shrink-0 rounded-full bg-primary" />
                          <span className="font-display text-sm font-bold text-primary">
                            {item.label}
                          </span>
                          <span
                            className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold tracking-widest text-white"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            NEXT
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-1 py-1 opacity-50">
                        <span className="size-2 shrink-0 rounded-full border border-lilac/40 bg-lilac/10" />
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span
                          className="rounded-full border border-lilac/30 bg-lilac/10 px-1.5 py-px text-[9px] tracking-widest text-[#6B5FA8]"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          COMING
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* North star */}
            <div
              className="relative flex flex-col bg-white/50 p-6 sm:p-7"
              style={{
                animation: visible
                  ? "roadmap-item-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both"
                  : undefined,
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-violet/40 via-lilac/20 to-transparent"
              />
              <PhaseLabel color="violet">NORTH STAR</PhaseLabel>

              {destination ? (
                <div className="mt-5 flex flex-1 flex-col rounded-2xl border border-lilac/50 bg-gradient-to-br from-lilac/20 via-[#F3F0FF] to-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className="rounded-full border border-lilac/60 bg-lilac/30 px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-violet"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      FINISH LINE
                    </span>
                    <div className="rounded-xl border border-lilac/40 bg-white p-2 shadow-sm">
                      <Image
                        src="/brand/logo/basemate-logo-flat.png"
                        alt="Basemate"
                        width={36}
                        height={36}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  <p className="font-display text-base font-bold leading-snug text-foreground">
                    {destination.label}
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    The default way to send money home — right inside your texts.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </BonePanel>
        </div>
      </div>
    </section>
  );
}
