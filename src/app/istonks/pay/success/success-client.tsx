"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { ISTONK_IMESSAGE_HREF, ISTONK_PAY_OG_PATH } from "@/lib/istonks-pay";

type GiftSuccessMeta = {
  isGift: boolean;
  claimUrl?: string | null;
  recipientDisplay?: string | null;
  stockLabel?: string | null;
};

export function IstonkPaySuccessClient({ sessionToken }: { sessionToken?: string }) {
  const recordedRef = useRef(false);
  const [gift, setGift] = useState<GiftSuccessMeta>({ isGift: true });

  useEffect(() => {
    if (!sessionToken || recordedRef.current) return;
    recordedRef.current = true;
    void fetch("/api/istonks/pay/record-funding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionToken }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json().catch(() => null)) as { isGift?: boolean } | null;
        if (data?.isGift !== false) {
          setGift({ isGift: true });
          void fetchGiftMeta(sessionToken).then((meta) => {
            if (meta) setGift(meta);
          });
        }
      })
      .catch(() => {});
  }, [sessionToken]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <Image
        src={ISTONK_PAY_OG_PATH}
        alt=""
        width={320}
        height={180}
        className="h-auto w-full max-w-[240px] rounded-[18px] object-cover"
        priority
      />
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Apple Pay confirmed
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        {gift.stockLabel
          ? `iStonk is buying ${gift.stockLabel}${gift.recipientDisplay ? ` for ${gift.recipientDisplay}` : ""} now. You'll get a text when it lands.`
          : "iStonk is buying and sending the stock now. You'll get a text when it lands."}
      </p>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          render={<a href={ISTONK_IMESSAGE_HREF} />}
          nativeButton={false}
          size="lg"
          className="rounded-full"
        >
          Return to chat
        </Button>
      </div>
      {gift.claimUrl ? (
        <div className="mt-6 w-full max-w-sm rounded-[20px] border border-border/80 bg-card p-4 text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Claim link
          </p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">{gift.claimUrl}</p>
        </div>
      ) : null}
    </section>
  );
}

async function fetchGiftMeta(sessionToken: string): Promise<GiftSuccessMeta | null> {
  try {
    const res = await fetch(`/api/istonks/pay/gift-status?s=${encodeURIComponent(sessionToken)}`, {
      cache: "no-store",
    });
    if (!res.ok) return { isGift: true };
    const data = (await res.json()) as GiftSuccessMeta;
    return {
      isGift: Boolean(data.isGift),
      claimUrl: data.claimUrl ?? null,
      recipientDisplay: data.recipientDisplay ?? null,
      stockLabel: data.stockLabel ?? null,
    };
  } catch {
    return { isGift: true };
  }
}
