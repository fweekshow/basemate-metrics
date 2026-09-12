import { NextRequest, NextResponse } from "next/server";

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
    return NextResponse.json({ error: "iStonk gift status API is not configured." }, { status: 500 });
  }

  const endpoint = new URL("/api/agent/gift-status", host.replace(/\/$/, ""));
  endpoint.searchParams.set("token", token);

  try {
    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load gift status." },
      { status: 503 },
    );
  }
}
