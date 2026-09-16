"use client";

import { useState } from "react";
import Image from "next/image";

import { OnrampPaymentFrame } from "@/app/pay/onramp-payment-frame";
import { ISTONK_PAY_OG_PATH, formatUsdAmount, istonkPayCopy } from "@/lib/istonks-pay";

type PaymentOption = {
  method: "apple_pay" | "google_pay";
  label: "Apple Pay" | "Google Pay";
  url: string;
};

export function IstonkPayClient({
  sessionToken,
  amountUsd,
  isBitrefill,
  giftLabel,
  recipientDisplay,
  productName,
  needsVerify,
  needsOnrampPhone,
  expiresAt,
  paymentLinkOptions,
  hostedFallbackUrl,
}: {
  sessionToken?: string;
  amountUsd?: number;
  isBitrefill?: boolean;
  giftLabel?: string;
  recipientDisplay?: string;
  productName?: string;
  needsVerify: boolean;
  needsOnrampPhone?: boolean;
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
  const [phone, setPhone] = useState("");
  const [tos, setTos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = istonkPayCopy({
    isBitrefill,
    isGift: Boolean(giftLabel),
    productName,
    giftLabel,
    recipientDisplay,
    formattedAmount: formatUsdAmount(amountUsd),
  });
  const title = copy.title;
  const subtitle = copy.subtitle;

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/istonks/pay/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          email,
          tosAccepted: tos,
          ...(needsOnrampPhone || phone.trim() ? { phone: phone.trim() } : {}),
        }),
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
        setError(data.error ?? "Apple Pay is not available for this session yet. Try again.");
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
          recordPath="/api/pay/record-funding"
          pollingSuccessMessage={copy.pollingSuccess}
        />
      ) : (
        <form onSubmit={onVerify} className="flex flex-col gap-4 px-5 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {needsOnrampPhone
              ? "Coinbase needs your email, a US phone number, and a terms tap before Apple Pay."
              : "Coinbase needs an email and a terms tap before Apple Pay. Your iMessage number is already verified."}
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
          {needsOnrampPhone ? (
            <label className="grid gap-1.5 text-left">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                US phone
              </span>
              <input
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                placeholder="+1 555 123 4567"
              />
            </label>
          ) : null}
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
