"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActivityWindow, ButtonAction, MetricSample } from "@/lib/types";
import { compact, full } from "@/lib/format";
import { ChartMount } from "./chart-mount";

const C = {
  primary: "var(--primary)",
  cyan: "var(--cyan)",
  up: "var(--up)",
  violet: "var(--violet)",
  amber: "var(--amber)",
  down: "var(--down)",
};

function TipBox({
  rows,
}: {
  rows: { label: string; value: string; color?: string }[];
}) {
  return (
    <div className="rounded-md border border-border bg-popover/95 px-3 py-2 font-mono text-[11px] shadow-xl backdrop-blur">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 whitespace-nowrap">
          {r.color ? (
            <span
              className="size-2 rounded-[2px]"
              style={{ background: r.color }}
            />
          ) : null}
          <span className="text-muted-foreground">{r.label}</span>
          <span className="ml-auto tabular-nums text-foreground">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Live message trend (poll history) ---------- */
export function LiveTrend({ samples }: { samples: MetricSample[] }) {
  const data = samples.map((s, i) => ({
    i,
    messages: s.messages24h,
    clicks: s.buttonClicks24h,
  }));

  return (
    <ChartMount className="h-full min-h-[160px] w-full" minHeight={160}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -6 }}>
          <defs>
            <linearGradient id="lt-msg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.cyan} stopOpacity={0.4} />
              <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lt-clk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.primary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" tickLine={false} axisLine={false} hide />
          <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={compact} />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TipBox
                  rows={[
                    {
                      label: "messages 24h",
                      value: full(Number(payload[0]?.value ?? 0)),
                      color: C.cyan,
                    },
                    {
                      label: "clicks 24h",
                      value: full(Number(payload[1]?.value ?? 0)),
                      color: C.primary,
                    },
                  ]}
                />
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="messages"
            stroke={C.cyan}
            strokeWidth={1.8}
            fill="url(#lt-msg)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke={C.primary}
            strokeWidth={1.8}
            fill="url(#lt-clk)"
            isAnimationActive={false}
          />
        </AreaChart>
    </ChartMount>
  );
}

/* ---------- 24h vs 7d activity comparison ---------- */
export function ActivityComparison({
  last24h,
  last7d,
}: {
  last24h: ActivityWindow;
  last7d: ActivityWindow;
}) {
  const data = [
    { k: "Messages", "24h": last24h.messages, "7d": last7d.messages },
    { k: "Joins", "24h": last24h.memberJoins, "7d": last7d.memberJoins },
    { k: "Leaves", "24h": last24h.memberLeaves, "7d": last7d.memberLeaves },
    {
      k: "Active",
      "24h": last24h.uniqueActiveUsers,
      "7d": last7d.uniqueActiveUsers,
    },
  ];
  return (
    <ChartMount className="h-full min-h-[160px] w-full" minHeight={160}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -6 }} barGap={4}>
          <XAxis dataKey="k" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={compact} />
          <Tooltip
            cursor={{ fill: "var(--accent)", opacity: 0.4 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TipBox
                  rows={[
                    { label: String(label), value: "" },
                    {
                      label: "7d",
                      value: full(Number(payload.find((p) => p.dataKey === "7d")?.value ?? 0)),
                      color: C.violet,
                    },
                    {
                      label: "24h",
                      value: full(Number(payload.find((p) => p.dataKey === "24h")?.value ?? 0)),
                      color: C.cyan,
                    },
                  ]}
                />
              ) : null
            }
          />
          <Bar dataKey="7d" fill={C.violet} radius={[3, 3, 0, 0]} maxBarSize={26} isAnimationActive={false} />
          <Bar dataKey="24h" fill={C.cyan} radius={[3, 3, 0, 0]} maxBarSize={26} isAnimationActive={false} />
        </BarChart>
    </ChartMount>
  );
}

/* ---------- Top button actions ---------- */
export function TopActions({ actions }: { actions: ButtonAction[] }) {
  const top = actions.slice(0, 12);
  const max = Math.max(1, ...top.map((a) => a.count));
  return (
    <div className="flex h-full flex-col justify-between gap-1 overflow-y-auto">
      {top.map((a) => (
        <div key={a.action} className="group flex items-center gap-3">
          <div className="w-36 shrink-0 truncate font-mono text-[11px] text-muted-foreground group-hover:text-foreground">
            {a.action}
          </div>
          <div className="relative h-3 flex-1 overflow-hidden rounded-[3px] bg-secondary/60">
            <div
              className="absolute inset-y-0 left-0 rounded-[3px] bg-gradient-to-r from-primary/40 to-cyan/80"
              style={{ width: `${(a.count / max) * 100}%` }}
            />
          </div>
          <div className="w-7 shrink-0 text-right font-mono text-[11px] tabular-nums text-foreground">
            {a.count}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Success / fail ratio donut ---------- */
export function RatioDonut({
  success,
  failed,
  label,
}: {
  success: number;
  failed: number;
  label: string;
}) {
  const total = success + failed;
  const rate = total ? Math.round((success / total) * 100) : 0;
  const data = [
    { name: "success", value: success, color: C.up },
    { name: "failed", value: Math.max(failed, total === 0 ? 1 : 0), color: C.down },
  ];
  return (
    <div className="flex h-full items-center gap-4">
      <div className="relative size-20 shrink-0">
        <ChartMount className="size-full" minHeight={80}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={27}
              outerRadius={38}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartMount>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {rate}%
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            ok
          </span>
        </div>
      </div>
      <div className="min-w-0 space-y-1.5 font-mono text-[12px]">
        <div className="truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-[2px] bg-up" />
          <span className="text-muted-foreground">success</span>
          <span className="ml-2 tabular-nums text-foreground">{full(success)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-[2px] bg-down" />
          <span className="text-muted-foreground">failed</span>
          <span className="ml-2 tabular-nums text-foreground">{full(failed)}</span>
        </div>
      </div>
    </div>
  );
}
