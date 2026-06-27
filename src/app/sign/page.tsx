import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteShell } from "@/components/site/site-shell";
import { SignTransaction } from "@/components/sign/sign-transaction";
import { isValidProlink } from "@/lib/embed";
import { decodeSignRequest } from "@/lib/sign";

export const metadata: Metadata = {
  title: "Sign transaction · Basemate",
  description: "Review and sign your transaction with your Base Account.",
  // Don't index or unfurl — this URL carries a one-time signing payload.
  robots: { index: false, follow: false },
};

type SignPageProps = {
  searchParams: Promise<{
    p?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SignPage({ searchParams }: SignPageProps) {
  const params = await searchParams;
  const prolink = firstParam(params.p);
  if (!isValidProlink(prolink)) notFound();

  const request = await decodeSignRequest(prolink);
  if (!request) notFound();

  return (
    <SiteShell>
      <SignTransaction request={request} />
    </SiteShell>
  );
}
