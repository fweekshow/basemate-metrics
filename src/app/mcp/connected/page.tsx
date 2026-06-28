import type { Metadata } from "next";
import Image from "next/image";

import { SiteShell } from "@/components/site/site-shell";
import { SITE, SITE_URL } from "@/lib/site";

const BASEMATE_LOGO_URL = new URL("/brand/logo/basemate-logo-flat.png", SITE_URL).toString();

export const metadata: Metadata = {
  title: "Base Account Connected · Basemate",
  description: "Your Base Account is connected to Basemate for transaction approvals.",
  openGraph: {
    title: "Base Account Connected · Basemate",
    description: "Your Base Account is connected to Basemate for transaction approvals.",
    type: "website",
    images: [
      {
        url: BASEMATE_LOGO_URL,
        alt: "Basemate logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Base Account Connected · Basemate",
    description: "Your Base Account is connected to Basemate for transaction approvals.",
    images: [BASEMATE_LOGO_URL],
  },
};

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "The authorization response was incomplete. Please try connecting again.",
  expired: "This connect link expired. Ask Basemate for a new one in iMessage.",
  token_exchange_failed: "We couldn't complete the connection with Base. Please try again.",
  not_configured: "Base MCP isn't fully configured yet. Please contact support.",
  server_error: "Something went wrong on our end. Please try again.",
};

type ConnectedPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function McpConnectedPage({ searchParams }: ConnectedPageProps) {
  const params = await searchParams;
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorMessage = errorCode
    ? ERROR_MESSAGES[errorCode] ?? "We couldn't complete the connection. Please try again."
    : null;

  return (
    <SiteShell>
      <div className="relative z-10 mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-card">
          <Image
            src="/brand/logo/basemate-logo-flat.png"
            alt={`${SITE.name} logo`}
            width={180}
            height={48}
            priority
          />
        </div>
        {errorMessage ? (
          <>
            <h1 className="text-2xl font-semibold text-foreground">Connection failed</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-foreground">Base MCP connected</h1>
            <p className="text-muted-foreground">
              Your Base Account is now linked to Basemate. Return to iMessage and resend your
              request — Basemate can now prepare transactions for you to approve.
            </p>
          </>
        )}
      </div>
    </SiteShell>
  );
}
