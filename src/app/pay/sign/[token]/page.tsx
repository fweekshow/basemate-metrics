import type { Metadata } from "next";

import { PaySignClient } from "@/app/pay/sign/pay-sign-client";
import { SiteShell } from "@/components/site/site-shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Confirm your payment · Basemate",
  description: "Review and confirm your Basemate payment on Base.",
  openGraph: {
    title: "Confirm your payment · Basemate",
    description: "Review and confirm your Basemate payment on Base.",
    type: "website",
    images: [SITE.pfp],
  },
};

type PaySignPageProps = {
  params: Promise<{ token: string }>;
};

export default async function PaySignPage({ params }: PaySignPageProps) {
  const { token } = await params;

  return (
    <SiteShell>
      <PaySignClient token={token} />
    </SiteShell>
  );
}
