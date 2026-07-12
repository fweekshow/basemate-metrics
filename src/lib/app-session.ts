import { cookies } from "next/headers";

/**
 * Dashboard session. The value stored is the core-issued portfolio access token
 * (already HMAC-signed by the agent) plus the resolved senderId. The cookie is
 * httpOnly so the token never touches client JS; every /api/app/* proxy reads it
 * server-side and forwards user+token to the agent.
 */
export const APP_SESSION_COOKIE = "bm_app_session";
const MAX_AGE_S = 12 * 60 * 60;

export interface AppSession {
  user: string;
  token: string;
  address: string;
}

export async function setAppSession(session: AppSession): Promise<void> {
  const value = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const jar = await cookies();
  jar.set(APP_SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
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
