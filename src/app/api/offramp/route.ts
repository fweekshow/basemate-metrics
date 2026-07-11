import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;
const ACTIONS = new Set(["status", "launch", "refresh", "approval"]);

/**
 * Navigation-only launch endpoint. The Coinbase session token stays on the
 * server and is handed directly to Coinbase in one redirect, preventing client
 * retries, previews, or instrumentation from consuming the single-use URL.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token")?.trim() ?? "";
  if (requestUrl.searchParams.get("action") !== "launch" || !TOKEN_RE.test(token)) {
    return json({ error: "Invalid cash-out launch request." }, 400);
  }
  const apiHost = channelsApiHost();
  if (!apiHost) return json({ error: "Cash-out service is not configured." }, 503);

  try {
    const response = await fetch(
      new URL("/api/agent/offramp/launch", apiHost.replace(/\/$/, "")),
      {
        method: "POST",
        cache: "no-store",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({ token }),
      },
    );
    const payload = (await response.json()) as {
      coinbaseUrl?: string;
      error?: string;
    };
    if (!response.ok || !payload.coinbaseUrl) {
      return json({ error: payload.error || "Could not launch Coinbase." }, response.status);
    }
    const coinbaseUrl = new URL(payload.coinbaseUrl);
    if (coinbaseUrl.protocol !== "https:" || coinbaseUrl.hostname !== "pay.coinbase.com") {
      return json({ error: "Cash-out service returned an invalid Coinbase URL." }, 502);
    }
    const redirect = NextResponse.redirect(coinbaseUrl, 302);
    redirect.headers.set("cache-control", "no-store");
    redirect.headers.set("referrer-policy", "no-referrer");
    return redirect;
  } catch {
    return json({ error: "Could not reach the cash-out service." }, 502);
  }
}

export async function POST(request: Request) {
  let body: { token?: unknown; action?: unknown };
  try {
    body = (await request.json()) as { token?: unknown; action?: unknown };
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const action = typeof body.action === "string" ? body.action : "";
  if (!TOKEN_RE.test(token) || !ACTIONS.has(action)) {
    return json({ error: "Invalid cash-out request." }, 400);
  }

  const apiHost = channelsApiHost();
  if (!apiHost) return json({ error: "Cash-out service is not configured." }, 503);

  const path =
    action === "status"
      ? "/api/agent/offramp"
      : `/api/agent/offramp/${action}`;
  const endpoint = new URL(path, apiHost.replace(/\/$/, ""));
  const init: RequestInit = {
    cache: "no-store",
    headers: { accept: "application/json" },
  };
  if (action === "status") {
    endpoint.searchParams.set("token", token);
  } else {
    init.method = "POST";
    init.headers = {
      ...init.headers,
      "content-type": "application/json",
    };
    init.body = JSON.stringify({ token });
  }

  try {
    const response = await fetch(endpoint, init);
    const payload = (await response.json()) as unknown;
    return json(payload, response.status);
  } catch {
    return json({ error: "Could not reach the cash-out service." }, 502);
  }
}

function channelsApiHost() {
  return (
    process.env.CHANNELS_API_HOST?.trim() ||
    process.env.IMESSAGE_PORTFOLIO_API_HOST?.trim() ||
    process.env.AGENT_API_HOST?.trim()
  );
}

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
