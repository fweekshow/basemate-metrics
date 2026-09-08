import { NextResponse } from "next/server";

import { isAddress } from "@/lib/istonks";
import { fetchAgentJson } from "@/lib/istonks-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/** Public proxy → AGENT_API_HOST /api/agent/istonks/token/:address */
export async function GET(_req: Request, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;

  if (!isAddress(address)) {
    return NextResponse.json(
      { error: "Not a Base token address." },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const result = await fetchAgentJson(
    `/api/agent/istonks/token/${encodeURIComponent(address.toLowerCase())}`,
  );

  if (result.ok) {
    return NextResponse.json(result.data, { headers: { "cache-control": "no-store" } });
  }
  if (result.status === 404) {
    return NextResponse.json(
      { token: null, unavailable: true },
      { headers: { "cache-control": "no-store" } },
    );
  }
  return NextResponse.json(
    { error: result.error ?? "Failed to reach agent API", endpoint: result.endpoint },
    { status: result.status >= 500 ? 502 : result.status, headers: { "cache-control": "no-store" } },
  );
}
