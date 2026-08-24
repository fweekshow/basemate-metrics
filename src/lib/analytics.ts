import { unstable_cache } from "next/cache";
import { resolveBankrLifetimeVolumeUsdc } from "@/lib/bankr-lifetime";
import type { AnalyticsPayload } from "@/lib/types";

async function fetchAnalytics(): Promise<AnalyticsPayload | null> {
  const host = process.env.AGENT_API_HOST?.trim();
  if (!host) return null;

  const endpoint = `${host.replace(/\/$/, "")}/api/agent/analytics`;

  try {
    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as AnalyticsPayload;

    const lifetime = await resolveBankrLifetimeVolumeUsdc().catch(() => null);
    if (lifetime != null && data.protocolFlow?.bankr) {
      data.protocolFlow.bankr.tradingVolumeLifetimeUsdc = lifetime;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Cached analytics fetch — revalidates once every 24 h on the server.
 * Calling this from a page does NOT force dynamic rendering the way
 * `headers()` does, so the page can be ISR-cached between revalidations.
 * Force a manual refresh by revalidating the "analytics" tag.
 */
export const getCachedAnalytics = unstable_cache(fetchAnalytics, ["analytics"], {
  revalidate: 3_600, // 1 h
  tags: ["analytics"],
});
