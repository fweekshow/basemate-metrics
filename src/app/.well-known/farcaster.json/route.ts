import { basemateFarcasterManifest } from "@/lib/embed";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export async function GET() {
  const origin = await getRequestOrigin();
  return Response.json(basemateFarcasterManifest(origin), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
