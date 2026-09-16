import type { Metadata } from "next";

import { IstonkPayShell } from "@/app/istonks/pay/pay-shell";
import { IstonkPaySuccessClient } from "@/app/istonks/pay/success/success-client";
import { PaySuccessClient } from "@/app/pay/success/pay-success-client";
import { PayFlowShell } from "@/components/site/pay-flow-shell";
import { fetchFundSessionFromPayAgents } from "@/lib/pay-agents";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PaySuccessSearchParams = Promise<{
  s?: string | string[];
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: PaySuccessSearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const token = Array.isArray(params.s) ? params.s[0] : params.s;
  const istonk = token ? await isIstonkSession(token) : false;
  if (istonk) {
    return {
      title: "Apple Pay confirmed · iStonk",
      description: "Your Apple Pay went through. iStonk is finishing your send.",
    };
  }
  return {
    title: "Payment Complete · Basemate",
    description: "Your Basemate Account funding payment was submitted successfully.",
    openGraph: {
      title: "Payment Complete · Basemate",
      description: "Your Basemate Account funding payment was submitted successfully.",
      type: "website",
      images: [SITE.pfp],
    },
  };
}

export default async function PaySuccessPage({
  searchParams,
}: {
  searchParams: PaySuccessSearchParams;
}) {
  const params = await searchParams;
  const sessionToken = Array.isArray(params.s) ? params.s[0] : params.s;
  const istonk = sessionToken ? await isIstonkSession(sessionToken) : false;

  if (istonk) {
    return (
      <IstonkPayShell>
        <IstonkPaySuccessClient sessionToken={sessionToken} />
      </IstonkPayShell>
    );
  }

  return (
    <PayFlowShell>
      <PaySuccessClient sessionToken={sessionToken} />
    </PayFlowShell>
  );
}

async function isIstonkSession(token: string): Promise<boolean> {
  const result = await fetchFundSessionFromPayAgents(token);
  if (!result?.ok) {
    // Still try gift-status via istonk host for just-paid sessions.
    return result?.kind === "istonk";
  }
  const data = result.data;
  return (
    result.kind === "istonk" ||
    data.product === "istonk" ||
    data.isGift === true ||
    data.isBitrefill === true ||
    (data.intent as { kind?: string } | undefined)?.kind === "gift_stock" ||
    (data.intent as { kind?: string } | undefined)?.kind === "bitrefill"
  );
}
