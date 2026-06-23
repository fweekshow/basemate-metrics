import type { Metadata } from "next";
import { DeckRedirect } from "./deck-redirect";

const BASE_URL = "https://basemate.app";

export const metadata: Metadata = {
  title: "Basemate — Pitch Deck",
  description:
    "Your AI financial advisor is in your texts. Trade, earn, and grow — all in iMessage.",
  openGraph: {
    title: "Basemate — Pitch Deck",
    description:
      "Your AI financial advisor is in your texts. Trade, earn, and grow — all in iMessage.",
    url: `${BASE_URL}/deck`,
    siteName: "Basemate",
    images: [{ url: `${BASE_URL}/basemate-og.png`, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Basemate — Pitch Deck",
    description:
      "Your AI financial advisor is in your texts. Trade, earn, and grow — all in iMessage.",
    images: [`${BASE_URL}/basemate-og.png`],
  },
};

export default function DeckPage() {
  return <DeckRedirect />;
}
