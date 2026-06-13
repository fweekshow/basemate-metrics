"use client";

import { Area, AreaChart } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartMount } from "./chart-mount";

type Accent = "primary" | "cyan" | "up" | "down" | "violet" | "amber";

const accentText: Record<Accent, string> = {
  primary: "text-primary",
  cyan: "text-cyan",
  up: "text-up",
  down: "text-down",
  violet: "text-violet",
  amber: "text-amber",
};

const accentStroke: Record<Accent, string> = {
  primary: "var(--primary)",
  cyan: "var(--cyan)",
  up: "var(--up)",
  down: "var(--down)",
  violet: "var(--violet)",
  amber: "var(--amber)",
};

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  right,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "relative flex flex-col overflow-hidden rounded-lg border border-border bg-card/70 backdrop-blur-sm",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="font-mono text-[13px] font-medium tracking-wide text-foreground">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        {right}
      </header>
      <div className={cn("min-h-0 min-w-0 flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function DeltaPill({ value }: { value: number }) {
  if (!value) {
    return (
      <span className="font-mono text-[11px] text-muted-foreground">±0</span>
    );
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-[11px]",
        up ? "text-up" : "text-down",
      )}
    >
      {up ? (
        <ArrowUpRight className="size-3" />
      ) : (
        <ArrowDownRight className="size-3" />
      )}
      {up ? "+" : ""}
      {value}
    </span>
  );
}

export function Sparkline({
  data,
  accent = "primary",
}: {
  data: number[];
  accent?: Accent;
}) {
  const series = data.map((v, i) => ({ i, v }));
  const id = `spark-${accent}`;
  return (
    <ChartMount className="h-full w-full" minHeight={28}>
      <AreaChart data={series} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentStroke[accent]} stopOpacity={0.45} />
              <stop offset="100%" stopColor={accentStroke[accent]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={accentStroke[accent]}
            strokeWidth={1.6}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
    </ChartMount>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = "primary",
  spark,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: Accent;
  spark?: number[];
  delta?: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card/70 px-3.5 pb-7 pt-3 backdrop-blur-sm transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between">
        <SectionLabel>{label}</SectionLabel>
        {Icon ? (
          <Icon className={cn("size-4 opacity-70", accentText[accent])} />
        ) : null}
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div
          className={cn(
            "font-mono text-2xl font-semibold leading-none tracking-tight tabular-nums",
            accentText[accent],
          )}
        >
          {value}
        </div>
        {delta !== undefined ? <DeltaPill value={delta} /> : null}
      </div>
      {sub ? (
        <div className="mt-1 truncate text-[11px] text-muted-foreground">
          {sub}
        </div>
      ) : null}
      {spark && spark.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 opacity-70">
          <Sparkline data={spark} accent={accent} />
        </div>
      ) : null}
    </div>
  );
}
