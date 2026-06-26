import { DeckViewer } from "./deck-viewer";
import { DECKS, deckMetadata } from "@/lib/decks";

export const metadata = deckMetadata(DECKS.main);

export default function DeckPage() {
  return <DeckViewer deck={DECKS.main} />;
}
