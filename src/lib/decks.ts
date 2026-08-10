import type { Metadata } from "next";

const BASE_URL = "https://basemate.app";

export type DeckConfig = {
  id: string;
  pdfUrl: string;
  downloadName: string;
  title: string;
  toolbarLabel: string;
  description: string;
  path: string;
};

export const DECKS = {
  main: {
    id: "main",
    pdfUrl: "/deck.pdf",
    downloadName: "Mate-seed-deck-Aug10.pdf",
    title: "Mate — Seed Deck",
    toolbarLabel: "Seed Deck",
    description:
      "Money that lives in your texts. $1M seed to light up the first five country nodes on the messaging network for stablecoins.",
    path: "/deck",
  },
  onepager: {
    id: "onepager",
    pdfUrl: "/onepager.pdf",
    downloadName: "Mate-Onepager-v1.0.pdf",
    title: "Mate — One-Pager",
    toolbarLabel: "One-Pager",
    description:
      "One-page overview of Mate — the messaging network for stablecoins. Seed · 2026.",
    path: "/deck/onepager",
  },
  update: {
    id: "update",
    pdfUrl: "/investor-update.pdf",
    downloadName: "Mate-Investor-Update-v1.0.pdf",
    title: "Mate — Investor Update",
    toolbarLabel: "Investor Update",
    description:
      "August 2026 investor update — traction, the decision, the raise, and what we need.",
    path: "/deck/update",
  },
} as const satisfies Record<string, DeckConfig>;

export function deckMetadata(deck: DeckConfig): Metadata {
  return {
    title: deck.title,
    description: deck.description,
    robots: { index: false, follow: false },
    openGraph: {
      title: deck.title,
      description: deck.description,
      url: `${BASE_URL}${deck.path}`,
      siteName: "Basemate",
      images: [{ url: `${BASE_URL}/basemate-og.png`, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: deck.title,
      description: deck.description,
      images: [`${BASE_URL}/basemate-og.png`],
    },
  };
}
