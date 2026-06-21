import type { AnalyticsPayload, BasemateWalletsMetric } from "@/lib/types";
import { full, usdc } from "@/lib/format";

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

function resolveBasemateWallets(data: AnalyticsPayload): BasemateWalletsMetric {
  if (data.basemateWallets) return data.basemateWallets;

  const flow = data.protocolFlow?.avantis;
  const tv = data.tradingVolume;

  return {
    activeWallets: 0,
    cdpWallets: 0,
    publishedStrategies: 0,
    perpOpensLifetime: 0,
    perpOpens24h: 0,
    openPositions: 0,
    activeSubscriptions: data.copyTradeSubscriptions ?? 0,
    marginLifetimeUsdc:
      flow?.copyVolumeUsdc ?? tv?.serverWalletUsdc ?? "0",
    margin24hUsdc: flow?.copyVolume24hUsdc ?? tv?.serverWallet24hUsdc ?? "0",
    notionalLifetimeUsdc:
      flow?.copyNotionalUsdc ??
      tv?.serverWalletNotionalUsdc ??
      flow?.copyVolumeUsdc ??
      "0",
    notional24hUsdc:
      flow?.copyNotional24hUsdc ??
      tv?.serverWalletNotional24hUsdc ??
      flow?.copyVolume24hUsdc ??
      "0",
  };
}

export function BasemateWalletsPanel({ data }: { data: AnalyticsPayload }) {
  const wallets = resolveBasemateWallets(data);
  const hasWalletCounts = Boolean(data.basemateWallets);

  return (
    <div className="flex h-full flex-col justify-start gap-1">
      <MiniStat
        label="Active wallets"
        value={hasWalletCounts ? full(wallets.activeWallets) : "—"}
        accent="text-cyan"
      />
      <MiniStat
        label="Notional lifetime"
        value={`$${usdc(wallets.notionalLifetimeUsdc)}`}
        accent="text-up"
      />
      <MiniStat
        label="Notional 24h"
        value={`$${usdc(wallets.notional24hUsdc)}`}
        accent="text-up"
      />
      <MiniStat
        label="Open positions"
        value={hasWalletCounts ? full(wallets.openPositions) : "—"}
      />
    </div>
  );
}
