import { basemateFarcasterManifest } from "@/lib/embed";

export const dynamic = "force-static";

export function GET() {
  return Response.json(basemateFarcasterManifest(), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
