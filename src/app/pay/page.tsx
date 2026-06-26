"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Status = "no-token" | "loading" | "ready" | "commit" | "success" | "error";

interface CoinbasePostMessage {
  eventName: string;
  data?: {
    errorCode?: string;
    errorMessage?: string;
  };
}

function PayPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("s");

  const [status, setStatus] = useState<Status>(token ? "loading" : "no-token");
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch the payment link URL from our API route
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    fetch(`/api/pay?s=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data: { paymentLinkUrl?: string; error?: string }) => {
        if (cancelled) return;
        if (data.paymentLinkUrl) {
          setPaymentLinkUrl(data.paymentLinkUrl);
        } else {
          const msg =
            data.error === "expired"
              ? "This link has expired. Ask Basemate to generate a new one."
              : data.error === "not_found"
                ? "Link not found. Ask Basemate to generate a new one."
                : "Something went wrong. Ask Basemate to generate a new link.";
          setErrorMessage(msg);
          setStatus("error");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setErrorMessage("Couldn't load the payment link. Check your connection and try again.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Listen for postMessage events from the Coinbase iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Only accept messages from pay.coinbase.com
      if (event.origin !== "https://pay.coinbase.com") return;

      let parsed: CoinbasePostMessage;
      try {
        parsed = typeof event.data === "string"
          ? (JSON.parse(event.data) as CoinbasePostMessage)
          : (event.data as CoinbasePostMessage);
      } catch {
        return;
      }

      const { eventName, data } = parsed;

      switch (eventName) {
        case "onramp_api.initialized":
          break;
        case "onramp_api.ready":
          setStatus("ready");
          break;
        case "onramp_api.commit_success":
          setStatus("commit");
          break;
        case "onramp_api.transaction_success":
          setStatus("success");
          break;
        case "onramp_api.error":
        case "onramp_api.payment_error":
        case "onramp_api.transaction_error": {
          const msg = data?.errorMessage ?? "Payment failed. Try again or contact support.";
          setErrorMessage(msg);
          setStatus("error");
          break;
        }
        default:
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Logo / brand mark */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
          {/* Simple wallet icon inline to avoid extra deps */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5m-6 0h6"
            />
            <circle cx="16" cy="12" r="1" fill="currentColor" />
          </svg>
        </div>
        <p className="text-sm font-medium text-muted-foreground tracking-wide">Basemate</p>
      </div>

      {/* no-token state — user navigated directly without a link */}
      {status === "no-token" && (
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold">Fund your wallet</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To add funds with Apple Pay, ask Basemate in iMessage:
          </p>
          <code className="rounded-lg bg-muted px-4 py-2 text-sm font-mono">
            add $25
          </code>
          <p className="text-xs text-muted-foreground">
            {"You'll get a personal link that opens Apple Pay instantly."}
          </p>
        </div>
      )}

      {/* loading state — only show while fetching the session (before URL arrives) */}
      {status === "loading" && !paymentLinkUrl && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading Apple Pay&hellip;</p>
        </div>
      )}

      {/* iframe state — hidden spinner until ready event fires */}
      {paymentLinkUrl && (status === "loading" || status === "ready") && (
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground">Preparing Apple Pay&hellip;</p>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={paymentLinkUrl}
            // Required Coinbase iframe attributes
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            allow="payment"
            title="Apple Pay"
            className="h-[380px] w-full rounded-2xl border-0"
            style={{ display: status === "loading" ? "none" : "block" }}
          />
          {status === "ready" && (
            <p className="text-xs text-muted-foreground text-center px-4">
              Tap the Apple Pay button above. Your USDC will arrive in your Basemate wallet within seconds.
            </p>
          )}
        </div>
      )}

      {/* commit state — payment confirmed, waiting for on-chain settlement */}
      {status === "commit" && (
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Payment confirmed</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your USDC is on the way to your Basemate wallet — usually arrives within 30 seconds.
          </p>
        </div>
      )}

      {/* success state — funds confirmed on-chain */}
      {status === "success" && (
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Funds arrived</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your USDC is in your Basemate wallet. Go back to iMessage to start trading.
          </p>
        </div>
      )}

      {/* error state */}
      {status === "error" && (
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {errorMessage ?? "The payment link is invalid or has expired."}
          </p>
          <p className="text-xs text-muted-foreground">
            Ask Basemate in iMessage to generate a new link.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <PayPageInner />
    </Suspense>
  );
}
