"use client";

import { Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status } from "@/hooks/use-metrics";

function StatusDot({ status }: { status: Status }) {
  const map = {
    live: { color: "bg-up", ring: "animate-pulse-ring", text: "LIVE" },
    connecting: { color: "bg-amber", ring: "", text: "SYNC" },
    error: { color: "bg-down", ring: "", text: "DOWN" },
  } as const;
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-2 rounded-full", s.color, s.ring)} />
      <span
        className={cn(
          "font-mono text-[11px] font-medium tracking-[0.2em]",
          status === "live" && "text-up",
          status === "connecting" && "text-amber",
          status === "error" && "text-down",
        )}
      >
        {s.text}
      </span>
    </span>
  );
}

export function Header({
  status,
  instanceId,
  lastUpdated,
  pollMs,
  onRefresh,
}: {
  status: Status;
  instanceId?: string;
  lastUpdated: number | null;
  pollMs: number;
  onRefresh: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-md border border-primary/40 bg-primary/10 glow-primary">
            <Activity className="size-4 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-sm font-semibold tracking-wide text-foreground">
                basemate
                <span className="text-muted-foreground"> / metrics</span>
              </h1>
              <span className="rounded border border-border px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {instanceId ?? "—"}
              </span>
            </div>
            <a
              href="https://x.com/basemateagent"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-cyan"
            >
              @basemateagent ↗
            </a>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-5">
          <StatusDot status={status} />
          <div className="hidden font-mono text-[11px] text-muted-foreground sm:block">
            poll {Math.round(pollMs / 1000)}s
            {lastUpdated ? (
              <span className="ml-3 text-foreground/70">
                upd {new Date(lastUpdated).toISOString().slice(11, 19)}Z
              </span>
            ) : null}
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <RefreshCw className="size-3" />
            refresh
          </button>
        </div>
      </div>
    </header>
  );
}
