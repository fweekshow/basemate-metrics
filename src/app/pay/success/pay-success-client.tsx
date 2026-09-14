"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { istonkPayCopy } from "@/lib/istonks-pay";
import { IMESSAGE_HREF, SITE } from "@/lib/site";

type GiftSuccessMeta = {
  isGift: boolean;
  isBitrefill: boolean;
  claimUrl?: string | null;
  recipientDisplay?: string | null;
  stockLabel?: string | null;
  productName?: string | null;
};

export function PaySuccessClient({ sessionToken }: { sessionToken?: string }) {
  const recordedRef = useRef(false);
  const [gift, setGift] = useState<GiftSuccessMeta>({ isGift: false, isBitrefill: false });

  useEffect(() => {
    if (!sessionToken || recordedRef.current) return;
    recordedRef.current = true;
    void fetch("/api/pay/record-funding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionToken }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json().catch(() => null)) as {
          isGift?: boolean;
          isBitrefill?: boolean;
          giftId?: string | null;
        } | null;
        if (data?.isGift || data?.isBitrefill) {
          setGift({ isGift: Boolean(data.isGift), isBitrefill: Boolean(data.isBitrefill) });
          void fetchGiftMeta(sessionToken).then((meta) => {
            if (meta) setGift(meta);
          });
        }
      })
      .catch(() => {});
  }, [sessionToken]);

  if (gift.isGift || gift.isBitrefill) {
    const copy = istonkPayCopy({
      isBitrefill: gift.isBitrefill,
      isGift: gift.isGift,
      productName: gift.productName,
      giftLabel: gift.stockLabel,
      recipientDisplay: gift.recipientDisplay,
    });
    return (
      <section className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <div
          className="flex h-[88px] w-[88px] items-center justify-center rounded-2xl border border-border/80 bg-card p-2"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <Image
            src="/brand/mascot/mate-win-buff.png"
            alt=""
            width={72}
            height={72}
            className="h-[72px] w-[72px] object-contain"
            priority
          />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Apple Pay confirmed
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {copy.successDescription}
        </p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            render={<a href={IMESSAGE_HREF} />}
            nativeButton={false}
            size="lg"
            className="rounded-full"
          >
            Return to chat
          </Button>
          <Button
            render={<Link href="/account#activity" />}
            nativeButton={false}
            variant="outline"
            size="lg"
            className="rounded-full"
          >
            View activity
          </Button>
        </div>
        {gift.claimUrl ? (
          <div className="mt-6 w-full max-w-sm rounded-[20px] border border-border/80 bg-card p-4 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Claim link
            </p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">{gift.claimUrl}</p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  void navigator.clipboard?.writeText(gift.claimUrl!);
                }}
              >
                Copy
              </Button>
              {"share" in navigator ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    void navigator.share?.({
                      title: "Claim your Basemate stock gift",
                      url: gift.claimUrl!,
                    });
                  }}
                >
                  Share
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <div
        className="flex h-[88px] w-[88px] items-center justify-center rounded-2xl border border-border/80 bg-card p-2"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <Image
          src="/brand/mascot/mate-win-buff.png"
          alt=""
          width={72}
          height={72}
          className="h-[72px] w-[72px] object-contain"
          priority
        />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        You&apos;re funded
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        Your USDC purchase went through. Close this page and head back to your Basemate chat — your
        balance updates in a moment.
      </p>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
        <Button render={<Link href="/landing" />} nativeButton={false} size="lg" className="rounded-full">
          Back to Basemate
        </Button>
        <Button
          render={<a href={SITE.appUrl} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
          variant="outline"
          size="lg"
          className="rounded-full"
        >
          Open app
        </Button>
      </div>
    </section>
  );
}

async function fetchGiftMeta(sessionToken: string): Promise<GiftSuccessMeta | null> {
  try {
    const res = await fetch(`/api/pay/gift-status?s=${encodeURIComponent(sessionToken)}`, {
      cache: "no-store",
    });
    if (!res.ok) return { isGift: true, isBitrefill: false };
    const data = (await res.json()) as {
      isGift?: boolean;
      isBitrefill?: boolean;
      claimUrl?: string | null;
      recipientDisplay?: string | null;
      stockLabel?: string | null;
      productName?: string | null;
    };
    return {
      isGift: Boolean(data.isGift),
      isBitrefill: Boolean(data.isBitrefill),
      claimUrl: data.claimUrl ?? null,
      recipientDisplay: data.recipientDisplay ?? null,
      stockLabel: data.stockLabel ?? null,
      productName: data.productName ?? null,
    };
  } catch {
    return { isGift: true, isBitrefill: false };
  }
}
