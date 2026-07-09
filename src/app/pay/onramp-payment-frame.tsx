"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";

interface OnrampPaymentFrameProps {
  flow: "onramp" | "offramp";
  paymentLinkOptions: FundPaymentLinkOption[];
  expiresAt: string;
}

interface FundPaymentLinkOption {
  method: "apple_pay" | "google_pay";
  label: "Apple Pay" | "Google Pay";
  url: string;
}

export function OnrampPaymentFrame({
  flow,
  paymentLinkOptions,
  expiresAt,
}: OnrampPaymentFrameProps) {
  const [selectedMethod, setSelectedMethod] = useState(
    paymentLinkOptions[0]?.method ?? "apple_pay",
  );
  const selectedOption =
    paymentLinkOptions.find((option) => option.method === selectedMethod) ??
    paymentLinkOptions[0];
  const expiresLabel = useMemo(() => formatExpiry(expiresAt), [expiresAt]);

  if (!selectedOption) return null;

  if (flow === "offramp") {
    return (
      <div className="mx-auto grid w-full max-w-xl gap-4">
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-border/70 bg-card/80 p-6 text-center shadow-sm">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Continue to Coinbase</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Coinbase cash-out links are single use. Tap the button when you are ready to complete the sell flow.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.assign(selectedOption.url);
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-[0.98]"
          >
            Cash out with Coinbase
          </button>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/80 p-4 text-center text-sm text-muted-foreground">
          Link expires {expiresLabel}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      {paymentLinkOptions.length > 1 ? (
        <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-card/80 p-2 shadow-sm">
          {paymentLinkOptions.map((option) => {
            const selected = option.method === selectedOption.method;
            return (
              <button
                key={option.method}
                type="button"
                onClick={() => {
                  setSelectedMethod(option.method);
                }}
                className={[
                  "rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-sm">
        <div className="border-b border-border/70 bg-muted/30 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Coinbase checkout
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Continue with {selectedOption.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Basemate prepared your USDC purchase on Base. Coinbase will handle the payment details in a secure checkout.
          </p>
        </div>

        <div className="grid gap-5 p-6">
          <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/80 p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Payment method</span>
              <span className="font-medium">{selectedOption.label}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">Base</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Link expires</span>
              <span className="font-medium">{expiresLabel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.assign(selectedOption.url);
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-[0.98]"
          >
            Continue with {selectedOption.label}
            <ExternalLink className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 rounded-2xl bg-primary/5 p-4 text-sm">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="leading-6 text-muted-foreground">
              You will leave Basemate briefly to complete checkout with Coinbase. Use your latest link before it expires.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-foreground">Checkout is ready.</p>
            <p>Tap the {selectedOption.label} button to continue securely with Coinbase.</p>
          </div>
        </div>
        <p className="shrink-0 text-xs">Link expires {expiresLabel}</p>
      </div>
    </div>
  );
}

function formatExpiry(expiresAt: string): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "soon";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
