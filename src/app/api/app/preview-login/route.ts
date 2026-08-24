import { NextResponse } from "next/server";

import { appUiPreviewServerEnabled, uiPreviewSession } from "@/lib/app-ui-preview";
import { applyAppSessionCookie } from "@/lib/app-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Dev-only: one-click session for UI preview (mock APIs, no agent/CDP). */
export async function POST() {
  if (!appUiPreviewServerEnabled()) {
    return NextResponse.json({ error: "UI preview is disabled." }, { status: 404 });
  }
  const session = uiPreviewSession();
  const res = NextResponse.json({ ok: true, preview: true, address: session.address });
  applyAppSessionCookie(res, session);
  return res;
}
