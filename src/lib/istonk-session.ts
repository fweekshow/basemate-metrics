import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { APP_SESSION_MAX_AGE_S, type AppSession } from "@/lib/app-session";
import { istonksApiHost } from "@/lib/istonks-pay";

/**
 * iStonks dashboard session — separate from the Basemate one (`bm_app_session`).
 *
 * The token is issued by the istonk API (`POST /api/agent/app/session`) after it
 * validates a CDP access token on the *iStonk* CDP project. Keeping it in its own
 * cookie means a Basemate sign-in can never be mistaken for an iStonk one: the
 * two projects resolve the same email to different smart accounts.
 */
export const ISTONK_SESSION_COOKIE = "bm_istonk_session";

export const ISTONK_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: APP_SESSION_MAX_AGE_S,
};

export type IstonkSession = AppSession;

function encode(session: IstonkSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function applyIstonkSessionCookie(res: NextResponse, session: IstonkSession): void {
  res.cookies.set(ISTONK_SESSION_COOKIE, encode(session), ISTONK_SESSION_COOKIE_OPTIONS);
}

export function clearIstonkSessionCookie(res: NextResponse): void {
  res.cookies.set(ISTONK_SESSION_COOKIE, "", { ...ISTONK_SESSION_COOKIE_OPTIONS, maxAge: 0 });
}

export async function getIstonkSession(): Promise<IstonkSession | null> {
  const jar = await cookies();
  const raw = jar.get(ISTONK_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (parsed && typeof parsed.user === "string" && typeof parsed.token === "string") {
      return parsed as IstonkSession;
    }
    return null;
  } catch {
    return null;
  }
}

/** istonk API origin. Unlike the Basemate agent, there is no fallback host. */
export function istonkApiHost(): string | undefined {
  return istonksApiHost();
}
