"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

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

interface OnrampPostMessage {
  eventName?: string;
  data?: {
    errorCode?: string;
    errorMessage?: string;
  };
}

const EVENT_COPY: Record<string, { tone: "pending" | "success" | "error"; message: string }> = {
  "onramp_api.load_pending": {
    tone: "pending",
    message: "Loading payment button...",
  },
  "onramp_api.load_success": {
    tone: "success",
    message: "Payment button is ready.",
  },
  "onramp_api.commit_success": {
    tone: "success",
    message: "Payment started. Keep this page open while Coinbase confirms the transfer.",
  },
  "onramp_api.polling_start": {
    tone: "pending",
    message: "Confirming your purchase...",
  },
  "onramp_api.polling_success": {
    tone: "success",
    message: "Done. Your USDC is on its way to your Basemate wallet.",
  },
  "onramp_api.cancel": {
    tone: "error",
    message: "Payment cancelled.",
  },
};

export function OnrampPaymentFrame({
  flow,
  paymentLinkOptions,
  expiresAt,
}: OnrampPaymentFrameProps) {
  const [status, setStatus] = useState(EVENT_COPY["onramp_api.load_pending"]);
  const [selectedMethod, setSelectedMethod] = useState(
    paymentLinkOptions[0]?.method ?? "apple_pay",
  );
  const selectedOption =
    paymentLinkOptions.find((option) => option.method === selectedMethod) ??
    paymentLinkOptions[0];
  const expiresLabel = useMemo(() => formatExpiry(expiresAt), [expiresAt]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!isCoinbasePayOrigin(event.origin)) return;

      const message = parseOnrampMessage(event.data);
      if (!message?.eventName) return;

      if (message.eventName.endsWith("_error")) {
        setStatus({
          tone: "error",
          message:
            message.data?.errorMessage ||
            "Coinbase could not start this payment. Try creating a new fund link.",
        });
        return;
      }

      const next = EVENT_COPY[message.eventName];
      if (next) setStatus(next);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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
                  setStatus(EVENT_COPY["onramp_api.load_pending"]);
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

      <div className="rounded-3xl border border-border/70 bg-card/80 p-3 shadow-sm">
        <iframe
          key={selectedOption.url}
          src={selectedOption.url}
          title={`Coinbase Onramp ${selectedOption.label} payment`}
          allow="payment"
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          className="h-[680px] w-full rounded-2xl border-0 bg-background"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <StatusIcon tone={status.tone} />
          <div>
            <p className="font-medium text-foreground">{status.message}</p>
            <p>Use the {selectedOption.label} button, then keep this page open until it finishes.</p>
          </div>
        </div>
        <p className="shrink-0 text-xs">Link expires {expiresLabel}</p>
      </div>
    </div>
  );
}

function StatusIcon({ tone }: { tone: "pending" | "success" | "error" }) {
  if (tone === "success") return <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />;
  if (tone === "error") return <XCircle className="mt-0.5 h-5 w-5 text-destructive" />;
  return <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-primary" />;
}

function parseOnrampMessage(data: unknown): OnrampPostMessage | null {
  if (typeof data === "string") {
    try {
      return parseOnrampMessage(JSON.parse(data));
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== "object") return null;
  return data as OnrampPostMessage;
}

function isCoinbasePayOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname === "pay.coinbase.com";
  } catch {
    return false;
  }
}

function formatExpiry(expiresAt: string): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "soon";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
