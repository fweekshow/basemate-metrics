"use client";

import { useCallback, useEffect, useState } from "react";

import type { PortfolioPayload } from "@/lib/portfolio-types";

export type PortfolioStatus = "loading" | "ready" | "error";

export interface UsePortfolioResult {
  data: PortfolioPayload | null;
  status: PortfolioStatus;
  error: string | null;
  refresh: () => void;
}

export function usePortfolio(user: string, token: string): UsePortfolioResult {
  const hasLinkDetails = Boolean(user && token);
  const [data, setData] = useState<PortfolioPayload | null>(null);
  const [status, setStatus] = useState<PortfolioStatus>(hasLinkDetails ? "loading" : "error");
  const [error, setError] = useState<string | null>(
    hasLinkDetails ? null : "Missing portfolio link details",
  );

  const refresh = useCallback(() => {
    async function load() {
      try {
        setStatus("loading");
        const params = new URLSearchParams({ user, token });
        const res = await fetch(`/api/portfolio?${params.toString()}`, { cache: "no-store" });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
        setData(body as PortfolioPayload);
        setError(null);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    }
    void load();
  }, [user, token]);

  useEffect(() => {
    if (!hasLinkDetails) return;
    refresh();
  }, [hasLinkDetails, refresh]);

  return { data, status, error, refresh };
}
