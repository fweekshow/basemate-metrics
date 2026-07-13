import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TOKEN_RE = /^[a-f0-9]{32}$/i;

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
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  if (!TOKEN_RE.test(token) || !userId || !address) {
    return NextResponse.json({ error: "Missing or invalid delegation lookup details." }, { status: 400 });
  }

  const host = agentHost();
  if (!host) {
    return NextResponse.json(
      { error: "Wallet authorization service is not configured (set AGENT_API_HOST)." },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(new URL("/api/wallet/delegation", host.replace(/\/$/, "")), {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ token, userId, address }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: res.status,
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Couldn't reach the wallet authorization service.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 },
    );
  }
}
