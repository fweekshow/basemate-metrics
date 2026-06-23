"use client";

import { useEffect } from "react";

export function DeckRedirect() {
  useEffect(() => {
    window.location.replace("/deck.pdf");
  }, []);

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 bg-black text-white">
      <p className="font-mono text-sm text-white/60">Opening deck…</p>
      <a
        href="/deck.pdf"
        className="font-mono text-xs text-white/40 underline underline-offset-4"
      >
        Click here if it doesn&apos;t open
      </a>
    </main>
  );
}
