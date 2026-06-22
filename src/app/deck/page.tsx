import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Basemate — Pitch Deck",
  description:
    "Your AI financial advisor is in your texts. Trade, earn, and grow — all in iMessage.",
  openGraph: {
    title: "Basemate — Pitch Deck",
    description:
      "Your AI financial advisor is in your texts. Trade, earn, and grow — all in iMessage.",
    url: "https://basemate.app/deck",
    siteName: "Basemate",
    images: [{ url: "/basemate-og.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Basemate — Pitch Deck",
    description:
      "Your AI financial advisor is in your texts. Trade, earn, and grow — all in iMessage.",
    images: ["/basemate-og.png"],
  },
};

export default function DeckPage() {
  return (
    <main className="fixed inset-0 flex flex-col bg-black">
      <iframe
        src="/deck.pdf"
        className="h-full w-full border-0"
        title="Basemate Pitch Deck"
      />
      <noscript>
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-black text-white">
          <p className="font-mono text-sm">
            <a
              href="/deck.pdf"
              className="underline"
              download="Basemate Pitch Deck.pdf"
            >
              Download pitch deck
            </a>
          </p>
        </div>
      </noscript>
    </main>
  );
}
