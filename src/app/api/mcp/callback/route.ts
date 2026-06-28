import { createCipheriv, createHash, randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { Pool, type PoolConfig } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const SSL_DISABLED_VALUES = new Set(["0", "false", "disable", "disabled", "no", "off"]);
const SSL_ENABLED_VALUES = new Set(["1", "true", "enable", "enabled", "require", "yes", "on"]);
const ALGO = "aes-256-gcm";

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

/** Must match the key derivation in basemate-v2 baseMcpOAuth.adapter.ts. */
function encryptionKey(): Buffer {
  const secret = process.env.BASE_MCP_OAUTH_ENC_KEY?.trim();
  if (!secret) throw new Error("BASE_MCP_OAUTH_ENC_KEY is not configured.");
  return createHash("sha256").update(secret, "utf8").digest();
}

/** Encrypt to `iv.tag.ciphertext` (base64url) — mirrors the core adapter. */
function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((b) => b.toString("base64url")).join(".");
}

function serverUrl(): string {
  return (process.env.BASE_MCP_SERVER_URL?.trim() || "https://mcp.base.org").replace(/\/$/, "");
}

function redirectUri(): string {
  return process.env.BASE_MCP_REDIRECT_URI?.trim() || "https://basemate.app/api/mcp/callback";
}

function connectedRedirect(req: NextRequest, error?: string): NextResponse {
  const url = new URL("/mcp/connected", req.nextUrl.origin);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

type SessionRow = {
  sender_id: string;
  code_verifier: string;
  expires_at: string;
  consumed_at: string | null;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

/**
 * OAuth redirect target for Base MCP. Validates and consumes the one-time PKCE
 * state row (created by the iMessage backend when it sent the connect link),
 * exchanges the authorization code for tokens, and stores them encrypted in the
 * shared `base_mcp_oauth` table the iMessage bot reads from.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  const state = req.nextUrl.searchParams.get("state")?.trim() ?? "";
  const oauthError = req.nextUrl.searchParams.get("error")?.trim();

  if (oauthError) return connectedRedirect(req, oauthError);
  if (!code || !state) return connectedRedirect(req, "missing_code");

  const clientId = process.env.BASE_MCP_CLIENT_ID?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!clientId || !databaseUrl) return connectedRedirect(req, "not_configured");

  try {
    const pool = getPool(databaseUrl);
    const client = await pool.connect();
    let session: SessionRow | undefined;
    try {
      await client.query("BEGIN");
      const result = await client.query<SessionRow>(
        `SELECT sender_id, code_verifier, expires_at, consumed_at
           FROM base_mcp_oauth_sessions
          WHERE state = $1
          FOR UPDATE`,
        [state],
      );
      session = result.rows[0];
      if (!session || new Date(session.expires_at) < new Date() || session.consumed_at) {
        await client.query("ROLLBACK");
        return connectedRedirect(req, "expired");
      }
      await client.query(
        `UPDATE base_mcp_oauth_sessions SET consumed_at = NOW() WHERE state = $1`,
        [state],
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }

    const tokenRes = await fetch(`${serverUrl()}/token`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        code_verifier: session.code_verifier,
        client_id: clientId,
        redirect_uri: redirectUri(),
      }).toString(),
    });

    const tokenText = await tokenRes.text();
    let tokens: TokenResponse;
    try {
      tokens = JSON.parse(tokenText) as TokenResponse;
    } catch {
      console.error("[mcp/callback] non-JSON token response:", tokenText);
      return connectedRedirect(req, "token_exchange_failed");
    }
    if (!tokenRes.ok || tokens.error || !tokens.access_token) {
      console.error("[mcp/callback] token exchange failed:", tokens.error_description || tokenText);
      return connectedRedirect(req, "token_exchange_failed");
    }

    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);
    const pool2 = getPool(databaseUrl);
    await pool2.query(
      `INSERT INTO base_mcp_oauth
         (sender_id, account_address, access_token, refresh_token, expires_at, scope, client_id, updated_at)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (sender_id) DO UPDATE
         SET access_token  = EXCLUDED.access_token,
             refresh_token = EXCLUDED.refresh_token,
             expires_at    = EXCLUDED.expires_at,
             scope         = EXCLUDED.scope,
             client_id     = EXCLUDED.client_id,
             updated_at    = NOW()`,
      [
        session.sender_id,
        encrypt(tokens.access_token),
        tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        expiresAt,
        tokens.scope ?? process.env.BASE_MCP_SCOPE?.trim() ?? "agent_wallet:transact",
        clientId,
      ],
    );

    return connectedRedirect(req);
  } catch (err) {
    console.error("[mcp/callback] failed to complete connection:", err);
    return connectedRedirect(req, "server_error");
  }
}
