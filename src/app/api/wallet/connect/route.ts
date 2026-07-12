import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { Pool, type PoolConfig } from "pg";
import { getAddress } from "viem";

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
  return process.env.DATABASE_URL?.trim() || process.env.SHARED_GROUPS_DATABASE_URL?.trim();
}

function getPool(url: string): Pool {
  if (!poolCache || poolCache.databaseUrl !== url) {
    poolCache = { databaseUrl: url, pool: new Pool({ connectionString: url, ssl: resolvePgSsl(url) }) };
  }
  return poolCache.pool;
}

function accountNameFor(senderId: string): string {
  const hash = createHash("sha256").update(senderId).digest("hex");
  return `im-${hash.slice(0, 30)}`;
}

type SetupSessionRow = { sender_id: string; expires_at: string; completed_at: string | null };

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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS imessage_wallets (
      sender_id TEXT PRIMARY KEY,
      account_name TEXT NOT NULL,
      address TEXT NOT NULL,
      first_seen_at TIMESTAMP DEFAULT NOW(),
      last_active_at TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE imessage_wallets ADD COLUMN IF NOT EXISTS base_app_address TEXT;
    ALTER TABLE imessage_wallets ADD COLUMN IF NOT EXISTS tx_pref TEXT;
    ALTER TABLE imessage_wallets ADD COLUMN IF NOT EXISTS cdp_user_id TEXT;
    ALTER TABLE imessage_wallets ADD COLUMN IF NOT EXISTS embedded_address TEXT;
    ALTER TABLE imessage_wallets ADD COLUMN IF NOT EXISTS delegation_id TEXT;
    ALTER TABLE imessage_wallets ADD COLUMN IF NOT EXISTS delegation_expires_at TIMESTAMPTZ;
  `);
}

/** GET /api/wallet/connect?s=<token> — validate the setup session. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("s")?.trim() ?? "";
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Missing or invalid setup session." }, { status: 400 });
  }
  const url = databaseUrl();
  if (!url) return NextResponse.json({ error: "Wallet setup is not configured." }, { status: 500 });

  try {
    const pool = getPool(url);
    await ensureTables(pool);
    const result = await pool.query<SetupSessionRow>(
      `SELECT sender_id, expires_at, completed_at FROM base_account_setup_sessions WHERE token = $1 LIMIT 1`,
      [token],
    );
    const session = result.rows[0];
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "This link has expired. Ask Basemate for a new one." }, { status: 404 });
    }
    if (session.completed_at) {
      return NextResponse.json({ error: "This link was already used. Ask Basemate for a new one." }, { status: 409 });
    }
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    console.error("[wallet/connect] failed to load setup session:", err);
    return NextResponse.json({ error: "Could not load setup session." }, { status: 503 });
  }
}

/**
 * POST /api/wallet/connect — persist the embedded wallet + delegation for the
 * session's sender and set their signing preference to the Basemate account.
 * Body: { token, userId, address, delegationId, expiresAt }.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  const rawAddress = typeof body?.address === "string" ? body.address.trim() : "";
  const delegationId = typeof body?.delegationId === "string" ? body.delegationId.trim() : "";
  const expiresAt = typeof body?.expiresAt === "string" ? body.expiresAt.trim() : "";

  if (!TOKEN_RE.test(token) || !userId || !rawAddress) {
    return NextResponse.json({ error: "Missing connection details." }, { status: 400 });
  }
  let address: string;
  try {
    address = getAddress(rawAddress);
  } catch {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const url = databaseUrl();
  if (!url) return NextResponse.json({ error: "Wallet setup is not configured." }, { status: 500 });

  try {
    const pool = getPool(url);
    await ensureTables(pool);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<SetupSessionRow>(
        `SELECT sender_id, expires_at, completed_at FROM base_account_setup_sessions WHERE token = $1 FOR UPDATE`,
        [token],
      );
      const session = result.rows[0];
      if (!session || new Date(session.expires_at) < new Date()) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "This link has expired. Ask Basemate for a new one." }, { status: 404 });
      }
      if (session.completed_at) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "This link was already used." }, { status: 409 });
      }

      await client.query(
        `INSERT INTO imessage_wallets (sender_id, account_name, address, cdp_user_id, embedded_address, delegation_id, delegation_expires_at, tx_pref)
         VALUES ($1, $2, '', $3, $4, $5, $6, 'embedded')
         ON CONFLICT (sender_id) DO UPDATE
         SET cdp_user_id = EXCLUDED.cdp_user_id,
             embedded_address = EXCLUDED.embedded_address,
             delegation_id = EXCLUDED.delegation_id,
             delegation_expires_at = EXCLUDED.delegation_expires_at,
             tx_pref = 'embedded',
             last_active_at = NOW()`,
        [session.sender_id, accountNameFor(session.sender_id), userId, address, delegationId || null, expiresAt || null],
      );
      await client.query(`UPDATE base_account_setup_sessions SET completed_at = NOW() WHERE token = $1`, [token]);
      await client.query("COMMIT");
      return NextResponse.json({ ok: true, address });
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[wallet/connect] failed to persist connection:", err);
    return NextResponse.json({ error: "Could not connect your Basemate account." }, { status: 503 });
  }
}
