import { NextResponse } from "next/server";
import type { AnalyticsPayload } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const host = process.env.AGENT_API_HOST?.trim();
  if (!host) {
    return NextResponse.json(
      {
        error: "AGENT_API_HOST is not configured",
        detail: "Set AGENT_API_HOST in Railway Variables to your xmtp-agent URL, then redeploy.",
      },
      { status: 500 },
    );
  }

  const endpoint = `${host.replace(/\/$/, "")}/api/agent/analytics`;

  try {
    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream responded ${res.status}`, endpoint },
        { status: 502 },
      );
    }

    const data = (await res.json()) as AnalyticsPayload;
    return NextResponse.json(data, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to reach agent API",
        detail: err instanceof Error ? err.message : String(err),
        endpoint,
      },
      { status: 503 },
    );
  }
}
