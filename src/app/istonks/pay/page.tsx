import type { Metadata } from "next";

import { AlertCircle } from "lucide-react";

import { IstonkPayClient } from "@/app/istonks/pay/pay-client";
import { IstonkPayShell } from "@/app/istonks/pay/pay-shell";
import { basemateEmbedMetadata } from "@/lib/embed";
import {
  ISTONK_PAY_OG_HEIGHT,
  ISTONK_PAY_OG_PATH,
  ISTONK_PAY_OG_WIDTH,
  istonksApiHost,
} from "@/lib/istonks-pay";
import { resolveEmbeddablePaymentLinks } from "@/lib/embed-payment-links";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const origin = SITE.baseUrl;
  return basemateEmbedMetadata({
    title: "Send a stock on iMessage",
    description: "Apple Pay onramp to buy a tokenized stock and send it to a phone number.",
    url: `${origin}/istonks/pay`,
    origin,
    imageUrl: `${origin}${ISTONK_PAY_OG_PATH}`,
    imageWidth: ISTONK_PAY_OG_WIDTH,
    imageHeight: ISTONK_PAY_OG_HEIGHT,
    buttonTitle: "Open iStonk",
  });
}

type SearchParams = Promise<{ s?: string | string[] }>;

export interface FundPaymentLinkOption {
  method: "apple_pay" | "google_pay";
  label: "Apple Pay" | "Google Pay";
  url: string;
}

interface FundSessionResponse {
  paymentLinkUrl?: string;
  paymentLinkOptions?: FundPaymentLinkOption[];
  hostedFallbackUrl?: string;
  amountUsd?: number;
  expiresAt?: string;
  needsVerify?: boolean;
  isGift?: boolean;
  giftLabel?: string;
  recipientDisplay?: string;
  error?: string;
}

export default async function IstonkPayPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.s) ? params.s[0] : params.s;
  const session = token ? await resolveFundSession(token) : null;

  return (
    <IstonkPayShell>
      <section className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 py-4 sm:py-8">
        {session && !session.error ? (
          <IstonkPayClient
            sessionToken={token}
            amountUsd={session.amountUsd}
            giftLabel={session.giftLabel}
            recipientDisplay={session.recipientDisplay}
            needsVerify={Boolean(session.needsVerify)}
            expiresAt={session.expiresAt ?? new Date(Date.now() + 10 * 60_000).toISOString()}
            paymentLinkOptions={paymentLinkOptionsForSession(session)}
            hostedFallbackUrl={session.hostedFallbackUrl}
          />
        ) : (
          <PayErrorCard
            message={
              session?.error ??
              "Open the Apple Pay link iStonk sent you in iMessage to continue."
            }
          />
        )}
      </section>
    </IstonkPayShell>
  );
}

async function resolveFundSession(
  token: string,
): Promise<FundSessionResponse> {
  const apiHost = istonksApiHost();
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
    const body = (await res.json()) as FundSessionResponse;
    if (!res.ok) {
      return { error: body.error ?? "This fund link is invalid or expired." };
    }
    if (body.needsVerify) {
      return {
        needsVerify: true,
        amountUsd: body.amountUsd,
        expiresAt: body.expiresAt,
        giftLabel: body.giftLabel,
        recipientDisplay: body.recipientDisplay,
        isGift: body.isGift,
      };
    }
    if (!body.paymentLinkUrl || !body.expiresAt) {
      return { error: body.error ?? "This fund link is invalid or expired." };
    }
    return {
      paymentLinkUrl: body.paymentLinkUrl,
      paymentLinkOptions: body.paymentLinkOptions?.filter(isFundPaymentLinkOption),
      hostedFallbackUrl:
        typeof body.hostedFallbackUrl === "string" && body.hostedFallbackUrl.startsWith("https://")
          ? body.hostedFallbackUrl
          : undefined,
      amountUsd: body.amountUsd,
      expiresAt: body.expiresAt,
      giftLabel: body.giftLabel,
      recipientDisplay: body.recipientDisplay,
      isGift: body.isGift,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not load this fund link.",
    };
  }
}

function paymentLinkOptionsForSession(session: FundSessionResponse): FundPaymentLinkOption[] {
  if (!session.paymentLinkUrl) return session.paymentLinkOptions?.filter(isFundPaymentLinkOption) ?? [];
  const embeddable = resolveEmbeddablePaymentLinks({
    paymentLinkUrl: session.paymentLinkUrl,
    paymentLinkOptions: session.paymentLinkOptions,
  });
  if (embeddable.length > 0) return embeddable;
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
    <div
      className="mx-auto flex w-full flex-col items-center gap-3 rounded-[20px] border border-border/80 bg-card p-6 text-center"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold">Payment link unavailable</h2>
        <p className="text-sm leading-6 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
