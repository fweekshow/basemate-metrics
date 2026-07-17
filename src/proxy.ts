import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SITE } from "@/lib/site";

function normalizeHost(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

function isMetricsHost(host: string) {
  return host.startsWith("metrics.") || host.includes("basemate-metrics");
}

function isMarketingHost(host: string) {
  return host === "basemate.app" || host === "www.basemate.app";
}

function isAppHost(host: string) {
  return host === "app.basemate.app";
}

export function proxy(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host") ?? "");
  const { pathname, search } = request.nextUrl;

  // Metrics subdomain: root shows the metrics dashboard.
  if (isMetricsHost(host) && pathname === "/") {
    return NextResponse.rewrite(new URL("/metrics", request.url));
  }

  // Marketing host (basemate.app): the signed-in product lives on app.basemate.app.
  if (isMarketingHost(host)) {
    if (pathname === "/app" || pathname.startsWith("/app/")) {
      return NextResponse.redirect(`${SITE.appUrl}${pathname}${search}`, 302);
    }
    if (pathname === "/landing") {
      return NextResponse.redirect(new URL("/", request.url), 301);
    }
  }

  // App host (app.basemate.app): root is the dashboard, marketing lives on the root domain.
  if (isAppHost(host)) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/app", request.url));
    }
    if (pathname === "/landing") {
      return NextResponse.redirect(`${SITE.baseUrl}/`, 302);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
