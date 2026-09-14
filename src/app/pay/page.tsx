import type { Metadata } from "next";
import Image from "next/image";

import { AlertCircle } from "lucide-react";

import { IstonkPayClient } from "@/app/istonks/pay/pay-client";
import { OnrampPaymentFrame } from "@/app/pay/onramp-payment-frame";
import { OfframpFlow } from "@/app/pay/offramp-flow";
import { PayFlowShell } from "@/components/site/pay-flow-shell";
import { SiteShell } from "@/components/site/site-shell";
import { basemateEmbedMetadata } from "@/lib/embed";
import { resolveEmbeddablePaymentLinks } from "@/lib/embed-payment-links";
import {
  ISTONK_PAY_OG_HEIGHT,
  ISTONK_PAY_OG_PATH,
  ISTONK_PAY_OG_WIDTH,
  formatUsdAmount,
  istonkPayCopy,
} from "@/lib/istonks-pay";
import { fetchFundSessionFromPayAgents, type PayAgentKind } from "@/lib/pay-agents";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PayPageSearchParams = Promise<{
  s?: string | string[];
  o?: string | string[];
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: PayPageSearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const token = Array.isArray(params.s) ? params.s[0] : params.s;
  const session = token ? await resolveFundSession(token) : null;
  if (session && !session.error && isIstonkCheckout(session)) {
    const copy = istonkPayCopy({
      isBitrefill: Boolean(session.isBitrefill),
      isGift: Boolean(session.isGift),
      productName: session.productName,
      giftLabel: session.giftLabel,
      formattedAmount: formatUsdAmount(session.amountUsd),
    });
    const origin = SITE.baseUrl;
    return basemateEmbedMetadata({
      title: copy.ogTitle,
      description: copy.ogDescription,
      url: `${origin}/pay`,
      origin,
      imageUrl: `${origin}${ISTONK_PAY_OG_PATH}`,
      imageWidth: ISTONK_PAY_OG_WIDTH,
      imageHeight: ISTONK_PAY_OG_HEIGHT,
      buttonTitle: "Open iStonk",
    });
  }
  return {
    title: "Pay · Basemate",
    description: "Move money in and out of your Basemate account.",
    openGraph: {
      title: "Pay · Basemate",
      description: "Move money in and out of your Basemate account.",
      type: "website",
      images: [SITE.pfp],
    },
  };
}

interface FundSessionResponse {
  paymentLinkUrl?: string;
  paymentLinkOptions?: FundPaymentLinkOption[];
  hostedFallbackUrl?: string;
  amountUsd?: number;
  expiresAt?: string;
  needsVerify?: boolean;
  isGift?: boolean;
  isBitrefill?: boolean;
  giftLabel?: string;
  recipientDisplay?: string;
  productName?: string;
  source?: PayAgentKind;
  error?: string;
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
  const offrampToken = Array.isArray(params.o) ? params.o[0] : params.o;
  if (offrampToken) {
    return (
      <SiteShell>
        <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
          <OfframpHeader />
          <OfframpFlow token={offrampToken} mode="launch" />
        </section>
      </SiteShell>
    );
  }
  const session = token ? await resolveFundSession(token) : null;
  const flow = session?.paymentLinkUrl ? flowForPaymentUrl(session.paymentLinkUrl) : "onramp";

  const Shell = token ? PayFlowShell : SiteShell;

  return (
    <Shell>
      <section className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 py-4 sm:py-8">
        {session && !session.error && isIstonkCheckout(session) ? (
          <IstonkPayClient
            sessionToken={token}
            amountUsd={session.amountUsd}
            isBitrefill={Boolean(session.isBitrefill)}
            giftLabel={session.giftLabel}
            recipientDisplay={session.recipientDisplay}
            productName={session.productName}
            needsVerify={Boolean(session.needsVerify)}
            expiresAt={session.expiresAt ?? new Date(Date.now() + 10 * 60_000).toISOString()}
            paymentLinkOptions={paymentLinkOptionsForSession(session)}
            hostedFallbackUrl={session.hostedFallbackUrl}
          />
        ) : session?.paymentLinkUrl && session.expiresAt ? (
          <article
            className="overflow-hidden rounded-[22px] border border-border/80 bg-card"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <PayFundHeader flow={flow} amountUsd={session.amountUsd} variant="inCard" />
            <OnrampPaymentFrame
              flow={flow}
              layout="embedded"
              paymentLinkOptions={paymentLinkOptionsForSession(session)}
              expiresAt={session.expiresAt}
              sessionToken={token}
              hostedFallbackUrl={session.hostedFallbackUrl}
            />
          </article>
        ) : (
          <>
            <PayFundHeader flow="onramp" />
            <PayErrorCard message={session?.error ?? "Open the fund link Basemate sent you to continue."} />
          </>
        )}
      </section>
    </Shell>
  );
}

function PayFundHeader({
  flow,
  amountUsd,
  variant = "standalone",
}: {
  flow: "onramp" | "offramp";
  amountUsd?: number;
  variant?: "standalone" | "inCard";
}) {
  const formattedAmount =
    typeof amountUsd === "number" && Number.isFinite(amountUsd) && amountUsd > 0
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: amountUsd % 1 === 0 ? 0 : 2,
        }).format(amountUsd)
      : null;

  const title =
    flow === "offramp"
      ? "Cash out from Basemate"
      : formattedAmount
        ? `Add ${formattedAmount} to your account`
        : "Fund your Basemate Account";

  const subtitle =
    flow === "offramp"
      ? "Sell USDC on Base and send proceeds to your bank via Coinbase."
      : formattedAmount
        ? "Buy USDC on Base with Apple Pay or Google Pay — without leaving this page."
        : "Use Apple Pay or Google Pay to buy USDC on Base without leaving this page.";

  return (
    <header
      className={
        variant === "inCard"
          ? "flex flex-col items-center gap-4 border-b border-border/60 bg-gradient-to-b from-secondary/40 to-card px-5 pb-6 pt-6 text-center"
          : "flex flex-col items-center gap-4 text-center"
      }
    >
      <Image
        src="/brand/mascot/mate-eyes-blue.png"
        alt=""
        width={variant === "inCard" ? 128 : 96}
        height={variant === "inCard" ? 128 : 96}
        className={
          variant === "inCard"
            ? "h-28 w-28 shrink-0 rounded-[22px] object-cover shadow-sm sm:h-32 sm:w-32"
            : "h-24 w-24 shrink-0 rounded-[20px] object-cover"
        }
        style={variant === "inCard" ? { boxShadow: "var(--shadow-card)" } : { boxShadow: "var(--shadow-card)" }}
        priority
      />
      <div className={variant === "inCard" ? "w-full max-w-sm space-y-1.5" : "space-y-2"}>
        <h1
          className={
            variant === "inCard"
              ? "font-display text-xl font-bold leading-tight tracking-tight sm:text-2xl"
              : "font-display text-2xl font-bold tracking-tight sm:text-3xl"
          }
        >
          {title}
        </h1>
        <p
          className={
            variant === "inCard"
              ? "text-sm leading-snug text-muted-foreground"
              : "text-sm leading-relaxed text-muted-foreground sm:text-base"
          }
        >
          {subtitle}
        </p>
        {flow === "onramp" && variant !== "inCard" ? (
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground/80">
            USDC · Base · Coinbase
          </p>
        ) : null}
      </div>
    </header>
  );
}

function OfframpHeader() {
  return (
    <header className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-card p-2"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <Image
          src="/brand/mascot/mate-peace.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
        />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Cash out from Basemate
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Configure your sale with Coinbase, then approve the exact USDC transfer from your Base
          Account.
        </p>
      </div>
    </header>
  );
}

function isIstonkCheckout(session: FundSessionResponse): boolean {
  return session.source === "istonk" || Boolean(session.isGift) || Boolean(session.isBitrefill);
}

function intentFieldsFromSession(body: Record<string, unknown>) {
  const intent = body.intent as { kind?: string; productName?: string } | undefined;
  const isBitrefill = body.isBitrefill === true || intent?.kind === "bitrefill";
  const isGift = body.isGift === true || intent?.kind === "gift_stock";
  return {
    isGift,
    isBitrefill,
    giftLabel: typeof body.giftLabel === "string" ? body.giftLabel : undefined,
    recipientDisplay: typeof body.recipientDisplay === "string" ? body.recipientDisplay : undefined,
    productName:
      typeof body.productName === "string"
        ? body.productName
        : intent?.kind === "bitrefill"
          ? intent.productName
          : undefined,
  };
}

async function resolveFundSession(token: string): Promise<FundSessionResponse> {
  const result = await fetchFundSessionFromPayAgents(token);
  if (!result) {
    return { error: "This fund link is invalid or expired." };
  }

  const body = result.data;
  const amountUsd =
    typeof body.amountUsd === "number" && Number.isFinite(body.amountUsd) && body.amountUsd > 0
      ? body.amountUsd
      : undefined;
  const paymentLinkUrl = typeof body.paymentLinkUrl === "string" ? body.paymentLinkUrl : undefined;
  const expiresAt = typeof body.expiresAt === "string" ? body.expiresAt : undefined;
  const intent = intentFieldsFromSession(body);
  const isIstonk = result.kind === "istonk" || intent.isGift || intent.isBitrefill;
  const needsVerify =
    body.needsVerify === true || paymentLinkUrl === "pending://checkout" || !paymentLinkUrl;

  if (needsVerify) {
    if (isIstonk) {
      return {
        needsVerify: true,
        amountUsd,
        expiresAt,
        source: result.kind,
        ...intent,
      };
    }
    return { error: typeof body.error === "string" ? body.error : "This fund link is invalid or expired." };
  }

  if (!paymentLinkUrl || !expiresAt) {
    return { error: typeof body.error === "string" ? body.error : "This fund link is invalid or expired." };
  }

  return {
    paymentLinkUrl,
    paymentLinkOptions: Array.isArray(body.paymentLinkOptions)
      ? body.paymentLinkOptions.filter(isFundPaymentLinkOption)
      : undefined,
    hostedFallbackUrl:
      typeof body.hostedFallbackUrl === "string" && body.hostedFallbackUrl.startsWith("https://")
        ? body.hostedFallbackUrl
        : undefined,
    amountUsd,
    expiresAt,
    source: result.kind,
    ...intent,
  };
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

function flowForPaymentUrl(url: string): "onramp" | "offramp" {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "pay.coinbase.com" && parsed.pathname.startsWith("/v3/sell/")
      ? "offramp"
      : "onramp";
  } catch {
    return "onramp";
  }
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
