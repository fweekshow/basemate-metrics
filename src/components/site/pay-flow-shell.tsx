import Image from "next/image";
import Link from "next/link";

import { SITE } from "@/lib/site";

/** Minimal chrome for /pay fund links opened from iMessage — no nav/footer clutter. */
export function PayFlowShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(420px,55vh)]"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% -10%, rgba(124, 92, 255, 0.12) 0%, transparent 70%)",
        }}
      />

      <header className="relative z-10 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-lg justify-center">
          <Link
            href="/landing"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-3 py-1.5 shadow-sm backdrop-blur-sm transition hover:border-primary/25"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <Image
              src="/brand/mascot/mate-eyes-blue.png"
              alt="@basemate"
              width={28}
              height={28}
              className="h-7 w-7 rounded-lg object-cover"
              priority
            />
            <span className="font-mono text-xs font-semibold tracking-tight">{SITE.name}</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </main>

      <p className="relative z-10 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
        Secured by Coinbase · USDC on Base
      </p>
    </div>
  );
}
