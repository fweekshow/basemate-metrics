import { NextRequest, NextResponse } from "next/server";

import { isFundSessionToken, istonksApiHost } from "@/lib/istonks-pay";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sessionToken =
    typeof body?.sessionToken === "string"
      ? body.sessionToken.trim()
      : typeof body?.s === "string"
        ? body.s.trim()
        : "";

  if (!isFundSessionToken(sessionToken)) {
    return NextResponse.json({ error: "Missing or invalid payment session." }, { status: 400 });
  }

  const host = istonksApiHost();
  if (!host) {
    return NextResponse.json({ error: "iStonk funding recorder is not configured." }, { status: 500 });
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
