import { NextRequest, NextResponse } from "next/server";

import { agentHost, setAppSession, clearAppSession } from "@/lib/app-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/**
 * POST /api/app/session — verify a SIWE signature from the embedded wallet (via
 * the agent), then set an httpOnly session cookie. Body: { address, message, signature }.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const address = typeof body?.address === "string" ? body.address : "";
  const message = typeof body?.message === "string" ? body.message : "";
  const signature = typeof body?.signature === "string" ? body.signature : "";
  if (!address || !message || !signature) {
    return NextResponse.json({ error: "Missing address, message, or signature." }, { status: 400 });
  }

  const host = agentHost();
  if (!host) {
    return NextResponse.json({ error: "Sign-in is not configured (set AGENT_API_HOST)." }, { status: 500 });
  }

  try {
    const res = await fetch(new URL("/api/agent/app/session", host.replace(/\/$/, "")), {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ address, message, signature }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data?.error ?? "Sign-in failed." }, { status: res.status });
    }
    await setAppSession({ user: data.user, token: data.token, address: data.address });
    return NextResponse.json({ ok: true, address: data.address });
  } catch (err) {
    return NextResponse.json(
      { error: "Couldn't reach the sign-in service.", detail: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }
}

export async function DELETE() {
  await clearAppSession();
  return NextResponse.json({ ok: true });
}
