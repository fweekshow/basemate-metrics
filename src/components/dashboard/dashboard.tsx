"use client";

import {
  Bell,
  Coins,
  Flame,
  MessageSquare,
  MousePointerClick,
  Rocket,
  Send,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useMetrics } from "@/hooks/use-metrics";
import type { MetricSample } from "@/lib/types";
import { compact, full, pct, usdc } from "@/lib/format";
import { Header } from "./header";
import {
  ActivityComparison,
  LiveTrend,
  RatioDonut,
  TopActions,
} from "./charts";
import { ProtocolFlowBand, ProtocolFlowPlaceholder } from "./protocol-flow";
import { Panel, SectionLabel, StatCard } from "./primitives";

type NumericSampleKey = {
  [K in keyof MetricSample]: MetricSample[K] extends number ? K : never;
}[keyof MetricSample];

function spark(samples: MetricSample[], key: NumericSampleKey): number[] {
  return samples.map((s) => s[key]);
}

function delta(samples: MetricSample[], key: NumericSampleKey): number {
  if (samples.length < 2) return 0;
  return samples[samples.length - 1][key] - samples[samples.length - 2][key];
}

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

export function Dashboard() {
  const { data, samples, status, error, lastUpdated, pollMs, refresh } =
    useMetrics();

  return (
    <div className="relative min-h-screen bg-grid">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
      <Header
        status={status}
        instanceId={data?.instanceId}
        lastUpdated={lastUpdated}
        pollMs={pollMs}
        onRefresh={refresh}
      />

      <main className="mx-auto max-w-[1400px] px-5 pt-6 pb-10">
        {!data && status !== "error" ? (
          <LoadingState />
        ) : !data && status === "error" ? (
          <ErrorState message={error} />
        ) : data ? (
          <div className="animate-ticker-in space-y-3">
            {status === "error" ? (
              <div className="rounded-md border border-down/40 bg-down/10 px-4 py-2 font-mono text-[12px] text-down">
                connection lost — showing last snapshot · {error}
              </div>
            ) : null}

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <StatCard
                label="Total Users"
                value={compact(data.users.total)}
                accent="primary"
                icon={Users}
                spark={spark(samples, "totalUsers")}
                sub={`${pct(data.users.withWallet, data.users.total)}% with wallet`}
              />
              <StatCard
                label="Messages Recv"
                value={full(data.users.messagesReceived)}
                accent="cyan"
                icon={MessageSquare}
                sub={`${full(data.activity.last24h.messages)} in last 24h`}
              />
              <StatCard
                label="Active 24h"
                value={full(data.activity.last24h.uniqueActiveUsers)}
                accent="up"
                icon={Sparkles}
                spark={spark(samples, "activeUsers24h")}
                delta={delta(samples, "activeUsers24h")}
                sub={`${full(data.activity.last7d.uniqueActiveUsers)} active in 7d`}
              />
              <StatCard
                label="Clicks 24h"
                value={compact(data.engagement.buttonClicksLast24h)}
                accent="violet"
                icon={MousePointerClick}
                spark={spark(samples, "buttonClicks24h")}
                delta={delta(samples, "buttonClicks24h")}
                sub={`${full(data.engagement.buttonClicksLifetime)} lifetime`}
              />
              <StatCard
                label="Token Launches"
                value={full(data.tokenLaunches.allTime.success)}
                accent="amber"
                icon={Rocket}
                sub={`+${data.tokenLaunches.last24h.success} 24h · ${data.tokenLaunches.allTime.failed} failed`}
              />
              <StatCard
                label="Recs Sent"
                value={full(data.recommendations.sent)}
                accent="cyan"
                icon={Send}
                sub={`+${data.recommendations.sentLast24h} 24h · ${data.recommendations.pending} pending`}
              />
            </div>

            {data.protocolFlow ? (
              <ProtocolFlowBand flow={data.protocolFlow} />
            ) : (
              <ProtocolFlowPlaceholder />
            )}

            {/* Middle bento band */}
            <div className="grid grid-cols-1 gap-3 lg:h-[310px] lg:grid-cols-12 lg:grid-rows-2">
              <Panel
                title="Live Throughput"
                subtitle="polled message & click volume (24h)"
                className="min-h-[200px] lg:col-span-6 lg:row-span-2"
                right={
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <Legend color="var(--cyan)" label="messages" />
                    <Legend color="var(--primary)" label="clicks" />
                  </div>
                }
              >
                {samples.length > 1 ? (
                  <LiveTrend samples={samples} />
                ) : (
                  <WaitingForSamples />
                )}
              </Panel>

              <Panel
                title="Activity · 24h vs 7d"
                subtitle="messages · joins · leaves · active"
                className="min-h-[200px] lg:col-span-3 lg:row-span-2"
                right={
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <Legend color="var(--cyan)" label="24h" />
                    <Legend color="var(--violet)" label="7d" />
                  </div>
                }
              >
                <ActivityComparison
                  last24h={data.activity.last24h}
                  last7d={data.activity.last7d}
                />
              </Panel>

              <Panel
                title="Token Launches"
                subtitle={`24h · ${data.tokenLaunches.last24h.success} ok / ${data.tokenLaunches.last24h.failed} failed`}
                className="lg:col-span-3 lg:row-span-1"
                bodyClassName="p-3"
              >
                <RatioDonut
                  label="launch success"
                  success={data.tokenLaunches.allTime.success}
                  failed={data.tokenLaunches.allTime.failed}
                />
              </Panel>
              <Panel
                title="Recommendations"
                className="lg:col-span-3 lg:row-span-1"
                bodyClassName="p-3"
              >
                <RatioDonut
                  label="delivery rate"
                  success={data.recommendations.sent}
                  failed={data.recommendations.failed}
                />
              </Panel>
            </div>

            {/* Bottom band */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
              <Panel
                title="Top Button Actions"
                subtitle="most-clicked agent actions"
                className="lg:col-span-4 max-h-[250px] overflow-y-auto"
              >
                <TopActions actions={data.engagement.topButtonActions} />
              </Panel>

              <Panel title="Groups" className="lg:col-span-2">
                <div className="flex h-full flex-col justify-start gap-1">
                  <MiniStat label="Agent in" value={full(data.groups.agentInGroup)} accent="text-up" />
                  <MiniStat label="Total known" value={full(data.groups.totalKnown)} />
                  <MiniStat label="Members" value={full(data.groups.totalMembersInAgentGroups)} />
                  <MiniStat label="Msgs observed" value={full(data.groups.messagesObservedInAgentGroups)} />
                  <MiniStat label="Boosted active" value={full(data.groups.boostedActive)} />
                </div>
              </Panel>

              {data.legacyGroups ? (
                <Panel title="Legacy Groups" className="lg:col-span-2">
                  <div className="flex h-full flex-col justify-start gap-1">
                    <MiniStat
                      label="Active groups"
                      value={full(data.legacyGroups.activeGroups)}
                      accent="text-cyan"
                    />
                    <MiniStat
                      label="Total messages"
                      value={compact(data.legacyGroups.totalMessages)}
                    />
                    <MiniStat
                      label="Mentioned msgs"
                      value={full(data.legacyGroups.totalMentionedMessages)}
                    />
                  </div>
                </Panel>
              ) : null}

              <Panel title="Keywords / Ads" className="lg:col-span-2">
                <div className="flex h-full flex-col justify-start gap-1">
                  <MiniStat label="Active" value={full(data.keywords.active)} accent="text-amber" />
                  <MiniStat label="Impressions" value={full(data.keywords.totalImpressions)} />
                  <MiniStat label="Impr. 24h" value={full(data.keywords.impressionsLast24h)} />
                  <MiniStat label="Spent USDC" value={`$${usdc(data.keywords.totalSpentUsdc)}`} accent="text-up" />
                </div>
              </Panel>

              <Panel title="Revenue & Outreach" className="lg:col-span-2">
                <div className="flex h-full flex-col justify-start gap-1">
                  <MiniStat label="Boost revenue" value={`$${usdc(data.boost.totalRevenueUsdc)}`} accent="text-up" />
                  <MiniStat label="Boost payments" value={full(data.boost.paymentCount)} />
                  <MiniStat label="Copy-trade subs" value={full(data.copyTradeSubscriptions)} />
                  <MiniStat label="Proactive DMs" value={full(data.users.proactiveDmsSent)} />
                  <MiniStat label="Reminders" value={full(data.users.remindersCreated)} />
                </div>
              </Panel>
            </div>

            <Footer generatedAt={data.generatedAt} />
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="size-2 rounded-[2px]" style={{ background: color }} />
      {label}
    </span>
  );
}

function WaitingForSamples() {
  return (
    <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 text-center">
      <Flame className="size-5 animate-pulse text-primary" />
      <p className="font-mono text-[12px] text-muted-foreground">
        collecting live samples… trend appears after the next poll
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-lg border border-border bg-card/50"
        />
      ))}
      <div className="col-span-full mt-2 text-center font-mono text-[12px] text-muted-foreground">
        <Coins className="mx-auto mb-2 size-5 animate-spin text-primary" />
        establishing uplink to agent API…
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string | null }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-lg border border-down/40 bg-down/5 p-6 text-center">
      <Bell className="mx-auto mb-3 size-6 text-down" />
      <h2 className="font-mono text-sm font-semibold text-down">
        agent API unreachable
      </h2>
      <p className="mt-2 font-mono text-[12px] text-muted-foreground">
        {message ?? "no response from upstream"}
      </p>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        check <span className="text-foreground">AGENT_API_HOST</span> in your
        env and confirm the agent is running.
      </p>
    </div>
  );
}

function Footer({ generatedAt }: { generatedAt: string }) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
      <SectionLabel>
        snapshot generated {new Date(generatedAt).toISOString().slice(0, 19)}Z
      </SectionLabel>
      <SectionLabel>
        <Wallet className="mr-1 inline size-3" />
        basemate metrics · on-chain agent telemetry
      </SectionLabel>
    </footer>
  );
}
