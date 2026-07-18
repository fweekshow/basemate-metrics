"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { DeckConfig } from "@/lib/decks";

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function DeckToolbar({ deck }: { deck: DeckConfig }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6">
      <Link href="/landing" className="flex min-w-0 items-center gap-2.5">
        <Image
          src="/brand/logo/basemate-logo-flat.png"
          alt="Basemate"
          width={28}
          height={28}
          className="rounded-lg"
        />
        <span className="truncate font-display text-sm font-semibold text-foreground">
          {deck.toolbarLabel}
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={deck.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center rounded-full border border-border bg-white px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Open
        </a>
        <a
          href={deck.pdfUrl}
          download={deck.downloadName}
          className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          Download
        </a>
      </div>
    </header>
  );
}

function MobileDeckPrompt({ deck }: { deck: DeckConfig }) {
  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <DeckToolbar deck={deck} />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <div
          className="flex size-20 items-center justify-center rounded-3xl bg-white shadow-sm"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <Image
            src="/brand/logo/basemate-mark-transparent.png"
            alt="Basemate"
            width={56}
            height={56}
            className="rounded-2xl"
          />
        </div>
        <div className="max-w-sm">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {deck.title}
          </h1>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <a
            href={deck.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            View deck
          </a>
          <a
            href={deck.pdfUrl}
            download={deck.downloadName}
            className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-white text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Download PDF
          </a>
        </div>
      </div>
    </main>
  );
}

function DesktopDeckEmbed({ deck }: { deck: DeckConfig }) {
  return (
    <main className="flex h-dvh flex-col bg-background">
      <DeckToolbar deck={deck} />
      <div className="relative min-h-0 flex-1 bg-muted/30">
        <iframe
          src={`${deck.pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
          title={deck.title}
          className="absolute inset-0 h-full w-full border-0"
        />
        <object
          data={deck.pdfUrl}
          type="application/pdf"
          className="absolute inset-0 hidden h-full w-full"
          aria-hidden
        >
          <p className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            PDF viewer unavailable.{" "}
            <a href={deck.pdfUrl} className="ml-1 text-primary underline">
              Open the deck
            </a>
          </p>
        </object>
      </div>
    </main>
  );
}

export function DeckViewer({ deck }: { deck: DeckConfig }) {
  const isMobile = useIsMobileViewport();

  if (isMobile === null) {
    return (
      <main className="flex h-dvh items-center justify-center bg-background">
        <p className="font-mono text-sm text-muted-foreground">Loading deck…</p>
      </main>
    );
  }

  if (isMobile) {
    return <MobileDeckPrompt deck={deck} />;
  }

  return <DesktopDeckEmbed deck={deck} />;
}
