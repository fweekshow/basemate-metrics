import { NextResponse } from "next/server";

import { agentHost } from "@/lib/app-session";

/**
 * Server-only bridge to the agent's public iStonks endpoints. Mirrors
 * `src/app/api/metrics/route.ts`: no caching, upstream failures surface as a
 * JSON error body rather than a thrown request, so pages can render an empty
 * state while the backend endpoints are still landing.
 */

export interface AgentJson {
  ok: boolean;
  status: number;
  data: unknown;
  endpoint: string;
  error?: string;
}

export async function fetchAgentJson(path: string): Promise<AgentJson> {
  const host = agentHost();
  if (!host) {
    return {
      ok: false,
      status: 500,
      data: null,
      endpoint: path,
      error:
        "AGENT_API_HOST is not configured. Set it in Railway Variables to your xmtp-agent URL, then redeploy.",
    };
  }

  const endpoint = `${host.replace(/\/$/, "")}${path}`;

  try {
    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    const data = await res.json().catch(() => null);
    return {
      ok: res.ok,
      status: res.status,
      data,
      endpoint,
      error: res.ok ? undefined : `Upstream responded ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 503,
      data: null,
      endpoint,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Turns an agent response into a proxy response. Upstream 404s (endpoint not
 * deployed yet) collapse to an empty payload with 200 so the client renders
 * "nothing here yet" instead of an error band.
 */
export function proxyResponse(result: AgentJson, emptyKey: string) {
  if (result.ok) {
    return NextResponse.json(result.data, { headers: { "cache-control": "no-store" } });
  }
  if (result.status === 404) {
    return NextResponse.json(
      { [emptyKey]: [], unavailable: true },
      { headers: { "cache-control": "no-store" } },
    );
  }
  return NextResponse.json(
    { error: result.error ?? "Failed to reach agent API", endpoint: result.endpoint },
    { status: result.status >= 500 ? 502 : result.status, headers: { "cache-control": "no-store" } },
  );
}
