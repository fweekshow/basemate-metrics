import { NextRequest, NextResponse } from "next/server";
import { Pool, type PoolConfig } from "pg";
import { getAddress, verifyMessage } from "viem";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TOKEN_RE = /^[a-f0-9]{32}$/i;
const SSL_DISABLED_VALUES = new Set(["0", "false", "disable", "disabled", "no", "off"]);
const SSL_ENABLED_VALUES = new Set(["1", "true", "enable", "enabled", "require", "yes", "on"]);

type SetupSessionRow = {
  sender_id: string;
  expires_at: string;
  completed_at: string | null;
};

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

function databaseUrl() {
  return process.env.SHARED_GROUPS_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
}

async function ensureTables(pool: Pool) {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS base_account_setup_sessions (
      token TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("s")?.trim() ?? "";
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Missing or invalid setup session." }, { status: 400 });
  }

  const url = databaseUrl();
  if (!url) {
    return NextResponse.json({ error: "Wallet setup is not configured." }, { status: 500 });
  }

  try {
    const pool = getPool(url);
    await ensureTables(pool);
    const result = await pool.query<SetupSessionRow>(
      `SELECT sender_id, expires_at, completed_at
       FROM base_account_setup_sessions
       WHERE token = $1
       LIMIT 1`,
      [token],
    );
    const session = result.rows[0];
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "This setup link has expired. Ask Basemate for a new one." }, { status: 404 });
    }
    if (session.completed_at) {
      return NextResponse.json({ error: "This setup link was already used. Ask Basemate for a new one." }, { status: 409 });
    }
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    console.error("[wallet/setup] failed to load setup session:", err);
    return NextResponse.json({ error: "Could not load setup session." }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const message = typeof body?.message === "string" ? body.message : "";
  const signature = typeof body?.signature === "string" ? body.signature : "";
  const rawAddress = typeof body?.address === "string" ? body.address.trim() : "";

  if (!TOKEN_RE.test(token) || !message || !signature || !rawAddress) {
    return NextResponse.json({ error: "Missing setup proof." }, { status: 400 });
  }

  let address: `0x${string}`;
  try {
    address = getAddress(rawAddress) as `0x${string}`;
  } catch {
    return NextResponse.json({ error: "Invalid Base Account address." }, { status: 400 });
  }

  const url = databaseUrl();
  if (!url) {
    return NextResponse.json({ error: "Wallet setup is not configured." }, { status: 500 });
  }

  try {
    const verified = await verifyMessage({ address, message, signature: signature as `0x${string}` });
    if (!verified) {
      return NextResponse.json({ error: "Could not verify wallet signature." }, { status: 401 });
    }

    const pool = getPool(url);
    await ensureTables(pool);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<SetupSessionRow>(
        `SELECT sender_id, expires_at, completed_at
         FROM base_account_setup_sessions
         WHERE token = $1
         FOR UPDATE`,
        [token],
      );
      const session = result.rows[0];
      if (!session || new Date(session.expires_at) < new Date()) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "This setup link has expired. Ask Basemate for a new one." }, { status: 404 });
      }
      if (session.completed_at) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "This setup link was already used. Ask Basemate for a new one." }, { status: 409 });
      }

      await client.query(
        `UPDATE imessage_wallets
         SET base_app_address = $2, last_active_at = NOW()
         WHERE sender_id = $1`,
        [session.sender_id, address],
      );
      await client.query(
        `UPDATE base_account_setup_sessions
         SET completed_at = NOW()
         WHERE token = $1`,
        [token],
      );
      await client.query("COMMIT");
      return NextResponse.json({ address });
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[wallet/setup] failed to complete setup:", err);
    return NextResponse.json({ error: "Could not connect your Base Account." }, { status: 503 });
  }
}
