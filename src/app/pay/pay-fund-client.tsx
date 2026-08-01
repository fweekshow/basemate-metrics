"use client";

import { useCallback, useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import { OnrampPaymentFrame, type FundCheckoutSession } from "@/app/pay/onramp-payment-frame";

export function PayFundClient({
  sessionToken,
  initialSession,
}: {
  sessionToken: string;
  initialSession: FundCheckoutSession;
}) {
  const [session, setSession] = useState(initialSession);
  const [sessionReady, setSessionReady] = useState(false);

  const refetchSession = useCallback(async () => {
    const res = await fetch(`/api/pay/fund-session?s=${encodeURIComponent(sessionToken)}`, {
      cache: "no-store",
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error ?? "Could not refresh checkout.");
    setSession({
      paymentLinkOptions: body.paymentLinkOptions ?? [],
      hostedFallbackUrl: body.hostedFallbackUrl,
      expiresAt: body.expiresAt,
      headlessBlockedReason: body.headlessBlockedReason,
      limitUpgradeEligible: body.limitUpgradeEligible ?? false,
      limitUpgradeComplete: body.limitUpgradeComplete ?? false,
    });
  }, [sessionToken]);

  useEffect(() => {
    void refetchSession()
      .catch(() => {})
      .finally(() => setSessionReady(true));
  }, [refetchSession]);

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
  }, [sessionToken]);

  if (!sessionReady) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-3xl border border-border/70 bg-card/80 p-8 text-center shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading Apple Pay checkout…</p>
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
