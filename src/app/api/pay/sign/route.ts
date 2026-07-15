import { NextRequest, NextResponse } from "next/server";
import { Pool, type PoolConfig } from "pg";

import { agentHost, getAppSession } from "@/lib/app-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TOKEN_RE = /^[a-f0-9]{32}$/i;
const SSL_DISABLED_VALUES = new Set(["0", "false", "disable", "disabled", "no", "off"]);
const SSL_ENABLED_VALUES = new Set(["1", "true", "enable", "enabled", "require", "yes", "on"]);

let poolCache: { databaseUrl: string; pool: Pool } | null = null;

function getSslMode(connectionString: string): string | undefined {
  try {
    return new URL(connectionString).searchParams.get("sslmode")?.trim().toLowerCase();
  } catch {
    return undefined;
  }
}

function resolvePgSsl(connectionString: string): PoolConfig["ssl"] | undefined {
  const explicit = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (explicit) {
    if (SSL_DISABLED_VALUES.has(explicit)) return false;
    if (SSL_ENABLED_VALUES.has(explicit)) return { rejectUnauthorized: false };
  }
  const sslMode = getSslMode(connectionString);
  if (sslMode === "disable") return false;
  if (sslMode === "require" || sslMode === "no-verify") return { rejectUnauthorized: false };
  return process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false;
}

function databaseUrl(): string | undefined {
  return process.env.SHARED_GROUPS_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
}

function getPool(url: string): Pool {
  if (!poolCache || poolCache.databaseUrl !== url) {
    poolCache = { databaseUrl: url, pool: new Pool({ connectionString: url, ssl: resolvePgSsl(url) }) };
  }
  return poolCache.pool;
}

async function authorizeEmbeddedPayment(token: string): Promise<NextResponse | null> {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to view and confirm this transaction.", requiresAuth: true },
      { status: 401 },
    );
  }
  const host = agentHost();
  if (!host) {
    return NextResponse.json({ error: "Payment authorization is not configured." }, { status: 500 });
  }
  try {
    const res = await fetch(new URL("/api/pay/authorize", host.replace(/\/$/, "")), {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        token,
        user: session.user,
        sessionToken: session.token,
      }),
    });
    if (res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      {
        error: data?.error ?? "Could not authorize this transaction.",
        ...(res.status === 401 ? { requiresAuth: true } : {}),
      },
      { status: res.status, headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    console.error("[pay/sign] authorization service unavailable:", err);
    return NextResponse.json({ error: "Could not authorize this transaction." }, { status: 503 });
  }
}

type PendingPayRow = {
  label: string | null;
  recipient_display: string | null;
  amount: string | null;
  token_symbol: string | null;
  wallet_kind: string | null;
  status: string;
  tx_hash: string | null;
  expires_at: string;
};

/** GET /api/pay/sign?s=<token> — load an embedded-wallet transaction for confirmation. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("s")?.trim() ?? "";
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Missing or invalid payment link." }, { status: 400 });
  }
  const url = databaseUrl();
  if (!url) return NextResponse.json({ error: "Payments are not configured." }, { status: 500 });

  try {
    const pool = getPool(url);
    const result = await pool.query<PendingPayRow>(
      `SELECT label, recipient_display, amount, token_symbol, wallet_kind,
              status, tx_hash, expires_at
       FROM pending_pay_transactions WHERE token = $1 LIMIT 1`,
      [token],
    );
    const row = result.rows[0];
    if (!row) {
      return NextResponse.json({ error: "This payment link is invalid or has expired." }, { status: 404 });
    }
    if (new Date(row.expires_at) < new Date() && row.status === "pending") {
      return NextResponse.json({ error: "This payment link has expired. Ask Basemate for a new one." }, { status: 404 });
    }
    if (row.wallet_kind !== "embedded") {
      return NextResponse.json(
        { error: "This payment link does not use a Basemate embedded wallet." },
        { status: 409, headers: { "cache-control": "no-store" } },
      );
    }
    const denied = await authorizeEmbeddedPayment(token);
    if (denied) return denied;

    return NextResponse.json(
      {
        label: row.label,
        recipientDisplay: row.recipient_display,
        amount: row.amount,
        tokenSymbol: row.token_symbol,
        status: row.status,
        txHash: row.tx_hash,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    console.error("[pay/sign] failed to load pending transaction:", err);
    return NextResponse.json({ error: "Could not load this payment." }, { status: 503 });
  }
}
