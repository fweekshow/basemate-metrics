import { NextRequest, NextResponse } from "next/server";

import { clientIpFromRequest, forwardClientIpHeaders } from "@/lib/client-ip";
import { payAgentHosts } from "@/lib/pay-agents";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TOKEN_RE = /^[a-f0-9]{21}$/i;

/** Client-refetchable fund session (same payload as server /pay materialization). */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("s")?.trim() ?? "";
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Missing or invalid payment session." }, { status: 400 });
  }

  const hosts = payAgentHosts();
  if (hosts.length === 0) {
    return NextResponse.json({ error: "Fund session API is not configured." }, { status: 500 });
  }

  const remint = req.nextUrl.searchParams.get("remint");
  const endUserIp = clientIpFromRequest(req);
  let lastStatus = 503;
  let lastData: Record<string, unknown> = { error: "Could not load fund session." };

  for (const agent of hosts) {
    const endpoint = new URL("/api/agent/fund-session", `${agent.host}/`);
    endpoint.searchParams.set("token", token);
    if (remint === "1" || remint === "true") endpoint.searchParams.set("remint", "1");
    try {
      const res = await fetch(endpoint, {
        cache: "no-store",
        headers: { accept: "application/json", ...forwardClientIpHeaders(endUserIp) },
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      lastStatus = res.status;
      lastData = data;
      if (res.ok) {
        return NextResponse.json(data, { status: 200, headers: { "cache-control": "no-store" } });
      }
    } catch (err) {
      lastData = { error: err instanceof Error ? err.message : "Could not load fund session." };
    }
  }

  return NextResponse.json(lastData, { status: lastStatus, headers: { "cache-control": "no-store" } });
}
