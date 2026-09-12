"use client";

import { useState } from "react";
import Image from "next/image";

import { OnrampPaymentFrame } from "@/app/pay/onramp-payment-frame";
import { ISTONK_PAY_OG_PATH } from "@/lib/istonks-pay";

type PaymentOption = {
  method: "apple_pay" | "google_pay";
  label: "Apple Pay" | "Google Pay";
  url: string;
};

export function IstonkPayClient({
  sessionToken,
  amountUsd,
  giftLabel,
  recipientDisplay,
  needsVerify,
  expiresAt,
  paymentLinkOptions,
  hostedFallbackUrl,
}: {
  sessionToken?: string;
  amountUsd?: number;
  giftLabel?: string;
  recipientDisplay?: string;
  needsVerify: boolean;
  expiresAt: string;
  paymentLinkOptions: PaymentOption[];
  hostedFallbackUrl?: string;
}) {
  const [checkout, setCheckout] = useState<{
    options: PaymentOption[];
    expiresAt: string;
    hostedFallbackUrl?: string;
  } | null>(
    !needsVerify && paymentLinkOptions.length > 0
      ? { options: paymentLinkOptions, expiresAt, hostedFallbackUrl }
      : null,
  );
  const [email, setEmail] = useState("");
  const [tos, setTos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedAmount =
    typeof amountUsd === "number" && Number.isFinite(amountUsd) && amountUsd > 0
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: amountUsd % 1 === 0 ? 0 : 2,
        }).format(amountUsd)
      : null;

  const title = formattedAmount
    ? `Add ${formattedAmount} to send ${giftLabel ?? "the stock"}`
    : "Fund your iStonk send";
  const subtitle = recipientDisplay
    ? `Buy USDC on Base with Apple Pay, then iStonk sends it to ${recipientDisplay}.`
    : "Buy USDC on Base with Apple Pay. iStonk buys the stock and sends it after it clears.";

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/istonks/pay/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionToken, email, tosAccepted: tos }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        paymentLinkUrl?: string;
        paymentLinkOptions?: PaymentOption[];
        hostedFallbackUrl?: string;
        expiresAt?: string;
      };
      if (!res.ok || !data.expiresAt) {
        setError(data.error ?? "Could not start Apple Pay.");
        return;
      }
      const options =
        data.paymentLinkOptions?.filter(
          (o) =>
            (o.method === "apple_pay" || o.method === "google_pay") &&
            typeof o.url === "string" &&
            o.url.startsWith("https://"),
        ) ?? [];
      if (options.length === 0 && data.paymentLinkUrl?.startsWith("https://")) {
        options.push({
          method: data.paymentLinkUrl.toLowerCase().includes("google") ? "google_pay" : "apple_pay",
          label: data.paymentLinkUrl.toLowerCase().includes("google") ? "Google Pay" : "Apple Pay",
          url: data.paymentLinkUrl,
        });
      }
      if (options.length === 0) {
        setError("Apple Pay is not available for this session yet. Try again.");
        return;
      }
      setCheckout({
        options,
        expiresAt: data.expiresAt,
        hostedFallbackUrl: data.hostedFallbackUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Apple Pay.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className="overflow-hidden rounded-[22px] border border-border/80 bg-card"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <header className="flex flex-col items-center gap-4 border-b border-border/60 bg-gradient-to-b from-secondary/40 to-card px-5 pb-6 pt-6 text-center">
        <Image
          src={ISTONK_PAY_OG_PATH}
          alt=""
          width={320}
          height={180}
          className="h-auto w-full max-w-[280px] rounded-[18px] object-cover shadow-sm"
          priority
        />
        <div className="w-full max-w-sm space-y-1.5">
          <h1 className="font-display text-xl font-bold leading-tight tracking-tight sm:text-2xl">
            {title}
          </h1>
          <p className="text-sm leading-snug text-muted-foreground">{subtitle}</p>
        </div>
      </header>

      {checkout ? (
        <OnrampPaymentFrame
          flow="onramp"
          layout="embedded"
          paymentLinkOptions={checkout.options}
          expiresAt={checkout.expiresAt}
          sessionToken={sessionToken}
          hostedFallbackUrl={checkout.hostedFallbackUrl}
          successPath="/istonks/pay/success"
          recordPath="/api/istonks/pay/record-funding"
          pollingSuccessMessage="Done. Your USDC is on its way — iStonk will buy and send the stock."
        />
      ) : (
        <form onSubmit={onVerify} className="flex flex-col gap-4 px-5 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Coinbase needs an email and a terms tap before Apple Pay. Your iMessage number is already
            verified.
          </p>
          <label className="grid gap-1.5 text-left">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              placeholder="you@email.com"
            />
          </label>
          <label className="flex items-start gap-2 text-left text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={tos}
              onChange={(e) => setTos(e.target.checked)}
              className="mt-1"
              required
            />
            <span>
              I agree to Coinbase Guest Checkout, the User Agreement, and the Privacy Policy.
            </span>
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Starting checkout…" : "Continue to Apple Pay"}
          </button>
        </form>
      )}
    </article>
  );
}
