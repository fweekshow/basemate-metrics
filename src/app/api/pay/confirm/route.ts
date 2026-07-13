import { NextRequest, NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TOKEN_RE = /^[a-f0-9]{32}$/i;

/**
 * Proxy to the agent's POST /api/pay/confirm. Embedded-wallet transactions are
 * signed server-side via the user's delegation, which needs the CDP wallet
 * secret — that lives in the agent, not this Next app. So we forward the token
 * and let the agent execute.
 */
function agentHost(): string | undefined {
  return (
    process.env.IMESSAGE_PORTFOLIO_API_HOST?.trim() ||
    process.env.AGENT_API_HOST?.trim() ||
    undefined
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Missing or invalid confirmation token." }, { status: 400 });
  }
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to confirm this transaction.", requiresAuth: true },
      { status: 401 },
    );
  }

  const host = agentHost();
  if (!host) {
    return NextResponse.json(
      { error: "Confirmation service is not configured (set AGENT_API_HOST)." },
      { status: 500 },
    );
  }

  const endpoint = new URL("/api/pay/confirm", host.replace(/\/$/, ""));
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        token,
        user: session.user,
        sessionToken: session.token,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: "Couldn't reach the confirmation service.", detail: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }
}
