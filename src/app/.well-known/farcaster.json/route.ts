export const dynamic = "force-static";

const HOSTED_MANIFEST_URL =
  "https://api.farcaster.xyz/miniapps/hosted-manifest/019ee00b-481a-c102-e73e-c48b8425daf4";

/** Farcaster-hosted manifest — temporary redirect per mini app setup. */
export function GET() {
  return Response.redirect(HOSTED_MANIFEST_URL, 307);
}
