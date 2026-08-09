import { DeckViewer } from "../deck-viewer";
import { DECKS, deckMetadata } from "@/lib/decks";

export const metadata = deckMetadata(DECKS.update);

export default function InvestorUpdatePage() {
  return <DeckViewer deck={DECKS.update} />;
}
