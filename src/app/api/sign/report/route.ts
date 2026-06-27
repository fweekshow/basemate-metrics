import { NextRequest, NextResponse } from "next/server";
import { Pool, type PoolConfig } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const SID_RE = /^[a-f0-9]{32}$/i;
const TX_HASH_RE = /^0x[a-f0-9]{64}$/i;
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
      pool: new Pool({ connectionString: databaseUrl, ssl: resolvePgSsl(databaseUrl) }),
    };
  }
  return poolCache.pool;
}

/**
 * Record the tx hash the user just signed in the `/sign` page against its
 * confirmation row (created by the iMessage backend when it handed out the
 * link). This flips the row to `submitted`; the backend's TxConfirmationPoller
 * then watches the receipt and DMs the user the outcome.
 *
 * Only `pending`/`submitted` rows are touched — never one already resolved — so
 * re-posting (e.g. a retry) is harmless. A no-op update returns `{ ok: false }`
 * rather than an error: the signature still succeeded in the browser.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sid = typeof body?.sid === "string" ? body.sid.trim() : "";
  const txHash = typeof body?.txHash === "string" ? body.txHash.trim() : "";

  if (!SID_RE.test(sid) || !TX_HASH_RE.test(txHash)) {
    return NextResponse.json({ error: "Invalid sid or txHash." }, { status: 400 });
  }

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    return NextResponse.json({ error: "Confirmation tracking is not configured." }, { status: 500 });
  }

  try {
    const pool = getPool(url);
    const result = await pool.query(
      `UPDATE tx_confirmations
          SET status = 'submitted', tx_hash = $2, submitted_at = NOW()
        WHERE sid = $1 AND status IN ('pending', 'submitted')`,
      [sid, txHash.toLowerCase()],
    );
    return NextResponse.json(
      { ok: (result.rowCount ?? 0) > 0 },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    console.error("[sign/report] failed to record signed tx:", err);
    return NextResponse.json({ error: "Could not record the transaction." }, { status: 503 });
  }
}
