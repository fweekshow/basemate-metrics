import { headers } from "next/headers";

import { SITE } from "@/lib/site";

/** Public origin for the current request — app subdomain vs root domain. */
export function resolvePublicOrigin(hostHeader?: string | null): string {
  const host = hostHeader?.split(":")[0]?.toLowerCase();
  if (host === "app.basemate.app") return SITE.appUrl;
  if (host === "basemate.app" || host === "www.basemate.app") return SITE.baseUrl;
  return SITE.appUrl;
}

export async function getRequestOrigin(): Promise<string> {
  const host = (await headers()).get("host");
  return resolvePublicOrigin(host);
}
