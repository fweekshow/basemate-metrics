import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { DATA_ROOM_COOKIE } from "@/lib/data-room-auth-edge";

export { DATA_ROOM_COOKIE };

const COOKIE_TTL_S = 60 * 60 * 24 * 14; // 14 days

export type DataRoomSession = {
  v: 1;
  name: string;
  firm: string;
  exp: number;
};

function password(): string {
  return process.env.DATA_ROOM_PASSWORD?.trim() || "b@s3m@t3";
}

function secret(): string {
  return (
    process.env.DATA_ROOM_SECRET?.trim() ||
    process.env.DATA_ROOM_PASSWORD?.trim() ||
    "b@s3m@t3-data-room-secret"
  );
}

function signPayload(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function verifyPassword(candidate: string): boolean {
  const expected = password();
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function mintDataRoomToken(session: Omit<DataRoomSession, "v" | "exp">): string {
  const body: DataRoomSession = {
    v: 1,
    name: session.name.trim(),
    firm: session.firm.trim(),
    exp: Math.floor(Date.now() / 1000) + COOKIE_TTL_S,
  };
  const payload = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function parseDataRoomToken(token: string | undefined | null): DataRoomSession | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = signPayload(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DataRoomSession;
    if (parsed?.v !== 1 || typeof parsed.name !== "string") return null;
    if (typeof parsed.exp !== "number" || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      v: 1,
      name: parsed.name,
      firm: typeof parsed.firm === "string" ? parsed.firm : "",
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function dataRoomCookieOptions(maxAge = COOKIE_TTL_S) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function getDataRoomSession(): Promise<DataRoomSession | null> {
  const jar = await cookies();
  return parseDataRoomToken(jar.get(DATA_ROOM_COOKIE)?.value);
}

export { COOKIE_TTL_S };
