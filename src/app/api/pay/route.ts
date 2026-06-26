import { NextRequest, NextResponse } from "next/server";
import { Pool, type PoolConfig } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type FundSessionRow = {
  payment_link_url: string;
  expires_at: string;
  consumed_at: string | null;
};

const TOKEN_RE = /^[a-f0-9]{21}$/i;
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

function getPool(databaseUrl: string): Pool {
  if (!poolCache || poolCache.databaseUrl !== databaseUrl) {
    poolCache = {
      databaseUrl,
      pool: new Pool({
        connectionString: databaseUrl,
        ssl: resolvePgSsl(databaseUrl),
      }),
    };
  }

  return poolCache.pool;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("s")?.trim() ?? "";
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Missing or invalid payment session." }, { status: 400 });
  }

  const databaseUrl =
    process.env.SHARED_GROUPS_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return NextResponse.json({ error: "Payment sessions are not configured." }, { status: 500 });
  }

  try {
    const pool = getPool(databaseUrl);
    const result = await pool.query<FundSessionRow>(
      `SELECT payment_link_url, expires_at, consumed_at
       FROM fund_sessions
       WHERE token = $1
       LIMIT 1`,
      [token],
    );

    const session = result.rows[0];
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "This payment link has expired. Ask Basemate for a new one." }, { status: 404 });
    }

    if (!session.consumed_at) {
      await pool.query(
        `UPDATE fund_sessions
         SET consumed_at = NOW()
         WHERE token = $1 AND consumed_at IS NULL`,
        [token],
      );
    }

    return NextResponse.json(
      {
        paymentLinkUrl: session.payment_link_url,
        expiresAt: session.expires_at,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    console.error("[pay] failed to load fund session:", err);
    return NextResponse.json({ error: "Could not load payment session." }, { status: 503 });
  }
}
