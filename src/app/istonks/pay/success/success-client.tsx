"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  ISTONK_IMESSAGE_HREF,
  ISTONK_PAY_OG_PATH,
  istonkPayCopy,
} from "@/lib/istonks-pay";

const ISTONK_APP_URL = "https://istonks.meme/app";

type SuccessMeta = {
  isGift: boolean;
  isBitrefill: boolean;
  claimUrl?: string | null;
  recipientDisplay?: string | null;
  stockLabel?: string | null;
  productName?: string | null;
  returnTo?: "imessage" | "web";
};

export function IstonkPaySuccessClient({ sessionToken }: { sessionToken?: string }) {
  const recordedRef = useRef(false);
  const [meta, setMeta] = useState<SuccessMeta>({
    isGift: false,
    isBitrefill: false,
    returnTo: "imessage",
  });

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
        const data = (await res.json().catch(() => null)) as {
          isGift?: boolean;
          isBitrefill?: boolean;
        } | null;
        setMeta((prev) => ({
          ...prev,
          isGift: Boolean(data?.isGift),
          isBitrefill: Boolean(data?.isBitrefill),
        }));
        void Promise.all([fetchGiftMeta(sessionToken), fetchReturnTo(sessionToken)]).then(
          ([giftMeta, returnTo]) => {
            setMeta((prev) => ({
              ...prev,
              ...(giftMeta ?? {}),
              returnTo: returnTo ?? prev.returnTo ?? "imessage",
            }));
          },
        );
      })
      .catch(() => {});

    void fetchReturnTo(sessionToken).then((returnTo) => {
      if (returnTo) setMeta((prev) => ({ ...prev, returnTo }));
    });
  }, [sessionToken]);

  const copy = istonkPayCopy({
    isBitrefill: meta.isBitrefill,
    isGift: meta.isGift,
    productName: meta.productName,
    giftLabel: meta.stockLabel,
    recipientDisplay: meta.recipientDisplay,
  });
  const description =
    meta.isBitrefill || meta.isGift
      ? copy.successDescription
      : "iStonk is finishing this up. You'll get a text when it's done.";

  const fromWeb = meta.returnTo === "web";

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
        {fromWeb
          ? `${description} You can close this page and open your iStonk account.`
          : description}
      </p>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
        {fromWeb ? (
          <>
            <Button
              render={<a href={ISTONK_APP_URL} />}
              nativeButton={false}
              size="lg"
              className="rounded-full"
            >
              Back to account
            </Button>
            <Button
              render={<a href={ISTONK_IMESSAGE_HREF} />}
              nativeButton={false}
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              Text iStonk
            </Button>
          </>
        ) : (
          <>
            <Button
              render={<a href={ISTONK_IMESSAGE_HREF} />}
              nativeButton={false}
              size="lg"
              className="rounded-full"
            >
              Return to chat
            </Button>
            <Button
              render={<Link href={ISTONK_APP_URL} />}
              nativeButton={false}
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              Open account
            </Button>
          </>
        )}
      </div>
      {meta.claimUrl ? (
        <div className="mt-6 w-full max-w-sm rounded-[20px] border border-border/80 bg-card p-4 text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Claim link
          </p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">{meta.claimUrl}</p>
        </div>
      ) : null}
    </section>
  );
}

async function fetchGiftMeta(sessionToken: string): Promise<Partial<SuccessMeta> | null> {
  try {
    const res = await fetch(`/api/istonks/pay/gift-status?s=${encodeURIComponent(sessionToken)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SuccessMeta & { productName?: string | null };
    return {
      isGift: Boolean(data.isGift),
      isBitrefill: Boolean(data.isBitrefill),
      claimUrl: data.claimUrl ?? null,
      recipientDisplay: data.recipientDisplay ?? null,
      stockLabel: data.stockLabel ?? null,
      productName: data.productName ?? null,
    };
  } catch {
    return null;
  }
}

async function fetchReturnTo(sessionToken: string): Promise<"imessage" | "web" | null> {
  try {
    const res = await fetch(`/api/pay/fund-session?s=${encodeURIComponent(sessionToken)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      returnTo?: string;
      product?: string;
      source?: string;
      needsOnrampPhone?: boolean;
    };
    if (data.returnTo === "web" || data.returnTo === "imessage") return data.returnTo;
    // Web CDP senders needed an onramp phone; iMessage sessions already had +1.
    if (data.product === "istonk" || data.source === "istonk") {
      return data.needsOnrampPhone ? "web" : "imessage";
    }
    return null;
  } catch {
    return null;
  }
}
