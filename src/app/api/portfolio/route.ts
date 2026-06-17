import { NextRequest, NextResponse } from "next/server";

import type { PortfolioPayload } from "@/lib/portfolio-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const host = process.env.AGENT_API_HOST?.trim();
  if (!host) {
    return NextResponse.json(
      {
        error: "AGENT_API_HOST is not configured",
        detail: "Set AGENT_API_HOST to your basemate core API URL.",
      },
      { status: 500 },
    );
  }

  const user = req.nextUrl.searchParams.get("user") ?? "";
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!user || !token) {
    return NextResponse.json({ error: "Missing user or token" }, { status: 400 });
  }

  const endpoint = new URL("/api/agent/portfolio", host.replace(/\/$/, ""));
  endpoint.searchParams.set("user", user);
  endpoint.searchParams.set("token", token);

  try {
    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    const body = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: body?.error ?? `Upstream responded ${res.status}` },
        { status: res.status === 401 || res.status === 404 ? res.status : 502 },
      );
    }

    return NextResponse.json(body as PortfolioPayload, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to reach portfolio API",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 },
    );
  }
}
