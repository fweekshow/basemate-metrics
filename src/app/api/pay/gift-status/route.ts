import { NextRequest, NextResponse } from "next/server";

import { getPayAgent, payAgentHosts } from "@/lib/pay-agents";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TOKEN_RE = /^[a-f0-9]{21}$/i;

/** Proxy gift status for /pay/success (claim URL + labels). */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("s")?.trim() ?? "";
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Missing or invalid payment session." }, { status: 400 });
  }

  if (payAgentHosts().length === 0) {
    return NextResponse.json({ error: "Gift status API is not configured." }, { status: 500 });
  }

  const endpoint = `/api/agent/gift-status?token=${encodeURIComponent(token)}`;
  const result = await getPayAgent(endpoint);
  if (!result) {
    return NextResponse.json({ error: "Could not load gift status." }, { status: 503 });
  }
  return NextResponse.json(result.data, { status: result.status, headers: { "cache-control": "no-store" } });
}
