import type { Metadata } from "next";

import { IstonkPayShell } from "@/app/istonks/pay/pay-shell";
import { IstonkPaySuccessClient } from "@/app/istonks/pay/success/success-client";
import { basemateEmbedMetadata } from "@/lib/embed";
import {
  ISTONK_PAY_OG_HEIGHT,
  ISTONK_PAY_OG_PATH,
  ISTONK_PAY_OG_WIDTH,
} from "@/lib/istonks-pay";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const origin = SITE.baseUrl;
  return basemateEmbedMetadata({
    title: "Apple Pay confirmed",
    description: "iStonk is buying the stock and sending it now.",
    url: `${origin}/istonks/pay/success`,
    origin,
    imageUrl: `${origin}${ISTONK_PAY_OG_PATH}`,
    imageWidth: ISTONK_PAY_OG_WIDTH,
    imageHeight: ISTONK_PAY_OG_HEIGHT,
    buttonTitle: "Open iStonk",
  });
}

type SearchParams = Promise<{ s?: string | string[] }>;

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
