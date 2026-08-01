import type { Metadata } from "next";

import { PayFlowShell } from "@/components/site/pay-flow-shell";
import { SITE } from "@/lib/site";
import { PaySuccessClient } from "@/app/pay/success/pay-success-client";

export const metadata: Metadata = {
  title: "Payment Complete · Basemate",
  description: "Your Basemate Account funding payment was submitted successfully.",
  openGraph: {
    title: "Payment Complete · Basemate",
    description: "Your Basemate Account funding payment was submitted successfully.",
    type: "website",
    images: [SITE.pfp],
  },
};

type PaySuccessSearchParams = Promise<{
  s?: string | string[];
}>;

export default async function PaySuccessPage({
  searchParams,
}: {
  searchParams: PaySuccessSearchParams;
}) {
  const params = await searchParams;
  const sessionToken = Array.isArray(params.s) ? params.s[0] : params.s;

  return (
    <PayFlowShell>
      <PaySuccessClient sessionToken={sessionToken} />
    </PayFlowShell>
  );
}
