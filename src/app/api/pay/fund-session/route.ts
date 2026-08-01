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

/** Client-refetchable fund session (same payload as server /pay materialization). */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("s")?.trim() ?? "";
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Missing or invalid payment session." }, { status: 400 });
  }

  const host = agentHost();
  if (!host) {
    return NextResponse.json({ error: "Fund session API is not configured." }, { status: 500 });
  }

  const endpoint = new URL("/api/agent/fund-session", host.replace(/\/$/, ""));
  endpoint.searchParams.set("token", token);

  try {
    const res = await fetch(endpoint, { cache: "no-store", headers: { accept: "application/json" } });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load fund session." },
      { status: 503 },
    );
  }
}
