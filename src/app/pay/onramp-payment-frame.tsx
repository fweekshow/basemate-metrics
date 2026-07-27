"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";

interface OnrampPaymentFrameProps {
  flow: "onramp" | "offramp";
  paymentLinkOptions: FundPaymentLinkOption[];
  expiresAt: string;
  /** Coinbase-hosted URL for debit card / bank (full-page redirect, not iframe). */
  hostedFallbackUrl?: string;
  /** Fund session token from /pay?s= — used to log the deposit in Activity. */
  sessionToken?: string;
  /** Fired once when Coinbase confirms the onramp purchase (polling success). */
  onSuccess?: () => void;
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
    height?: number;
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

const ERROR_COPY: Record<string, string> = {
  ERROR_CODE_GUEST_APPLE_PAY_NOT_SUPPORTED:
    "Apple Pay isn't available in this browser. Open in Safari, or pay with a card or bank on Coinbase.",
  ERROR_CODE_GUEST_APPLE_PAY_NOT_SETUP:
    "Set up Apple Pay on this device (Wallet app), then try again.",
  ERROR_CODE_GUEST_GOOGLE_PAY_NOT_SUPPORTED:
    "Google Pay isn't available here. Try a card or bank on Coinbase instead.",
  ERROR_CODE_GUEST_REGION_FORBIDDEN:
    "Guest checkout is US-only right now. Use a US network or contact support.",
  ERROR_CODE_GUEST_REGION_MISMATCH:
    "Your region doesn't match this checkout. Try again from a US network.",
  ERROR_CODE_INIT: "This payment link expired. Ask Basemate for a fresh fund link.",
};

const FRAME_LOAD_TIMEOUT_MS = 12_000;
const DEFAULT_FRAME_HEIGHT = 120;
const LOAD_SUCCESS_HEIGHT = 96;
const POLLING_FRAME_HEIGHT = 320;
const MAX_FRAME_HEIGHT = 480;

export function OnrampPaymentFrame({
  flow,
  paymentLinkOptions,
  expiresAt,
  hostedFallbackUrl,
  sessionToken,
  onSuccess,
}: OnrampPaymentFrameProps) {
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const successFiredRef = useRef(false);
  const [status, setStatus] = useState(EVENT_COPY["onramp_api.load_pending"]);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const [hasFrameLoaded, setHasFrameLoaded] = useState(false);
  const [hasFrameLoadDelayed, setHasFrameLoadDelayed] = useState(false);
  const [frameRetryNonce, setFrameRetryNonce] = useState(0);
  const [frameHeight, setFrameHeight] = useState(DEFAULT_FRAME_HEIGHT);
  const [checkoutMode, setCheckoutMode] = useState<"wallet" | "hosted">(
    paymentLinkOptions.length > 0 ? "wallet" : "hosted",
  );
  const [selectedMethod, setSelectedMethod] = useState(() =>
    defaultPaymentMethod(paymentLinkOptions),
  );
  const selectedOption =
    paymentLinkOptions.find((option) => option.method === selectedMethod) ??
    paymentLinkOptions[0];
  const selectedOptionUrl = selectedOption?.url;
  const expiresLabel = useMemo(() => formatExpiry(expiresAt), [expiresAt]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!isCoinbasePayOrigin(event.origin)) return;

      const message = parseOnrampMessage(event.data);
      if (!message?.eventName) return;

      if (message.eventName === "onramp_api.resize") {
        const nextHeight = message.data?.height;
        if (typeof nextHeight === "number" && nextHeight > 0) {
          setFrameHeight(Math.min(nextHeight, MAX_FRAME_HEIGHT));
        }
        return;
      }

      if (message.eventName.endsWith("_error")) {
        const code = message.data?.errorCode ?? "";
        if (code) console.warn("[onramp]", code, message.data?.errorMessage ?? "");
        setStatus({
          tone: "error",
          message:
            (code && ERROR_COPY[code]) ||
            message.data?.errorMessage ||
            "Coinbase could not start this payment. Try creating a new fund link.",
        });
        setIsFrameLoading(false);
        setHasFrameLoadDelayed(false);
        return;
      }

      const next = EVENT_COPY[message.eventName];
      if (next) {
        setStatus(next);
        if (message.eventName === "onramp_api.load_success") {
          setIsFrameLoading(false);
          setHasFrameLoadDelayed(false);
          setFrameHeight(LOAD_SUCCESS_HEIGHT);
        }
        if (message.eventName === "onramp_api.polling_start") {
          setFrameHeight(POLLING_FRAME_HEIGHT);
        }
        if (message.eventName === "onramp_api.polling_success" && !successFiredRef.current) {
          successFiredRef.current = true;
          void recordFundingSession(sessionToken);
          onSuccessRef.current?.();
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [sessionToken]);

  useEffect(() => {
    if (!selectedOptionUrl || checkoutMode !== "wallet") return;

    setIsFrameLoading(true);
    setHasFrameLoaded(false);
    setHasFrameLoadDelayed(false);
    setFrameHeight(DEFAULT_FRAME_HEIGHT);
    setStatus(EVENT_COPY["onramp_api.load_pending"]);

    const timeoutId = window.setTimeout(() => {
      setHasFrameLoadDelayed(true);
    }, FRAME_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [selectedOptionUrl, frameRetryNonce, checkoutMode]);

  if (!selectedOption && !hostedFallbackUrl) return null;

  if (flow === "offramp") {
    return (
      <div className="mx-auto grid w-full max-w-md gap-4">
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
    <div className="mx-auto grid w-full max-w-md gap-4">
      <div className="grid gap-2 rounded-2xl border border-border/70 bg-card/80 p-2 shadow-sm">
        {paymentLinkOptions.length > 0 ? (
          <button
            type="button"
            onClick={() => setCheckoutMode("wallet")}
            className={[
              "rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors",
              checkoutMode === "wallet"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            Apple Pay / Google Pay
            <span className="mt-0.5 block text-xs font-normal opacity-80">Pay here — no Coinbase account needed</span>
          </button>
        ) : null}
        {hostedFallbackUrl ? (
          <button
            type="button"
            onClick={() => setCheckoutMode("hosted")}
            className={[
              "rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors",
              checkoutMode === "hosted"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            Card or bank
            <span className="mt-0.5 block text-xs font-normal opacity-80">
              Continue on Coinbase — debit card or ACH (bank requires Coinbase login)
            </span>
          </button>
        ) : null}
      </div>

      {checkoutMode === "hosted" && hostedFallbackUrl ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card/80 p-6 text-center shadow-sm">
          <p className="text-sm leading-6 text-muted-foreground">
            You&apos;ll finish checkout on Coinbase. Debit cards work without an account; bank transfer requires signing in.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign(hostedFallbackUrl)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-[0.98]"
          >
            Continue on Coinbase
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      ) : selectedOption ? (
        <>
          {paymentLinkOptions.length > 1 ? (
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-card/80 p-2 shadow-sm">
              {paymentLinkOptions.map((option) => {
                const selected = option.method === selectedOption.method;
                return (
                  <button
                    key={option.method}
                    type="button"
                    onClick={() => {
                      if (selected) return;
                      setSelectedMethod(option.method);
                      setStatus(EVENT_COPY["onramp_api.load_pending"]);
                      setIsFrameLoading(true);
                      setHasFrameLoaded(false);
                      setHasFrameLoadDelayed(false);
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

          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-2 shadow-sm">
            <iframe
              key={`${selectedOption.url}-${frameRetryNonce}`}
              src={selectedOption.url}
              title={`Coinbase Onramp ${selectedOption.label} payment`}
              allow="payment"
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
              onLoad={() => {
                setHasFrameLoaded(true);
              }}
              style={{ height: `${frameHeight}px` }}
              className={[
                "w-full rounded-2xl border-0 bg-background transition-[height,opacity] duration-200",
                isFrameLoading && !hasFrameLoaded && !hasFrameLoadDelayed ? "opacity-0" : "opacity-100",
              ].join(" ")}
            />
            {isFrameLoading ? (
              <div
                aria-live="polite"
                className="absolute inset-x-0 top-2 z-10 mx-auto flex max-w-sm items-center gap-3 rounded-full border border-border/70 bg-background/95 px-4 py-3 shadow-lg backdrop-blur"
              >
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground">
                    {hasFrameLoadDelayed
                      ? `${selectedOption.label} checkout is taking longer than usual.`
                      : `Loading ${selectedOption.label} checkout...`}
                  </p>
                  {hasFrameLoadDelayed ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsFrameLoading(true);
                          setHasFrameLoaded(false);
                          setHasFrameLoadDelayed(false);
                          setFrameRetryNonce((nonce) => nonce + 1);
                        }}
                        className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
                      >
                        Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.open(selectedOption.url, "_blank", "noopener,noreferrer");
                        }}
                        className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-muted"
                      >
                        Open directly
                      </button>
                      {hostedFallbackUrl ? (
                        <button
                          type="button"
                          onClick={() => setCheckoutMode("hosted")}
                          className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-muted"
                        >
                          Use card/bank
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <StatusIcon tone={status.tone} />
          <div>
            <p className="font-medium text-foreground">{status.message}</p>
            {checkoutMode === "wallet" && selectedOption ? (
              <p>Use the {selectedOption.label} button, then keep this page open until it finishes.</p>
            ) : null}
          </div>
        </div>
        <p className="text-xs">Link expires {expiresLabel}</p>
      </div>
    </div>
  );
}

function defaultPaymentMethod(options: FundPaymentLinkOption[]): FundPaymentLinkOption["method"] {
  const preferred = prefersGooglePay() ? "google_pay" : "apple_pay";
  if (options.some((option) => option.method === preferred)) return preferred;
  return options[0]?.method ?? "apple_pay";
}

function prefersGooglePay(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|Edg/i.test(ua);
  return !isSafari;
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

function recordFundingSession(sessionToken?: string) {
  if (!sessionToken) return;
  void fetch("/api/pay/record-funding", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionToken }),
  }).catch(() => {});
}
