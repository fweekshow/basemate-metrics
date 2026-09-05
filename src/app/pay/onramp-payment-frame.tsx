"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";

interface OnrampPaymentFrameProps {
  flow: "onramp" | "offramp";
  paymentLinkOptions: FundPaymentLinkOption[];
  expiresAt: string;
  sessionToken?: string;
  hostedFallbackUrl?: string;
  /** Page: full card; embedded: inside unified pay card; modal: dashboard add funds */
  layout?: "page" | "embedded" | "modal";
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

type CheckoutPhase = "load" | "pay" | "confirm" | "done";

const EVENT_COPY: Record<string, { tone: "pending" | "success" | "error"; message: string }> = {
  "onramp_api.load_pending": {
    tone: "pending",
    message: "Getting your checkout ready…",
  },
  "onramp_api.load_success": {
    tone: "success",
    message: "Tap the button below to pay with your wallet.",
  },
  "onramp_api.commit_success": {
    tone: "success",
    message: "Payment started — keep this page open while Coinbase confirms.",
  },
  "onramp_api.polling_start": {
    tone: "pending",
    message: "Confirming your USDC transfer to Base…",
  },
  "onramp_api.polling_success": {
    tone: "success",
    message: "Done. Your USDC is on its way to your Stablemate Account.",
  },
  "onramp_api.cancel": {
    tone: "error",
    message: "Payment cancelled.",
  },
};

const FRAME_LOAD_TIMEOUT_MS = 12_000;
const DEFAULT_IFRAME_HEIGHT = 88;
const LOADED_IFRAME_HEIGHT = 112;
const MAX_IFRAME_HEIGHT = 480;

export function OnrampPaymentFrame({
  flow,
  paymentLinkOptions,
  expiresAt,
  sessionToken,
  hostedFallbackUrl,
  layout = "page",
  onSuccess,
}: OnrampPaymentFrameProps) {
  const router = useRouter();
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const successFiredRef = useRef(false);
  const [status, setStatus] = useState(EVENT_COPY["onramp_api.load_pending"]);
  const [phase, setPhase] = useState<CheckoutPhase>("load");
  const [iframeHeight, setIframeHeight] = useState(DEFAULT_IFRAME_HEIGHT);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const [hasFrameLoaded, setHasFrameLoaded] = useState(false);
  const [hasFrameLoadDelayed, setHasFrameLoadDelayed] = useState(false);
  const [frameRetryNonce, setFrameRetryNonce] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState(
    paymentLinkOptions[0]?.method ?? "apple_pay",
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
        if (typeof nextHeight === "number" && Number.isFinite(nextHeight)) {
          setIframeHeight(Math.min(MAX_IFRAME_HEIGHT, Math.max(72, Math.round(nextHeight))));
        }
        return;
      }

      if (message.eventName.endsWith("_error")) {
        setStatus({
          tone: "error",
          message:
            friendlyOnrampError(message.data?.errorCode, message.data?.errorMessage) ||
            "Coinbase could not start this payment. Ask Stablemate for a new fund link.",
        });
        setIsFrameLoading(false);
        setHasFrameLoadDelayed(false);
        return;
      }

      const next = EVENT_COPY[message.eventName];
      if (next) {
        setStatus(next);
        if (message.eventName === "onramp_api.load_success") {
          setPhase("pay");
          setIsFrameLoading(false);
          setHasFrameLoadDelayed(false);
          setIframeHeight((h) => (h > LOADED_IFRAME_HEIGHT ? h : LOADED_IFRAME_HEIGHT));
        }
        if (message.eventName === "onramp_api.commit_success") {
          setPhase("confirm");
        }
        if (message.eventName === "onramp_api.polling_start") {
          setPhase("confirm");
        }
        if (message.eventName === "onramp_api.polling_success" && !successFiredRef.current) {
          successFiredRef.current = true;
          setPhase("done");
          void recordFundingSession(sessionToken);
          onSuccessRef.current?.();
          if (sessionToken) {
            router.push(`/pay/success?s=${encodeURIComponent(sessionToken)}`);
          }
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, sessionToken]);

  useEffect(() => {
    if (!selectedOptionUrl) return;

    setIsFrameLoading(true);
    setHasFrameLoaded(false);
    setHasFrameLoadDelayed(false);
    setPhase("load");
    setIframeHeight(DEFAULT_IFRAME_HEIGHT);
    setStatus(EVENT_COPY["onramp_api.load_pending"]);

    const timeoutId = window.setTimeout(() => {
      setHasFrameLoadDelayed(true);
    }, FRAME_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [selectedOptionUrl, frameRetryNonce]);

  if (!selectedOption) return null;

  if (flow === "offramp") {
    return (
      <div className="mx-auto grid w-full max-w-xl gap-4">
        <div
          className="flex flex-col items-center gap-5 rounded-[20px] border border-border/80 bg-card p-6 text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold">Continue to Coinbase</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Coinbase cash-out links are single use. Tap the button when you are ready to complete
              the sell flow.
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

        <p className="text-center font-mono text-xs text-muted-foreground" suppressHydrationWarning>
          Link expires {expiresLabel}
        </p>
      </div>
    );
  }

  const embedded = layout === "embedded";

  return (
    <div className={embedded ? "grid w-full gap-0" : "mx-auto grid w-full max-w-lg gap-5"}>
      <div className={embedded ? "border-b border-border/60 px-4 py-3" : undefined}>
        <CheckoutStepper phase={phase} compact={embedded} />
      </div>

      {paymentLinkOptions.length > 1 ? (
        <div
          className={
            embedded
              ? "mx-4 mt-4 grid grid-cols-2 gap-1 rounded-full border border-border/80 bg-secondary/80 p-1"
              : "grid grid-cols-2 gap-1 rounded-full border border-border/80 bg-secondary/80 p-1"
          }
          style={embedded ? undefined : { boxShadow: "var(--shadow-card)" }}
        >
          {paymentLinkOptions.map((option) => {
            const selected = option.method === selectedOption.method;
            return (
              <button
                key={option.method}
                type="button"
                onClick={() => {
                  if (selected) return;
                  setSelectedMethod(option.method);
                  setFrameRetryNonce((nonce) => nonce + 1);
                }}
                className={[
                  "rounded-full px-4 py-2.5 text-sm font-semibold transition-all",
                  selected
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className={
          embedded
            ? "overflow-hidden bg-card"
            : "overflow-hidden rounded-[20px] border border-border/80 bg-card"
        }
        style={embedded ? undefined : { boxShadow: "var(--shadow-card)" }}
      >
        {!embedded ? (
          <div className="border-b border-border/60 px-4 py-3">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Coinbase checkout
            </p>
          </div>
        ) : null}

        <div className={`relative bg-[#121218] ${embedded ? "mx-4 mb-0 mt-4 rounded-2xl px-2 py-2" : "px-3 py-4 sm:px-5 sm:py-5"}`}>
          {isFrameLoading ? (
            <div
              aria-live="polite"
              className="absolute inset-x-3 top-4 z-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1c1c24]/95 px-4 py-3 backdrop-blur sm:inset-x-5"
            >
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-lilac" />
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-white">
                  {hasFrameLoadDelayed
                    ? `${selectedOption.label} is taking longer than usual.`
                    : `Loading ${selectedOption.label}…`}
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
                      className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      Open directly
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <iframe
            key={`${selectedOption.url}-${frameRetryNonce}`}
            src={selectedOption.url}
            title={`Coinbase Onramp ${selectedOption.label} payment`}
            allow="payment"
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            onLoad={() => setHasFrameLoaded(true)}
            style={{ height: iframeHeight, minHeight: 72, maxHeight: MAX_IFRAME_HEIGHT }}
            className={[
              "w-full rounded-xl border-0 bg-transparent transition-opacity duration-200",
              isFrameLoading && !hasFrameLoaded && !hasFrameLoadDelayed ? "opacity-0" : "opacity-100",
            ].join(" ")}
          />
        </div>

        <div
          className={`flex flex-col gap-2 bg-secondary/30 px-4 py-3 sm:flex-row sm:items-start sm:justify-between ${embedded ? "mx-0" : ""}`}
        >
          <div className="flex items-start gap-3">
            <StatusIcon tone={status.tone} />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{status.message}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {phase === "confirm" || phase === "done"
                  ? "Almost there — confirmation usually takes under a minute."
                  : "Tap Buy with Apple Pay, then keep this page open."}
              </p>
            </div>
          </div>
          <p
            className="shrink-0 font-mono text-[11px] text-muted-foreground sm:text-right"
            suppressHydrationWarning
          >
            Expires {expiresLabel}
          </p>
        </div>
      </div>

      {hostedFallbackUrl ? (
        <p className={`text-center text-sm text-muted-foreground ${embedded ? "px-4 py-4" : ""}`}>
          <a
            href={hostedFallbackUrl}
            className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
            rel="noopener noreferrer"
          >
            Pay with debit card or bank on Coinbase
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </p>
      ) : null}
    </div>
  );
}

function CheckoutStepper({ phase, compact }: { phase: CheckoutPhase; compact?: boolean }) {
  const steps: { id: CheckoutPhase; label: string }[] = [
    { id: "load", label: "Checkout" },
    { id: "pay", label: "Pay" },
    { id: "confirm", label: "Confirm" },
  ];

  const activeIndex =
    phase === "done" ? 3 : steps.findIndex((s) => s.id === phase) >= 0 ? steps.findIndex((s) => s.id === phase) : 0;

  return (
    <div>
      <ol
        className={`flex items-center justify-center ${compact ? "gap-1.5" : "gap-2 sm:gap-3"}`}
        aria-label="Checkout progress"
      >
      {steps.map((step, index) => {
        const done = phase === "done" || index < activeIndex;
        const current = phase !== "done" && index === activeIndex;
        return (
          <li key={step.id} className={`flex items-center ${compact ? "gap-1" : "gap-2 sm:gap-3"}`}>
            {index > 0 ? (
              <span
                className={[
                  "h-px",
                  compact ? "w-4" : "hidden w-6 sm:block sm:w-10",
                  done ? "bg-primary/50" : "bg-border",
                ].join(" ")}
                aria-hidden
              />
            ) : null}
            <span className="flex items-center gap-1">
              <span
                className={[
                  "flex items-center justify-center rounded-full font-semibold transition-colors",
                  compact ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-xs",
                  done
                    ? "bg-primary text-primary-foreground"
                    : current
                      ? "bg-primary/15 text-primary ring-2 ring-primary/30"
                      : "bg-secondary text-muted-foreground",
                ].join(" ")}
              >
                {done ? (
                  <CheckCircle2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              {!compact ? (
                <span
                  className={[
                    "text-xs font-medium sm:text-sm",
                    current || done ? "text-foreground" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              ) : (
                <span className="sr-only">{step.label}</span>
              )}
            </span>
          </li>
        );
      })}
      </ol>
      {compact ? (
        <p className="mt-1.5 text-center text-[11px] font-medium text-muted-foreground">
          {phase === "done" ? "Complete" : steps[Math.min(activeIndex, steps.length - 1)]?.label}
        </p>
      ) : null}
    </div>
  );
}

function StatusIcon({ tone }: { tone: "pending" | "success" | "error" }) {
  if (tone === "success") return <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-up" />;
  if (tone === "error") return <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />;
  return <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary" />;
}

function friendlyOnrampError(code?: string, message?: string): string | undefined {
  if (message && message.length < 120) return message;
  switch (code) {
    case "ERROR_CODE_GUEST_APPLE_PAY_NOT_SUPPORTED":
      return "Apple Pay is not available in this browser. Try Safari on your phone or use the card link below.";
    case "ERROR_CODE_GUEST_REGION_NOT_SUPPORTED":
      return "This payment method is not available in your region.";
    case "ERROR_CODE_GUEST_LIMIT_EXCEEDED":
      return "This amount exceeds your guest limit. Ask Stablemate for a new link or use the card option on Coinbase.";
    default:
      return message;
  }
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
  const raw = data as { eventName?: string; data?: OnrampPostMessage["data"] };
  return raw;
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
