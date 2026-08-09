import { DeckViewer } from "../deck-viewer";
import { DECKS, deckMetadata } from "@/lib/decks";

export const metadata = deckMetadata(DECKS.onepager);

export default function OnepagerPage() {
  return <DeckViewer deck={DECKS.onepager} />;
}
