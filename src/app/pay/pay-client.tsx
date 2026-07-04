"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CrossmintHostedCheckout, CrossmintProvider } from "@crossmint/client-sdk-react-ui";
import { AlertCircle, CheckCircle2, Loader2, Wallet } from "lucide-react";

type CoinbasePaySession = {
  provider: "coinbase";
  paymentLinkUrl: string;
  expiresAt: string;
};

type CrossmintPaySession = {
  provider: "crossmint";
  flow: "onramp" | "offramp";
  orderId: string;
  clientSecret: string;
  clientSideApiKey: string;
  receiptEmail: string | null;
  walletAddress: string | null;
  amount: string | null;
  chain: string | null;
  expiresAt: string;
};

type PaySessionResponse = CoinbasePaySession | CrossmintPaySession;

type OnrampEvent = {
  eventName?: string;
  data?: {
    errorCode?: string;
    errorMessage?: string;
  };
};

type LoadState =
  | { status: "idle" | "loading" }
  | { status: "ready"; session: PaySessionResponse }
  | { status: "error"; message: string };

const EVENT_COPY: Record<string, string> = {
  "onramp_api.load_pending": "Preparing Apple Pay...",
  "onramp_api.load_success": "Apple Pay is ready.",
  "onramp_api.commit_success": "Payment started. Keep this page open while Coinbase confirms settlement.",
  "onramp_api.cancel": "Payment cancelled. You can try again with the same link before it expires.",
  "onramp_api.polling_start": "Payment submitted. Waiting for funds to settle on Base...",
  "onramp_api.polling_success": "Success. Your USDC has been sent to your Basemate wallet.",
};

const PROVIDER_COPY = {
  coinbase: {
    description:
      "Use Apple Pay to buy USDC on Base without leaving this page. By continuing, you agree to Coinbase's Guest Checkout Terms, User Agreement, and Privacy Policy.",
    loading: "Loading Coinbase payment link...",
    ready: "Coinbase checkout is ready.",
    title: "Coinbase Apple Pay Onramp",
  },
  crossmint: {
    description:
      "Use card, Apple Pay, or Google Pay to buy USDC on Base. Continue to Crossmint to complete checkout, KYC, and delivery to your connected Base Account.",
    loading: "Loading Crossmint checkout...",
    ready: "Continue to Crossmint to complete checkout.",
    title: "Crossmint Onramp",
  },
} as const;

function parseOnrampEvent(event: MessageEvent): OnrampEvent | null {
  if (typeof event.data === "string") {
    try {
      return JSON.parse(event.data) as OnrampEvent;
    } catch {
      return null;
    }
  }

  if (typeof event.data === "object" && event.data !== null) {
    return event.data as OnrampEvent;
  }

  return null;
}

function eventMessage(payload: OnrampEvent) {
  if (!payload.eventName) return null;

  if (payload.eventName.endsWith("_error")) {
    return payload.data?.errorMessage || "Coinbase could not complete this step. Please try again.";
  }

  return EVENT_COPY[payload.eventName] ?? null;
}

export function PayClient({ sessionToken }: { sessionToken: string }) {
  const router = useRouter();
  const redirectedRef = useRef(false);
  const [loadState, setLoadState] = useState<LoadState>(() =>
    sessionToken
      ? { status: "loading" }
      : { status: "error", message: "Missing payment session. Open the latest link from Basemate." },
  );
  const [onrampStatus, setOnrampStatus] = useState("Loading payment session...");
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionToken) return;

    let cancelled = false;

    fetch(`/api/pay?s=${encodeURIComponent(sessionToken)}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body?.error || "Could not load payment session.");
        }
        return body as PaySessionResponse;
      })
      .then((body) => {
        if (cancelled) return;
        setLoadState({ status: "ready", session: body });
        setOnrampStatus(PROVIDER_COPY[body.provider].ready);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadState({ status: "error", message: err instanceof Error ? err.message : String(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin && event.origin !== "https://pay.coinbase.com") return;

      const payload = parseOnrampEvent(event);
      if (!payload?.eventName?.startsWith("onramp_api.")) return;

      const message = eventMessage(payload);
      if (!message) return;

      setOnrampStatus(message);
      setLastError(payload.eventName.endsWith("_error") ? message : null);

      if (payload.eventName === "onramp_api.polling_success" && !redirectedRef.current) {
        redirectedRef.current = true;
        setLoadState({ status: "idle" });
        router.replace("/pay/success");
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  const expiresAt = useMemo(() => {
    if (loadState.status !== "ready") return null;
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(loadState.session.expiresAt));
  }, [loadState]);

  const provider = loadState.status === "ready" ? loadState.session.provider : null;
  const copy = provider ? PROVIDER_COPY[provider] : PROVIDER_COPY.crossmint;

  return (
    <section className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          <Wallet className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Fund your Basemate wallet</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {copy.description}
        </p>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
        {loadState.status === "ready" && loadState.session.provider === "coinbase" ? (
          <iframe
            title={PROVIDER_COPY.coinbase.title}
            src={loadState.session.paymentLinkUrl}
            allow="payment"
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            className="h-[620px] w-full rounded-2xl border border-border bg-white sm:h-[680px]"
          />
        ) : loadState.status === "ready" && loadState.session.provider === "crossmint" ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border bg-muted/40 px-6 text-center">
            <div className="max-w-md space-y-2">
              <h2 className="text-lg font-semibold">{PROVIDER_COPY.crossmint.title}</h2>
              <p className="text-sm text-muted-foreground">
                This opens Crossmint in the same tab with your order already prepared.
              </p>
            </div>
            <CrossmintProvider apiKey={loadState.session.clientSideApiKey}>
              <CrossmintHostedCheckout
                orderId={loadState.session.orderId}
                clientSecret={loadState.session.clientSecret}
                payment={{
                  crypto: { enabled: false },
                  fiat: { enabled: true },
                  defaultMethod: "fiat",
                  receiptEmail: loadState.session.receiptEmail ?? undefined,
                }}
                appearance={{
                  display: "same-tab",
                  rules: {
                    DestinationInput: { display: "hidden" },
                    ReceiptEmailInput: { display: "hidden" },
                  },
                }}
              >
                Continue to Crossmint
              </CrossmintHostedCheckout>
            </CrossmintProvider>
          </div>
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/40 px-6 text-center">
            {loadState.status === "error" ? (
              <>
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="max-w-sm text-sm font-medium">{loadState.message}</p>
              </>
            ) : (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">{copy.loading}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-2xl items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm shadow-[var(--shadow-card)]">
        {lastError ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        ) : loadState.status === "ready" ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-up" />
        ) : (
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
        )}
        <div className="space-y-1">
          <p className="font-medium">{lastError ?? onrampStatus}</p>
          {expiresAt ? <p className="text-muted-foreground">This payment link expires around {expiresAt}.</p> : null}
          {sessionToken ? null : <p className="text-muted-foreground">Ask Basemate for a fresh Apple Pay link.</p>}
        </div>
      </div>
    </section>
  );
}
