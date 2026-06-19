import { basemateFarcasterManifest } from "@/lib/embed";

export const dynamic = "force-static";

/** Self-hosted manifest (hosted id 019ee00b-481a-c102-e73e-c48b8425daf4). */
export function GET() {
  return Response.json(basemateFarcasterManifest(), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
