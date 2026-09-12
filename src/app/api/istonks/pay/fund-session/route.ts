import { NextRequest, NextResponse } from "next/server";

import { clientIpFromRequest, forwardClientIpHeaders } from "@/lib/client-ip";
import { isFundSessionToken, istonksApiHost } from "@/lib/istonks-pay";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("s")?.trim() ?? "";
  if (!isFundSessionToken(token)) {
    return NextResponse.json({ error: "Missing or invalid payment session." }, { status: 400 });
  }

  const host = istonksApiHost();
  if (!host) {
    return NextResponse.json({ error: "iStonk fund session API is not configured." }, { status: 500 });
  }

  const endpoint = new URL("/api/agent/fund-session", host.replace(/\/$/, ""));
  endpoint.searchParams.set("token", token);

  try {
    const endUserIp = clientIpFromRequest(req);
    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: { accept: "application/json", ...forwardClientIpHeaders(endUserIp) },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load fund session." },
      { status: 503 },
    );
  }
}
