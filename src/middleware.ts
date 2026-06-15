import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isMetricsHost(host: string) {
  const normalized = host.toLowerCase();
  return (
    normalized.startsWith("metrics.") ||
    normalized.includes("basemate-metrics")
  );
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (isMetricsHost(host) && pathname === "/") {
    return NextResponse.rewrite(new URL("/metrics", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
