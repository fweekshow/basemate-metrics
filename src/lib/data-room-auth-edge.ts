/** Shared cookie name — safe for Edge middleware. */
export const DATA_ROOM_COOKIE = "bm_data_room";

function secret(): string {
  return (
    process.env.DATA_ROOM_SECRET?.trim() ||
    process.env.DATA_ROOM_PASSWORD?.trim() ||
    "b@s3m@t3-data-room-secret"
  );
}

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/** Edge-safe token check for middleware (Web Crypto HMAC). */
export async function verifyDataRoomTokenEdge(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const expected = bytesToBase64Url(mac);
  if (!timingSafeEqualStr(sig, expected)) return false;

  try {
    const padded =
      payload.length % 4 === 0
        ? payload
        : payload + "=".repeat(4 - (payload.length % 4));
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json) as { v?: number; name?: string; exp?: number };
    return (
      parsed?.v === 1 &&
      typeof parsed.name === "string" &&
      typeof parsed.exp === "number" &&
      parsed.exp >= Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export function isDataRoomProtectedPath(pathname: string): boolean {
  if (pathname === "/data-room" || pathname.startsWith("/data-room/")) return true;
  if (pathname === "/deck" || pathname.startsWith("/deck/")) return true;
  if (
    pathname === "/deck.pdf" ||
    pathname === "/onepager.pdf" ||
    pathname === "/investor-update.pdf"
  ) {
    return true;
  }
  return false;
}
