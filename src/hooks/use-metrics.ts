"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyticsPayload, MetricSample } from "@/lib/types";

const POLL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 10000);
const MAX_SAMPLES = 60;

export type Status = "connecting" | "live" | "error";

export interface UseMetrics {
  data: AnalyticsPayload | null;
  samples: MetricSample[];
  status: Status;
  error: string | null;
  lastUpdated: number | null;
  pollMs: number;
  refresh: () => void;
}

export function useMetrics(): UseMetrics {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [samples, setSamples] = useState<MetricSample[]>([]);
  const [status, setStatus] = useState<Status>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tick = useCallback(async () => {
    try {
      const res = await fetch("/api/metrics", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);

      const payload = body as AnalyticsPayload;
      setData(payload);
      setStatus("live");
      setError(null);
      setLastUpdated(Date.now());
      setSamples((prev) => {
        const next: MetricSample = {
          t: Date.now(),
          messages24h: payload.activity.last24h.messages,
          activeUsers24h: payload.activity.last24h.uniqueActiveUsers,
          buttonClicks24h: payload.engagement.buttonClicksLast24h,
          totalUsers: payload.users.total,
        };
        return [...prev, next].slice(-MAX_SAMPLES);
      });
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await tick();
      schedule();
    }, POLL_MS);
  }, [tick]);

  const refresh = useCallback(() => {
    void tick();
    schedule();
  }, [tick, schedule]);

  useEffect(() => {
    void tick();
    schedule();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [tick, schedule]);

  return { data, samples, status, error, lastUpdated, pollMs: POLL_MS, refresh };
}
