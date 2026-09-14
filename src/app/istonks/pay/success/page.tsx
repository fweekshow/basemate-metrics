import type { Metadata } from "next";

import { IstonkPayShell } from "@/app/istonks/pay/pay-shell";
import { IstonkPaySuccessClient } from "@/app/istonks/pay/success/success-client";
import { basemateEmbedMetadata } from "@/lib/embed";
import {
  ISTONK_PAY_OG_HEIGHT,
  ISTONK_PAY_OG_PATH,
  ISTONK_PAY_OG_WIDTH,
  istonkPayCopy,
  istonksApiHost,
} from "@/lib/istonks-pay";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{ s?: string | string[] }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const token = Array.isArray(params.s) ? params.s[0] : params.s;
  const session = token ? await peekFundSession(token) : null;
  const copy = istonkPayCopy({
    isBitrefill: Boolean(session?.isBitrefill),
    productName: session?.productName,
    giftLabel: session?.giftLabel,
  });
  const origin = SITE.baseUrl;
  return basemateEmbedMetadata({
    title: "Apple Pay confirmed",
    description: copy.successOgDescription,
    url: `${origin}/istonks/pay/success`,
    origin,
    imageUrl: `${origin}${ISTONK_PAY_OG_PATH}`,
    imageWidth: ISTONK_PAY_OG_WIDTH,
    imageHeight: ISTONK_PAY_OG_HEIGHT,
    buttonTitle: "Open iStonk",
  });
}

export default async function IstonkPaySuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sessionToken = Array.isArray(params.s) ? params.s[0] : params.s;
  return (
    <IstonkPayShell>
      <IstonkPaySuccessClient sessionToken={sessionToken} />
    </IstonkPayShell>
  );
}

async function peekFundSession(token: string): Promise<{
  isBitrefill?: boolean;
  productName?: string;
  giftLabel?: string;
} | null> {
  const apiHost = istonksApiHost();
  if (!apiHost) return null;
  const endpoint = new URL("/api/agent/fund-session", apiHost.replace(/\/$/, ""));
  endpoint.searchParams.set("token", token);
  try {
    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      isBitrefill?: boolean;
      productName?: string;
      giftLabel?: string;
    };
  } catch {
    return null;
  }
}
