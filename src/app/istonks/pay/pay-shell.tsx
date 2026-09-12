import Image from "next/image";

import { ISTONK_PAY_OG_PATH } from "@/lib/istonks-pay";

export function IstonkPayShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(420px,55vh)]"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% -10%, rgba(37, 99, 235, 0.16) 0%, transparent 70%)",
        }}
      />

      <header className="relative z-10 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-lg justify-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-3 py-1.5 shadow-sm backdrop-blur-sm"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <Image
              src={ISTONK_PAY_OG_PATH}
              alt=""
              width={28}
              height={16}
              className="h-4 w-7 rounded object-cover"
              priority
            />
            <span className="font-mono text-xs font-semibold tracking-tight">iStonk</span>
          </div>
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
