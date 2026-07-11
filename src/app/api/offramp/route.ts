import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;
const ACTIONS = new Set(["status", "launch", "refresh", "approval"]);

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

  const apiHost =
    process.env.CHANNELS_API_HOST?.trim() ||
    process.env.IMESSAGE_PORTFOLIO_API_HOST?.trim() ||
    process.env.AGENT_API_HOST?.trim();
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

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
