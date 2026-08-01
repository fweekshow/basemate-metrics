"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";

import { isHostedCoinbaseOnrampUrl } from "@/lib/embed-payment-links";

export interface FundPaymentLinkOption {
  method: "apple_pay" | "google_pay";
  label: "Apple Pay" | "Google Pay";
  url: string;
}

export interface FundCheckoutSession {
  paymentLinkOptions: FundPaymentLinkOption[];
  hostedFallbackUrl?: string;
  expiresAt: string;
  headlessBlockedReason?: string;
  limitUpgradeEligible?: boolean;
  limitUpgradeComplete?: boolean;
}

interface OnrampPaymentFrameProps {
  flow: "onramp" | "offramp";
  paymentLinkOptions: FundPaymentLinkOption[];
  expiresAt: string;
  hostedFallbackUrl?: string;
  sessionToken?: string;
  headlessBlockedReason?: string;
  limitUpgradeEligible?: boolean;
  limitUpgradeComplete?: boolean;
  onSuccess?: () => void;
  onRequestLimitUpgradeUrl?: () => Promise<{ upgradeUrl: string; expiresAt: string }>;
  onLimitUpgradeComplete?: () => void | Promise<void>;
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
    message: "Done. Your USDC is on its way to your Basemate Account.",
  },
  "onramp_api.cancel": {
    tone: "error",
    message: "Payment cancelled.",
  },
};

const HEADLESS_BLOCK_COPY: Record<string, string> = {
  guest_transaction_count:
    "Coinbase still treats this phone as at the guest checkout cap. Complete Increase limits, or use card or bank.",
  invalid_app_id:
    "Coinbase rejected the Apple Pay embed for this site (invalid_app_id). Basemate must have basemate.app on the CDP Onramp domain allowlist and CDP_FUND_PAGE_DOMAIN=basemate.app on the agent.",
  guest_region_forbidden:
    "Coinbase thinks this session is outside the US. Turn off VPN, use US cellular or Wi‑Fi, then refresh.",
};

function headlessBlockMessage(reason?: string): string | undefined {
  if (!reason) return undefined;
  return HEADLESS_BLOCK_COPY[reason];
}

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
const UPGRADE_FRAME_HEIGHT = 480;
const MAX_FRAME_HEIGHT = 480;

export function OnrampPaymentFrame({
  flow,
  paymentLinkOptions,
  expiresAt,
  hostedFallbackUrl,
  sessionToken,
  headlessBlockedReason,
  limitUpgradeEligible,
  limitUpgradeComplete,
  onSuccess,
  onRequestLimitUpgradeUrl,
  onLimitUpgradeComplete,
}: OnrampPaymentFrameProps) {
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onLimitUpgradeCompleteRef = useRef(onLimitUpgradeComplete);
  onLimitUpgradeCompleteRef.current = onLimitUpgradeComplete;

  const successFiredRef = useRef(false);
  const [status, setStatus] = useState(EVENT_COPY["onramp_api.load_pending"]);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const [hasFrameLoaded, setHasFrameLoaded] = useState(false);
  const [hasFrameLoadDelayed, setHasFrameLoadDelayed] = useState(false);
  const [frameRetryNonce, setFrameRetryNonce] = useState(0);
  const [frameHeight, setFrameHeight] = useState(DEFAULT_FRAME_HEIGHT);
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);
  const [upgradeMode, setUpgradeMode] = useState(false);

  const guestLimitHit = headlessBlockedReason === "guest_transaction_count";

  const safePaymentOptions = paymentLinkOptions.filter((o) => !isHostedCoinbaseOnrampUrl(o.url));
  const needsLimitUpgrade = limitUpgradeEligible === true && !limitUpgradeComplete;
  /** Upgraded users often lose API flags; treat guest cap + not eligible as complete. */
  const limitUpgradeCompleteEffective =
    limitUpgradeComplete === true ||
    (guestLimitHit && !needsLimitUpgrade && limitUpgradeEligible !== true);

  const showWalletTab =
    safePaymentOptions.length > 0 || needsLimitUpgrade || limitUpgradeCompleteEffective;

  const [checkoutMode, setCheckoutMode] = useState<"wallet" | "hosted">(() => {
    if (safePaymentOptions.length > 0) return "wallet";
    if (hostedFallbackUrl && !needsLimitUpgrade && !limitUpgradeCompleteEffective) return "hosted";
    if (needsLimitUpgrade || limitUpgradeCompleteEffective) return "wallet";
    return hostedFallbackUrl ? "hosted" : "wallet";
  });
  const [selectedMethod, setSelectedMethod] = useState(() =>
    defaultPaymentMethod(safePaymentOptions),
  );
  const selectedOption =
    safePaymentOptions.find((option) => option.method === selectedMethod) ??
    safePaymentOptions[0];
  const selectedOptionUrl = selectedOption?.url;

  const [expiresLabel, setExpiresLabel] = useState("");
  useEffect(() => {
    setExpiresLabel(formatExpiry(expiresAt));
  }, [expiresAt]);

  useEffect(() => {
    if (safePaymentOptions.length > 0 && checkoutMode !== "wallet") {
      setCheckoutMode("wallet");
    }
  }, [safePaymentOptions.length, checkoutMode]);

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

      if (message.eventName === "onramp_api.upgrade_approved") {
        setUpgradeMode(false);
        setUpgradeUrl(null);
        setStatus({
          tone: "success",
          message: "Limits increased. Loading Apple Pay checkout...",
        });
        void onLimitUpgradeCompleteRef.current?.();
        return;
      }

      if (message.eventName === "onramp_api.cancel" && upgradeMode) {
        setUpgradeMode(false);
        setUpgradeUrl(null);
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
  }, [sessionToken, upgradeMode]);

  useEffect(() => {
    if (!selectedOptionUrl || checkoutMode !== "wallet" || upgradeMode) return;

    setIsFrameLoading(true);
    setHasFrameLoaded(false);
    setHasFrameLoadDelayed(false);
    setFrameHeight(DEFAULT_FRAME_HEIGHT);
    setStatus(EVENT_COPY["onramp_api.load_pending"]);

    const timeoutId = window.setTimeout(() => {
      setHasFrameLoadDelayed(true);
    }, FRAME_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [selectedOptionUrl, frameRetryNonce, checkoutMode, upgradeMode]);

  async function startLimitUpgrade() {
    if (!onRequestLimitUpgradeUrl || upgradeBusy) return;
    setUpgradeBusy(true);
    setUpgradeError(null);
    try {
      const { upgradeUrl: url } = await onRequestLimitUpgradeUrl();
      setUpgradeUrl(url);
      setUpgradeMode(true);
      setFrameHeight(UPGRADE_FRAME_HEIGHT);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start limit upgrade.";
      if (msg === "ALREADY_UPGRADED") {
        setUpgradeError(null);
        setStatus({
          tone: "success",
          message: "Coinbase already verified this phone. Refreshing checkout…",
        });
        await onLimitUpgradeCompleteRef.current?.();
        return;
      }
      setUpgradeError(
        msg.includes("already upgraded")
          ? "Coinbase says this phone is already verified. Tap Refresh checkout below."
          : msg,
      );
    } finally {
      setUpgradeBusy(false);
    }
  }

  async function refreshCheckout() {
    setUpgradeBusy(true);
    setUpgradeError(null);
    setStatus(EVENT_COPY["onramp_api.load_pending"]);
    try {
      await onLimitUpgradeCompleteRef.current?.();
    } catch (e) {
      setUpgradeError(e instanceof Error ? e.message : "Could not refresh checkout.");
    } finally {
      setUpgradeBusy(false);
    }
  }

  const autoRefreshStartedRef = useRef(false);
  useEffect(() => {
    if (autoRefreshStartedRef.current) return;
    if (safePaymentOptions.length > 0 || needsLimitUpgrade || upgradeMode) return;
    if (!onLimitUpgradeCompleteRef.current) return;
    if (limitUpgradeComplete !== true && !limitUpgradeCompleteEffective) return;
    autoRefreshStartedRef.current = true;
    void refreshCheckout();
  }, [
    safePaymentOptions.length,
    needsLimitUpgrade,
    upgradeMode,
    limitUpgradeComplete,
    limitUpgradeCompleteEffective,
  ]);

  if (
    !safePaymentOptions.length &&
    !hostedFallbackUrl &&
    !limitUpgradeEligible &&
    !limitUpgradeComplete &&
    !onRequestLimitUpgradeUrl
  ) {
    return null;
  }

  if (flow === "offramp") {
    const offrampUrl = paymentLinkOptions[0]?.url;
    if (!offrampUrl) return null;
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
              window.location.assign(offrampUrl);
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-[0.98]"
          >
            Cash out with Coinbase
          </button>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/80 p-4 text-center text-sm text-muted-foreground">
          Link expires {expiresLabel || "soon"}
        </div>
      </div>
    );
  }

  const showGuestLimitPanel =
    needsLimitUpgrade && checkoutMode === "wallet" && !upgradeMode;
  const showUpgradeCompletePanel =
    limitUpgradeComplete === true &&
    safePaymentOptions.length === 0 &&
    checkoutMode === "wallet" &&
    !upgradeMode &&
    !needsLimitUpgrade &&
    !upgradeBusy;
  const showCheckoutLoadingPanel =
    upgradeBusy &&
    safePaymentOptions.length === 0 &&
    checkoutMode === "wallet" &&
    !upgradeMode &&
    !showGuestLimitPanel;
  const showApplePayHelpPanel =
    checkoutMode === "wallet" &&
    safePaymentOptions.length === 0 &&
    !upgradeMode &&
    !showGuestLimitPanel &&
    !showUpgradeCompletePanel &&
    !showCheckoutLoadingPanel &&
    flow === "onramp";

  return (
    <div className="mx-auto grid w-full max-w-md gap-4">
      <div className="grid gap-2 rounded-2xl border border-border/70 bg-card/80 p-2 shadow-sm">
        {showWalletTab ? (
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
            {needsLimitUpgrade && safePaymentOptions.length === 0
              ? "Apple Pay — increase limits"
              : limitUpgradeCompleteEffective && safePaymentOptions.length === 0
                ? "Apple Pay"
                : "Apple Pay / Google Pay"}
            <span className="mt-0.5 block text-xs font-normal opacity-80">
              {needsLimitUpgrade && safePaymentOptions.length === 0
                ? "Guest checkout cap — verify with Coinbase to continue"
                : limitUpgradeCompleteEffective && safePaymentOptions.length === 0
                  ? "Verified with Coinbase — refresh if the button does not load"
                  : safePaymentOptions.length === 0
                    ? "Pay here with Apple Pay — tap Refresh if the button does not appear"
                    : "Pay here — no Coinbase account needed"}
            </span>
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

      {showUpgradeCompletePanel ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card/80 p-6 text-center shadow-sm">
          <p className="text-sm leading-6 text-muted-foreground">
            Coinbase already verified guest limits for this phone. Refresh checkout to load Apple Pay. If it
            still does not appear, use card or bank below or ask Basemate for a new fund link.
          </p>
          {headlessBlockMessage(headlessBlockedReason) ? (
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {headlessBlockMessage(headlessBlockedReason)}
            </p>
          ) : null}
          {upgradeError ? <p className="text-sm text-destructive">{upgradeError}</p> : null}
          <button
            type="button"
            disabled={upgradeBusy}
            onClick={() => void refreshCheckout()}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {upgradeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Refresh checkout
          </button>
        </div>
      ) : showCheckoutLoadingPanel ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-3xl border border-border/70 bg-card/80 p-8 text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Apple Pay checkout…</p>
        </div>
      ) : showApplePayHelpPanel ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card/80 p-6 text-center shadow-sm">
          <p className="text-sm leading-6 text-muted-foreground">
            Coinbase did not return an Apple Pay button for this link yet. That usually means a server-side
            check failed (limits, region, or site config) — not a bug in your browser, so nothing shows in the
            console.
          </p>
          {headlessBlockMessage(headlessBlockedReason) ? (
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {headlessBlockMessage(headlessBlockedReason)}
            </p>
          ) : null}
          {upgradeError ? <p className="text-sm text-destructive">{upgradeError}</p> : null}
          <button
            type="button"
            disabled={upgradeBusy}
            onClick={() => void refreshCheckout()}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {upgradeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Refresh checkout
          </button>
          {onRequestLimitUpgradeUrl ? (
            <button
              type="button"
              disabled={upgradeBusy}
              onClick={() => void startLimitUpgrade()}
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Increase limits with Coinbase
            </button>
          ) : null}
        </div>
      ) : showGuestLimitPanel ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card/80 p-6 text-center shadow-sm">
          <p className="text-sm leading-6 text-muted-foreground">
            You&apos;ve used the 15 guest checkouts allowed on this phone for Apple Pay here. Increase limits with
            Coinbase to keep paying on Basemate, or use card or bank below.
          </p>
          {upgradeError ? <p className="text-sm text-destructive">{upgradeError}</p> : null}
          <button
            type="button"
            disabled={upgradeBusy || !onRequestLimitUpgradeUrl}
            onClick={() => void startLimitUpgrade()}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {upgradeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Increase limits
          </button>
          {!limitUpgradeEligible ? (
            <p className="text-xs text-muted-foreground">
              If this button does not work, message Basemate for a fresh fund link or use card or bank below.
            </p>
          ) : null}
        </div>
      ) : upgradeMode && upgradeUrl ? (
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-2 shadow-sm">
          <iframe
            src={upgradeUrl}
            title="Increase Coinbase guest checkout limits"
            allow="payment"
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            style={{ height: `${frameHeight}px` }}
            className="w-full rounded-2xl border-0 bg-background"
          />
        </div>
      ) : checkoutMode === "hosted" && hostedFallbackUrl ? (
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
          {safePaymentOptions.length > 1 ? (
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-card/80 p-2 shadow-sm">
              {safePaymentOptions.map((option) => {
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

      {!showGuestLimitPanel && !showUpgradeCompletePanel && !showApplePayHelpPanel && checkoutMode !== "hosted" ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <StatusIcon tone={status.tone} />
            <div>
              <p className="font-medium text-foreground">{status.message}</p>
              {selectedOption ? (
                <p>Use the {selectedOption.label} button, then keep this page open until it finishes.</p>
              ) : null}
            </div>
          </div>
          <p className="text-xs" suppressHydrationWarning>
            Link expires {expiresLabel || "soon"}
          </p>
        </div>
      ) : null}
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
