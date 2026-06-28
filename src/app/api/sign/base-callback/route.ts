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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function findSid(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSid(item);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(value)) return null;

  const sid = value.sid;
  if (typeof sid === "string" && SID_RE.test(sid.trim())) return sid.trim();

  for (const child of Object.values(value)) {
    const found = findSid(child);
    if (found) return found;
  }
  return null;
}

function findTxHash(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return TX_HASH_RE.test(trimmed) ? trimmed.toLowerCase() : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findTxHash(item);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(value)) return null;

  for (const key of ["txHash", "transactionHash", "hash"]) {
    const candidate = value[key];
    if (typeof candidate === "string" && TX_HASH_RE.test(candidate.trim())) {
      return candidate.trim().toLowerCase();
    }
  }

  for (const child of Object.values(value)) {
    const found = findTxHash(child);
    if (found) return found;
  }
  return null;
}

/**
 * Receives Base Account prolink lifecycle callbacks. The iMessage backend places
 * the confirmation `sid` in the dataCallback context when it builds the prolink;
 * this endpoint records the post-sign transaction hash so the existing
 * TxConfirmationPoller can confirm on-chain and DM the user.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sid = findSid(body);
  const txHash = findTxHash(body);

  if (!sid) {
    return NextResponse.json({ error: "Missing or invalid sid." }, { status: 400 });
  }
  if (!txHash) {
    return NextResponse.json(
      { ok: false, reason: "missing_tx_hash" },
      { status: 202, headers: { "cache-control": "no-store" } },
    );
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
      [sid, txHash],
    );
    return NextResponse.json(
      { ok: (result.rowCount ?? 0) > 0 },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    console.error("[sign/base-callback] failed to record signed tx:", err);
    return NextResponse.json({ error: "Could not record the transaction." }, { status: 503 });
  }
}
