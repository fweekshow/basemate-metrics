"use client";

import { useCallback, useEffect, useState } from "react";

import { OnrampPaymentFrame, type FundCheckoutSession } from "@/app/pay/onramp-payment-frame";

export function PayFundClient({
  sessionToken,
  initialSession,
}: {
  sessionToken: string;
  initialSession: FundCheckoutSession;
}) {
  const [session, setSession] = useState(initialSession);

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
    void refetchSession().catch(() => {});
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
