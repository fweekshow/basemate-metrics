import { cn } from "@/lib/utils";

type Turn = { from: "you" | "mate"; text: string };

/** Illustrative only — this is a mock-up of the launch flow, not a live transcript. */
const THREAD: Turn[] = [
  { from: "you", text: "launch a token paired to AAPL" },
  {
    from: "mate",
    text: "On it. What's the name and ticker? I'll pair it against AAPLc — Coinbase's tokenized Apple.",
  },
  { from: "you", text: "Orchard, ticker ORCH" },
  {
    from: "mate",
    text: "Ready. ORCH / AAPLc, 90% of supply seeded into the pool, fees split 75% to you. Confirm to sign.",
  },
  { from: "you", text: "confirm" },
  { from: "mate", text: "Live. $ORCH is trading against AAPLc on Base." },
];

function Bubble({ turn }: { turn: Turn }) {
  const outgoing = turn.from === "you";
  return (
    <div className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
      <p
        className={cn(
          "max-w-[78%] px-3.5 py-2 text-[13px] leading-snug",
          outgoing
            ? "rounded-[18px] rounded-br-[6px] bg-primary text-primary-foreground"
            : "rounded-[18px] rounded-bl-[6px] bg-muted text-foreground",
        )}
      >
        {turn.text}
      </p>
    </div>
  );
}

export function MockThread() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-[26px] border border-border bg-card p-3 shadow-[var(--shadow-card)]">
      <div className="mb-2.5 flex items-center justify-between border-b border-border/60 px-1 pb-2">
        <span className="font-mono text-[11px] font-medium text-foreground">Basemate</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          iMessage
        </span>
      </div>
      <div className="space-y-1.5">
        {THREAD.map((turn, i) => (
          <Bubble key={i} turn={turn} />
        ))}
      </div>
      <p className="mt-3 px-1 font-mono text-[10px] text-muted-foreground">
        Illustration — not a live transcript.
      </p>
    </div>
  );
}
