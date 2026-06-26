import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/pay?s=TOKEN
 *
 * Looks up a Coinbase headless onramp fund session by token.
 * Fund sessions are written by basemate-imessage (Railway Postgres) and read
 * here via AGENT_DATABASE_URL (the Railway Postgres TCP connection).
 *
 * Uses node-postgres (pg) instead of @neondatabase/serverless because Railway
 * Postgres is a standard TCP connection — not a Neon HTTP endpoint.
 */

// Module-level pool — reused across requests in the same process.
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = (process.env.AGENT_DATABASE_URL ?? process.env.DATABASE_URL)?.trim();
    if (!connectionString) throw new Error("AGENT_DATABASE_URL is not set");
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("s")?.trim();

  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  let client;
  try {
    client = await getPool().connect();

    // Create table if it doesn't exist yet (idempotent — handles first-run locally)
    await client.query(`
      CREATE TABLE IF NOT EXISTS fund_sessions (
        token            VARCHAR(32) PRIMARY KEY,
        payment_link_url TEXT NOT NULL,
        user_phone       TEXT NOT NULL,
        expires_at       TIMESTAMPTZ NOT NULL,
        consumed_at      TIMESTAMPTZ,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const result = await client.query(
      `SELECT token, payment_link_url, expires_at, consumed_at
       FROM fund_sessions WHERE token = $1`,
      [token],
    );

    const row = result.rows[0];

    if (!row) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (new Date(row.expires_at as string) < new Date()) {
      return NextResponse.json({ error: "expired" }, { status: 404 });
    }

    // Mark consumed on first read (idempotent — safe for page refresh)
    if (!row.consumed_at) {
      await client.query(
        `UPDATE fund_sessions SET consumed_at = NOW() WHERE token = $1`,
        [token],
      );
    }

    let paymentLinkUrl = row.payment_link_url as string;

    // In sandbox mode append the mock Apple Pay parameter
    if (process.env.NEXT_PUBLIC_ONRAMP_SANDBOX === "true") {
      const separator = paymentLinkUrl.includes("?") ? "&" : "?";
      paymentLinkUrl = `${paymentLinkUrl}${separator}useApplePaySandbox=true`;
    }

    return NextResponse.json({ paymentLinkUrl });
  } catch (err) {
    console.error("[pay] database error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  } finally {
    client?.release();
  }
}
