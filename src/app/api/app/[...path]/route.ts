import { NextRequest, NextResponse } from "next/server";

import { agentHost, getAppSession } from "@/lib/app-session";
import { appUiPreviewServerEnabled, isUiPreviewSession, mockAppApiResponse } from "@/lib/app-ui-preview";
import { clientIpFromRequest, forwardClientIpHeaders } from "@/lib/client-ip";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const GET_CACHE_TTL_MS = 60_000;
const getCache = new Map<string, { expires: number; status: number; data: unknown }>();

function readGetCache(key: string) {
  const hit = getCache.get(key);
  if (!hit) return null;
  if (hit.expires <= Date.now()) return { ...hit, stale: true as const };
  return { ...hit, stale: false as const };
}

/**
 * Authenticated proxy for the dashboard. Reads the httpOnly session cookie and
 * forwards to the agent with user+token injected, so the token never reaches
 * client JS. Everything maps to /api/app/<path> — including `portfolio`, which
 * uses the dashboard-scoped endpoint (Basemate embedded wallet only), distinct
 * from the /api/agent/portfolio magic link that shows all linked wallets.
 */
function corePath(segments: string[]): string {
  const path = segments.join("/");
  return `/api/app/${path}`;
}

async function forward(req: NextRequest, segments: string[], method: "GET" | "POST") {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (appUiPreviewServerEnabled() && isUiPreviewSession(session)) {
    const body =
      method === "POST" ? ((await req.json().catch(() => ({}))) as Record<string, unknown>) : {};
    const mocked = mockAppApiResponse(segments, method, body, req.nextUrl.searchParams);
    if (mocked) {
      return NextResponse.json(mocked.data, {
        status: mocked.status,
        headers: { "cache-control": "no-store" },
      });
    }
  }

  const host = agentHost();
  if (!host) {
    return NextResponse.json({ error: "Dashboard API is not configured (set AGENT_API_HOST)." }, { status: 500 });
  }

  const endpoint = new URL(corePath(segments), host.replace(/\/$/, ""));
  endpoint.searchParams.set("user", session.user);
  endpoint.searchParams.set("token", session.token);
  // Preserve any extra query params (e.g. yield asset filters).
  req.nextUrl.searchParams.forEach((v, k) => {
    if (k !== "user" && k !== "token") endpoint.searchParams.set(k, v);
  });

  const cacheKey = method === "GET" ? `${session.user}:${corePath(segments)}:${endpoint.search}` : null;
  if (cacheKey) {
    const fresh = readGetCache(cacheKey);
    if (fresh && !fresh.stale) {
      return NextResponse.json(fresh.data, {
        status: fresh.status,
        headers: { "cache-control": "no-store" },
      });
    }
  }

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
    if (cacheKey && res.ok) {
      getCache.set(cacheKey, { expires: Date.now() + GET_CACHE_TTL_MS, status: res.status, data });
    }
    return NextResponse.json(data, { status: res.status, headers: { "cache-control": "no-store" } });
  } catch (err) {
    if (cacheKey) {
      const stale = readGetCache(cacheKey);
      if (stale) {
        return NextResponse.json(stale.data, {
          status: stale.status,
          headers: { "cache-control": "no-store" },
        });
      }
    }
    return NextResponse.json(
      { error: "Couldn't reach the dashboard API.", detail: err instanceof Error ? err.message : String(err) },
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
