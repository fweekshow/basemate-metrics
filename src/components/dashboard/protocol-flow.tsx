import { ArrowDownUp, Landmark, Layers, Rocket, TrendingUp } from "lucide-react";
import type { AnalyticsPayload, ProtocolFlowMetric } from "@/lib/types";
import { compact, full, usdc } from "@/lib/format";
import { Panel } from "./primitives";

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

function YieldProtocolPanel({
  name,
  metric,
}: {
  name: string;
  metric: ProtocolFlowMetric;
}) {
  return (
    <Panel title={name} subtitle="basemate engagement + confirmed supply">
      <div className="flex h-full flex-col justify-start gap-1">
        <MiniStat label="Users" value={full(metric.users)} accent="text-cyan" />
        <MiniStat label="Clicks" value={full(metric.clicks)} />
        <MiniStat label="Clicks 24h" value={full(metric.clicks24h)} />
        <MiniStat
          label="Confirmed USDC"
          value={`$${usdc(metric.confirmedVolumeUsdc)}`}
          accent="text-up"
        />
        <MiniStat
          label="USDC 24h"
          value={`$${usdc(metric.volume24hUsdc)}`}
          accent="text-up"
        />
        <MiniStat label="Tx count" value={full(metric.confirmedTxCount)} />
      </div>
    </Panel>
  );
}

export function ProtocolFlowBand({
  flow,
}: {
  flow: NonNullable<AnalyticsPayload["protocolFlow"]>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-0.5">
        <ArrowDownUp className="size-3.5 text-primary" />
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Protocol flow through basemate
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <YieldProtocolPanel name="Moonwell" metric={flow.moonwell} />
        <YieldProtocolPanel name="Morpho" metric={flow.morpho} />
        <YieldProtocolPanel name="Aave" metric={flow.aave} />
        <Panel title="Avantis" subtitle="perps + copy trading">
          <div className="flex h-full flex-col justify-start gap-1">
            <MiniStat
              label="Users"
              value={full(flow.avantis.users)}
              accent="text-cyan"
            />
            <MiniStat label="Clicks" value={full(flow.avantis.clicks)} />
            <MiniStat label="Clicks 24h" value={full(flow.avantis.clicks24h)} />
            <MiniStat
              label="Direct lifetime"
              value={`$${usdc(flow.avantis.confirmedVolumeUsdc)}`}
              accent="text-up"
            />
            <MiniStat
              label="Direct 24h"
              value={`$${usdc(flow.avantis.volume24hUsdc)}`}
              accent="text-up"
            />
            <MiniStat
              label="Copy lifetime"
              value={`$${usdc(flow.avantis.copyVolumeUsdc)}`}
              accent="text-up"
            />
            <MiniStat
              label="Copy 24h"
              value={`$${usdc(flow.avantis.copyVolume24hUsdc)}`}
            />
          </div>
        </Panel>
        <Panel title="Bankr" subtitle="launches + DexScreener market stats">
          <div className="flex h-full flex-col justify-start gap-1">
            <MiniStat
              label="Launches lifetime"
              value={full(flow.bankr.totalLaunches)}
              accent="text-amber"
            />
            <MiniStat label="Launches 24h" value={full(flow.bankr.launches24h)} />
            <MiniStat
              label="Lifetime volume"
              value={`$${compact(flow.bankr.tradingVolumeLifetimeUsdc ?? 0)}`}
              accent="text-up"
            />
            <MiniStat
              label="Volume 24h"
              value={`$${usdc(flow.bankr.tradingVolume24hUsdc)}`}
              accent="text-up"
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function ProtocolFlowPlaceholder() {
  return (
    <Panel
      title="Protocol Flow"
      subtitle="deploy updated agent API to enable per-protocol metrics"
      className="border-dashed"
    >
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 text-center">
        <div className="flex gap-3 text-muted-foreground">
          <Landmark className="size-4" />
          <Layers className="size-4" />
          <TrendingUp className="size-4" />
          <Rocket className="size-4" />
        </div>
        <p className="font-mono text-[12px] text-muted-foreground">
          Moonwell · Morpho · Aave · Avantis · Bankr metrics appear after the
          agent API ships protocolFlow in /api/agent/analytics
        </p>
      </div>
    </Panel>
  );
}
