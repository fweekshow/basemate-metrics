import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  DATA_ROOM_COOKIE,
  isDataRoomProtectedPath,
  verifyDataRoomTokenEdge,
} from "@/lib/data-room-auth-edge";

function isMetricsHost(host: string) {
  const normalized = host.toLowerCase();
  return (
    normalized.startsWith("metrics.") ||
    normalized.includes("basemate-metrics")
  );
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (isMetricsHost(host) && pathname === "/") {
    return NextResponse.rewrite(new URL("/metrics", request.url));
  }

  if (isDataRoomProtectedPath(pathname)) {
    const token = request.cookies.get(DATA_ROOM_COOKIE)?.value;
    const unlocked = await verifyDataRoomTokenEdge(token);

    // /data-room itself renders the gate when locked.
    if (!unlocked && pathname !== "/data-room" && !pathname.startsWith("/data-room/")) {
      const unlockUrl = new URL("/data-room", request.url);
      unlockUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(unlockUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Pages (exclude static files with extensions) + investor PDFs.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/deck.pdf",
    "/onepager.pdf",
    "/investor-update.pdf",
  ],
};
