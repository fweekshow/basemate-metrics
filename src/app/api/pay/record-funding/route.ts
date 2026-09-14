import { NextRequest, NextResponse } from "next/server";

import { payAgentHosts, postPayAgent } from "@/lib/pay-agents";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TOKEN_RE = /^[a-f0-9]{21}$/i;

/**
 * Record an onramp deposit after Coinbase reports success on basemate.app/pay.
 * Tries the Basemate agent first, then the iStonk agent — iMessage fund
 * sessions for stocks and Bitrefill live on ISTONKS_API_HOST.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sessionToken =
    typeof body?.sessionToken === "string"
      ? body.sessionToken.trim()
      : typeof body?.s === "string"
        ? body.s.trim()
        : "";

  if (!TOKEN_RE.test(sessionToken)) {
    return NextResponse.json({ error: "Missing or invalid payment session." }, { status: 400 });
  }

  if (payAgentHosts().length === 0) {
    return NextResponse.json(
      { error: "Funding recorder is not configured (set AGENT_API_HOST or ISTONKS_API_HOST)." },
      { status: 500 },
    );
  }

  const result = await postPayAgent("/api/agent/record-funding-session", {
    sessionToken,
    amount: body?.amount,
  });
  if (!result) {
    return NextResponse.json({ error: "Couldn't reach the funding recorder." }, { status: 503 });
  }
  return NextResponse.json(result.data, { status: result.status, headers: { "cache-control": "no-store" } });
}
