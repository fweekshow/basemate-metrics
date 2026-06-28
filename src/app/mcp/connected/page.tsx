import type { Metadata } from "next";

import { SiteShell } from "@/components/site/site-shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Base MCP Connected · Basemate",
  description: "Your Base Account is connected to Basemate.",
  openGraph: {
    title: "Base MCP Connected · Basemate",
    description: "Your Base Account is connected to Basemate.",
    type: "website",
    images: [SITE.pfp],
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
