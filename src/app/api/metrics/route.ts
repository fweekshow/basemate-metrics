import { NextResponse } from "next/server";
import type { AnalyticsPayload } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HOST = process.env.AGENT_API_HOST ?? "http://localhost:3000";
const ENDPOINT = `${HOST.replace(/\/$/, "")}/api/agent/analytics`;

export async function GET() {
  try {
    const res = await fetch(ENDPOINT, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream responded ${res.status}`, endpoint: ENDPOINT },
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
        endpoint: ENDPOINT,
      },
      { status: 503 },
    );
  }
}
