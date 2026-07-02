import type { Metadata } from "next";

import { AlertCircle, Wallet } from "lucide-react";

import { OnrampPaymentFrame } from "@/app/pay/onramp-payment-frame";
import { SiteShell } from "@/components/site/site-shell";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pay · Basemate",
  description: "Fund your Basemate wallet with Apple Pay or Google Pay.",
  openGraph: {
    title: "Pay · Basemate",
    description: "Fund your Basemate wallet with Apple Pay or Google Pay.",
    type: "website",
    images: [SITE.pfp],
  },
};

type PayPageSearchParams = Promise<{
  s?: string | string[];
}>;

interface FundSessionResponse {
  paymentLinkUrl: string;
  paymentLinkOptions?: FundPaymentLinkOption[];
  expiresAt: string;
}

export interface FundPaymentLinkOption {
  method: "apple_pay" | "google_pay";
  label: "Apple Pay" | "Google Pay";
  url: string;
}

export default async function PayPage({
  searchParams,
}: {
  searchParams: PayPageSearchParams;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.s) ? params.s[0] : params.s;
  const session = token ? await resolveFundSession(token) : null;

  return (
    <SiteShell>
      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <Wallet className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Fund your Basemate wallet
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Use Apple Pay or Google Pay to buy USDC on Base without leaving this page.
            </p>
          </div>
        </header>

        {session?.paymentLinkUrl ? (
          <OnrampPaymentFrame
            paymentLinkOptions={paymentLinkOptionsForSession(session)}
            expiresAt={session.expiresAt}
          />
        ) : (
          <PayErrorCard message={session?.error ?? "Open the fund link Basemate sent you to continue."} />
        )}
      </section>
    </SiteShell>
  );
}

async function resolveFundSession(
  token: string,
): Promise<(FundSessionResponse & { error?: never }) | { error: string; paymentLinkUrl?: never; expiresAt?: never }> {
  const apiHost =
    process.env.CHANNELS_API_HOST?.trim() ||
    process.env.IMESSAGE_PORTFOLIO_API_HOST?.trim() ||
    process.env.AGENT_API_HOST?.trim();

  if (!apiHost) {
    return { error: "Fund session API is not configured." };
  }

  const endpoint = new URL("/api/agent/fund-session", apiHost.replace(/\/$/, ""));
  endpoint.searchParams.set("token", token);

  try {
    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    const body = (await res.json()) as Partial<FundSessionResponse> & { error?: string };

    if (!res.ok || !body.paymentLinkUrl || !body.expiresAt) {
      return { error: body.error ?? "This fund link is invalid or expired." };
    }

    return {
      paymentLinkUrl: body.paymentLinkUrl,
      paymentLinkOptions: body.paymentLinkOptions?.filter(isFundPaymentLinkOption),
      expiresAt: body.expiresAt,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not load this fund link.",
    };
  }
}

function paymentLinkOptionsForSession(session: FundSessionResponse): FundPaymentLinkOption[] {
  if (session.paymentLinkOptions?.length) return session.paymentLinkOptions;

  return [
    {
      method: session.paymentLinkUrl.toLowerCase().includes("google") ? "google_pay" : "apple_pay",
      label: session.paymentLinkUrl.toLowerCase().includes("google") ? "Google Pay" : "Apple Pay",
      url: session.paymentLinkUrl,
    },
  ];
}

function isFundPaymentLinkOption(value: unknown): value is FundPaymentLinkOption {
  if (!value || typeof value !== "object") return false;
  const option = value as Partial<FundPaymentLinkOption>;
  return (
    (option.method === "apple_pay" || option.method === "google_pay") &&
    (option.label === "Apple Pay" || option.label === "Google Pay") &&
    typeof option.url === "string" &&
    option.url.startsWith("https://")
  );
}

function PayErrorCard({ message }: { message: string }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 rounded-3xl border border-border/70 bg-card/80 p-6 text-center shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Payment link unavailable</h2>
        <p className="text-sm leading-6 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
