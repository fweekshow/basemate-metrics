import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TOKEN_RE = /^[a-f0-9]{21}$/i;

function agentHost(): string | undefined {
  return (
    process.env.CHANNELS_API_HOST?.trim() ||
    process.env.IMESSAGE_PORTFOLIO_API_HOST?.trim() ||
    process.env.AGENT_API_HOST?.trim() ||
    undefined
  );
}

/**
 * Record an onramp deposit after Coinbase reports success on basemate.app/pay.
 * The pay page has no dashboard auth cookie, so we identify the user from the
 * short-lived fund session token Basemate sent in chat.
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

  const host = agentHost();
  if (!host) {
    return NextResponse.json(
      { error: "Funding recorder is not configured (set AGENT_API_HOST)." },
      { status: 500 },
    );
  }

  const endpoint = new URL("/api/agent/record-funding-session", host.replace(/\/$/, ""));
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sessionToken,
        amount: body?.amount,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Couldn't reach the funding recorder.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 },
    );
  }
}
