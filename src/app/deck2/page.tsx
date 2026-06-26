import { DeckViewer } from "@/app/deck/deck-viewer";
import { DECKS, deckMetadata } from "@/lib/decks";

export const metadata = deckMetadata(DECKS.v2);

export default function Deck2Page() {
  return <DeckViewer deck={DECKS.v2} />;
}
