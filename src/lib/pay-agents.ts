import { clientIpFromRequest, forwardClientIpHeaders } from "@/lib/client-ip";
import { istonksApiHost } from "@/lib/istonks-pay";

export type PayAgentKind = "basemate" | "istonk";

export function basemateAgentHost(): string | undefined {
  return (
    process.env.CHANNELS_API_HOST?.trim() ||
    process.env.IMESSAGE_PORTFOLIO_API_HOST?.trim() ||
    process.env.AGENT_API_HOST?.trim() ||
    undefined
  );
}

export function payAgentHosts(): { kind: PayAgentKind; host: string }[] {
  const seen = new Set<string>();
  const hosts: { kind: PayAgentKind; host: string }[] = [];
  for (const [kind, raw] of [
    ["basemate", basemateAgentHost()],
    ["istonk", istonksApiHost()],
  ] as const) {
    const host = raw?.replace(/\/$/, "");
    if (!host || seen.has(host)) continue;
    seen.add(host);
    hosts.push({ kind, host });
  }
  return hosts;
}

export async function fetchFundSessionFromPayAgents(
  token: string,
  request?: Request,
): Promise<{ kind: PayAgentKind; data: Record<string, unknown> } | null> {
  const endUserIp = request ? clientIpFromRequest(request) : undefined;
  for (const agent of payAgentHosts()) {
    const endpoint = new URL("/api/agent/fund-session", `${agent.host}/`);
    endpoint.searchParams.set("token", token);
    try {
      const res = await fetch(endpoint, {
        cache: "no-store",
        headers: { accept: "application/json", ...forwardClientIpHeaders(endUserIp) },
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok) return { kind: agent.kind, data };
    } catch {
      // try the other host
    }
  }
  return null;
}

export async function postPayAgent(
  path: string,
  body: unknown,
): Promise<{ kind: PayAgentKind; status: number; data: Record<string, unknown> } | null> {
  let last: { kind: PayAgentKind; status: number; data: Record<string, unknown> } | null = null;
  for (const agent of payAgentHosts()) {
    try {
      const res = await fetch(new URL(path, `${agent.host}/`), {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      last = { kind: agent.kind, status: res.status, data };
      if (res.ok || (res.status !== 404 && res.status < 500)) return last;
    } catch {
      // try the other host
    }
  }
  return last;
}

export async function getPayAgent(
  path: string,
): Promise<{ kind: PayAgentKind; status: number; data: Record<string, unknown> } | null> {
  let last: { kind: PayAgentKind; status: number; data: Record<string, unknown> } | null = null;
  for (const agent of payAgentHosts()) {
    try {
      const res = await fetch(new URL(path, `${agent.host}/`), {
        cache: "no-store",
        headers: { accept: "application/json" },
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      last = { kind: agent.kind, status: res.status, data };
      if (res.ok) return last;
    } catch {
      // try the other host
    }
  }
  return last;
}
