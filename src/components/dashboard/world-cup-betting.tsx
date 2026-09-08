import type { AnalyticsPayload } from "@/lib/types";
import { full, usdc } from "@/lib/format";
import { sumFeatureClicks } from "@/lib/volume";

function MiniStat({
  label,
  value,
  accent = "text-foreground",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/50 py-1.5 last:border-0">
      <span className="truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={`shrink-0 font-mono text-sm tabular-nums ${accent}`}>
        {value}
      </span>
    </div>
  );
}

const WC_SLUGS = ["menu_world_cup", "cap_world_cup_upcoming"];

export function WorldCupBettingPanel({ data }: { data: AnalyticsPayload }) {
  const wc = data.worldCupBetting;
  const menuClicks =
    data.featureEngagement?.worldCup?.clicksLifetime ??
    sumFeatureClicks(data.engagement.topButtonActions, WC_SLUGS);

  return (
    <div className="flex h-full flex-col justify-start gap-1">
      {wc ? (
        <>
          <MiniStat
            label="Bets placed"
            value={full(wc.betsPlacedLifetime)}
            accent="text-up"
          />
          <MiniStat label="Bets 24h" value={full(wc.betsPlaced24h)} />
          <MiniStat
            label="Basemate wagered"
            value={usdc(wc.basemateWageredLifetime)}
            accent="text-primary"
          />
          <MiniStat
            label="Wagered 24h"
            value={usdc(wc.basemateWagered24h)}
          />
        </>
      ) : (
        <p className="py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
          Bet counts ship with the next agent deploy. Menu clicks below are
          engagement only — not placed bets.
        </p>
      )}
      <MiniStat label="Menu clicks" value={full(menuClicks)} />
    </div>
  );
}
