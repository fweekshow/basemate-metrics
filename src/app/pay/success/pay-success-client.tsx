"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export function PaySuccessClient({ sessionToken }: { sessionToken?: string }) {
  const recordedRef = useRef(false);

  useEffect(() => {
    if (!sessionToken || recordedRef.current) return;
    recordedRef.current = true;
    void fetch("/api/pay/record-funding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionToken }),
    }).catch(() => {});
  }, [sessionToken]);

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
        Your USDC purchase went through. Close this page and head back to your Stablemate chat — your
        balance updates in a moment.
      </p>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
        <Button render={<Link href="/landing" />} nativeButton={false} size="lg" className="rounded-full">
          Back to Stablemate
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
