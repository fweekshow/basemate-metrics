import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

/**
 * Dashboard session. The value stored is the core-issued portfolio access token
 * (already HMAC-signed by the agent) plus the resolved senderId. The cookie is
 * httpOnly so the token never touches client JS; every /api/app/* proxy reads it
 * server-side and forwards user+token to the agent.
 */
export const APP_SESSION_COOKIE = "bm_app_session";
// 30 days — keep in sync with the agent's SESSION_TTL_MS (token expiry).
export const APP_SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

export const APP_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: APP_SESSION_MAX_AGE_S,
};

export interface AppSession {
  user: string;
  token: string;
  address: string;
}

export function encodeAppSessionValue(session: AppSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

/** Set session on a route-handler response so the browser receives Set-Cookie. */
export function applyAppSessionCookie(res: NextResponse, session: AppSession): void {
  res.cookies.set(APP_SESSION_COOKIE, encodeAppSessionValue(session), APP_SESSION_COOKIE_OPTIONS);
}

export function clearAppSessionCookie(res: NextResponse): void {
  res.cookies.set(APP_SESSION_COOKIE, "", { ...APP_SESSION_COOKIE_OPTIONS, maxAge: 0 });
}

export async function setAppSession(session: AppSession): Promise<void> {
  const jar = await cookies();
  jar.set(APP_SESSION_COOKIE, encodeAppSessionValue(session), APP_SESSION_COOKIE_OPTIONS);
}

export async function getAppSession(): Promise<AppSession | null> {
  const jar = await cookies();
  const raw = jar.get(APP_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (parsed && typeof parsed.user === "string" && typeof parsed.token === "string") {
      return parsed as AppSession;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearAppSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(APP_SESSION_COOKIE);
}

export function agentHost(): string | undefined {
  return (
    process.env.IMESSAGE_PORTFOLIO_API_HOST?.trim() ||
    process.env.AGENT_API_HOST?.trim() ||
    undefined
  );
}
