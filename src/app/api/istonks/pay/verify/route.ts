import { NextRequest, NextResponse } from "next/server";

import { clientIpFromRequest, forwardClientIpHeaders } from "@/lib/client-ip";
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
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const tosAccepted = body?.tosAccepted === true;

  if (!isFundSessionToken(sessionToken)) {
    return NextResponse.json({ error: "Missing or invalid payment session." }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (!tosAccepted) {
    return NextResponse.json({ error: "Accept the terms to continue." }, { status: 400 });
  }

  const host = istonksApiHost();
  if (!host) {
    return NextResponse.json({ error: "iStonk verify API is not configured." }, { status: 500 });
  }

  const endpoint = new URL("/api/agent/fund-session/verify", host.replace(/\/$/, ""));
  try {
    const endUserIp = clientIpFromRequest(req);
    const res = await fetch(endpoint, {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...forwardClientIpHeaders(endUserIp),
      },
      body: JSON.stringify({ sessionToken, email, tosAccepted: true }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not verify checkout." },
      { status: 503 },
    );
  }
}
