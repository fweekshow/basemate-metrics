export const dynamic = "force-static";

const HOSTED_MANIFEST_URL =
  "https://api.farcaster.xyz/miniapps/hosted-manifest/019ee014-736b-e298-cefa-47bb3a409b5f";

/** 307 to Farcaster hosted manifest — required for domain verification to complete. */
export function GET() {
  return Response.redirect(HOSTED_MANIFEST_URL, 307);
}
