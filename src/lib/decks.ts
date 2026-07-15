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
    downloadName: "Basemate-Pitch-Deck.pdf",
    title: "Basemate — Pitch Deck",
    toolbarLabel: "Pitch Deck",
    description:
      "Your AI financial advisor is in your texts. Trade, earn, and grow — all in iMessage.",
    path: "/deck",
  },
  v2: {
    id: "v2",
    pdfUrl: "/deck2.pdf",
    downloadName: "Basemate-Pitch-Deck-v2.pdf",
    title: "Basemate — Pitch Deck v2",
    toolbarLabel: "Pitch Deck v2",
    description:
      "Every Basemate wallet should have an agent. Save, Earn, Trade, Send — all in iMessage.",
    path: "/deck2",
  },
} as const satisfies Record<string, DeckConfig>;

export function deckMetadata(deck: DeckConfig): Metadata {
  return {
    title: deck.title,
    description: deck.description,
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
