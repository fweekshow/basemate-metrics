import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/**
 * Same-origin ERC-7677 paymaster proxy. The Base Account SDK calls this from the
 * sign page as `capabilities.paymasterService.url`; it forwards to the server-only
 * CDP paymaster URL so the project token is never exposed to the browser. Only
 * the two ERC-7677 methods are allowed.
 */

const ALLOWED_METHODS = new Set(["pm_getPaymasterStubData", "pm_getPaymasterData"]);

function cdpUrl(): string | undefined {
  return process.env.CDP_PAYMASTER_URL?.trim();
}

function methodOf(entry: unknown): string | null {
  if (!entry || typeof entry !== "object") return null;
  const method = (entry as { method?: unknown }).method;
  return typeof method === "string" ? method : null;
}

function allMethodsAllowed(body: unknown): boolean {
  const entries = Array.isArray(body) ? body : [body];
  if (entries.length === 0) return false;
  return entries.every((entry) => {
    const method = methodOf(entry);
    return method !== null && ALLOWED_METHODS.has(method);
  });
}

export async function POST(req: NextRequest) {
  const url = cdpUrl();
  if (!url) {
    return NextResponse.json({ error: "Paymaster not configured." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!allMethodsAllowed(body)) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "application/json", "cache-control": "no-store" },
    });
  } catch (err) {
    console.error("[paymaster] upstream request failed:", err);
    return NextResponse.json({ error: "Paymaster upstream unavailable." }, { status: 502 });
  }
}
