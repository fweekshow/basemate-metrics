import { fetchAgentJson, proxyResponse } from "@/lib/istonks-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/** Public proxy → AGENT_API_HOST /api/agent/istonks/stocks */
export async function GET() {
  const result = await fetchAgentJson("/api/agent/istonks/stocks");
  return proxyResponse(result, "stocks");
}
