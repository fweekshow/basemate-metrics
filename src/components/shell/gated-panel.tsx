"use client";

import { useSession } from "@/components/shell/session-provider";

export function GatedPanel({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  /** Public content shown above the gate. Never put fake balances here. */
  children?: React.ReactNode;
}) {
  const { openSignIn } = useSession();

  return (
    <div className="space-y-6">
      {children}
      <div className="rounded-[20px] border border-border bg-card px-6 py-8">
        <h2 className="font-display text-[22px] font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">{body}</p>
        <button
          type="button"
          onClick={openSignIn}
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
