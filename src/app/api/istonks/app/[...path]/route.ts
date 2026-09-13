import { NextRequest, NextResponse } from "next/server";

import { clientIpFromRequest, forwardClientIpHeaders } from "@/lib/client-ip";
import { getIstonkSession, istonkApiHost } from "@/lib/istonk-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/**
 * Authenticated proxy for the iStonks dashboard. Reads the httpOnly iStonk
 * session cookie and forwards to the istonk API with user+token injected.
 * `/api/istonks/app/<path>` → `ISTONKS_API_HOST/api/app/<path>`.
 *
 * Mirrors `/api/app/[...path]` but is bound to the iStonk session + host, so
 * a Basemate session can't reach istonk wallet endpoints and vice versa.
 */
async function forward(req: NextRequest, segments: string[], method: "GET" | "POST") {
  const session = await getIstonkSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const host = istonkApiHost();
  if (!host) {
    return NextResponse.json({ error: "iStonk API is not configured (set ISTONKS_API_HOST)." }, { status: 500 });
  }

  const endpoint = new URL(`/api/app/${segments.join("/")}`, host.replace(/\/$/, ""));
  endpoint.searchParams.set("user", session.user);
  endpoint.searchParams.set("token", session.token);
  req.nextUrl.searchParams.forEach((v, k) => {
    if (k !== "user" && k !== "token") endpoint.searchParams.set(k, v);
  });

  try {
    const endUserIp = clientIpFromRequest(req);
    const init: RequestInit = {
      method,
      cache: "no-store",
      headers: { accept: "application/json", ...forwardClientIpHeaders(endUserIp) },
    };
    if (method === "POST") {
      const body = await req.json().catch(() => ({}));
      init.headers = { ...init.headers, "content-type": "application/json" };
      init.body = JSON.stringify({ ...body, user: session.user, token: session.token });
    }
    const res = await fetch(endpoint, init);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: "Couldn't reach the iStonk API.", detail: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path, "GET");
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path, "POST");
}
