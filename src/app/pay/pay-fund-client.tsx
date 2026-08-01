"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Loader2 } from "lucide-react";

import { HeadlessOnrampCheckout } from "@/app/pay/headless-onramp-checkout";
import { OnrampPaymentFrame, type FundCheckoutSession } from "@/app/pay/onramp-payment-frame";
import { resolveEmbeddablePaymentLinks } from "@/lib/embed-payment-links";

export function PayFundClient({
  sessionToken,
  initialSession,
  initialPaymentLinkUrl,
}: {
  sessionToken: string;
  initialSession: FundCheckoutSession;
  initialPaymentLinkUrl?: string;
}) {
  const initialEmbed = useMemo(
    () =>
      resolveEmbeddablePaymentLinks({
        paymentLinkUrl: initialPaymentLinkUrl,
        paymentLinkOptions: initialSession.paymentLinkOptions,
      }),
    [initialPaymentLinkUrl, initialSession.paymentLinkOptions],
  );

  const [session, setSession] = useState(initialSession);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState(initialPaymentLinkUrl ?? "");
  const [sessionReady, setSessionReady] = useState(initialEmbed.length > 0);

  const refetchSession = useCallback(async () => {
    const res = await fetch(`/api/pay/fund-session?s=${encodeURIComponent(sessionToken)}`, {
      cache: "no-store",
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error ?? "Could not refresh checkout.");
    const nextUrl = typeof body.paymentLinkUrl === "string" ? body.paymentLinkUrl : "";
    if (nextUrl) setPaymentLinkUrl(nextUrl);
    const nextOptions = body.paymentLinkOptions ?? [];
    const nextEmbed = resolveEmbeddablePaymentLinks({
      paymentLinkUrl: nextUrl,
      paymentLinkOptions: nextOptions,
    });
    setSession((prev) => ({
      paymentLinkOptions:
        nextEmbed.length > 0
          ? nextEmbed
          : resolveEmbeddablePaymentLinks({
              paymentLinkUrl: initialPaymentLinkUrl,
              paymentLinkOptions: prev.paymentLinkOptions,
            }).length > 0
            ? prev.paymentLinkOptions
            : nextOptions,
      hostedFallbackUrl: body.hostedFallbackUrl ?? prev.hostedFallbackUrl,
      expiresAt: body.expiresAt ?? prev.expiresAt,
      headlessBlockedReason: body.headlessBlockedReason ?? prev.headlessBlockedReason,
      limitUpgradeEligible: body.limitUpgradeEligible ?? prev.limitUpgradeEligible,
      limitUpgradeComplete: body.limitUpgradeComplete ?? prev.limitUpgradeComplete,
    }));
  }, [sessionToken, initialPaymentLinkUrl]);

  const initialFetchDoneRef = useRef(false);
  useEffect(() => {
    if (initialEmbed.length > 0 || initialFetchDoneRef.current) {
      setSessionReady(true);
      return;
    }
    initialFetchDoneRef.current = true;
    void refetchSession()
      .catch(() => {})
      .finally(() => setSessionReady(true));
  }, [refetchSession, initialEmbed.length]);

  const embedOptions = useMemo(
    () =>
      resolveEmbeddablePaymentLinks({
        paymentLinkUrl,
        paymentLinkOptions: session.paymentLinkOptions,
      }),
    [paymentLinkUrl, session.paymentLinkOptions],
  );

  const iframeOptions = embedOptions.length > 0 ? embedOptions : initialEmbed;

  const requestLimitUpgradeUrl = useCallback(async () => {
    const res = await fetch("/api/pay/limit-upgrade-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionToken }),
    });
    const body = await res.json();
    if (res.status === 409 && body?.alreadyComplete) {
      await refetchSession();
      throw new Error("ALREADY_UPGRADED");
    }
    if (!res.ok) throw new Error(body?.error ?? "Could not start limit upgrade.");
    if (!body.upgradeUrl) throw new Error("Missing upgrade URL.");
    return { upgradeUrl: body.upgradeUrl as string, expiresAt: body.expiresAt as string };
  }, [sessionToken, refetchSession]);

  if (iframeOptions.length > 0) {
    return (
      <HeadlessOnrampCheckout
        paymentLinkOptions={iframeOptions}
        expiresAt={session.expiresAt}
        sessionToken={sessionToken}
      />
    );
  }

  if (!sessionReady) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-3xl border border-border/70 bg-card/80 p-8 text-center shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading checkout…</p>
      </div>
    );
  }

  return (
    <OnrampPaymentFrame
      flow="onramp"
      paymentLinkOptions={session.paymentLinkOptions}
      hostedFallbackUrl={session.hostedFallbackUrl}
      expiresAt={session.expiresAt}
      sessionToken={sessionToken}
      headlessBlockedReason={session.headlessBlockedReason}
      limitUpgradeEligible={session.limitUpgradeEligible}
      limitUpgradeComplete={session.limitUpgradeComplete}
      onRequestLimitUpgradeUrl={requestLimitUpgradeUrl}
      onLimitUpgradeComplete={refetchSession}
    />
  );
}
