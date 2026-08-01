import { isIP } from "node:net";

/** Best-effort client IP from the incoming browser request (for Coinbase region checks). */
export function clientIpFromRequest(request: Request): string | undefined {
  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("fly-client-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for")?.split(",")[0],
  ];
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && isIP(value)) return value;
  }
  return undefined;
}

export function forwardClientIpHeaders(ip: string | undefined): HeadersInit {
  if (!ip) return {};
  return {
    "x-forwarded-for": ip,
    "x-basemate-client-ip": ip,
  };
}
