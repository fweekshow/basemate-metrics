import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SiteShell } from "@/components/site/site-shell";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Payment Complete · Basemate",
  description: "Your Basemate wallet funding payment was submitted successfully.",
  openGraph: {
    title: "Payment Complete · Basemate",
    description: "Your Basemate wallet funding payment was submitted successfully.",
    type: "website",
    images: [SITE.pfp],
  },
};

export default function PaySuccessPage() {
  return (
    <SiteShell>
      <section className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-up/30 bg-up/10 text-up">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">Payment submitted</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Your USDC purchase was submitted successfully. You can close this page and return to your Basemate chat.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button render={<Link href="/" />} nativeButton={false} size="lg">
            Back to Basemate
          </Button>
          <Button
            render={<a href={SITE.appUrl} target="_blank" rel="noopener noreferrer" />}
            nativeButton={false}
            variant="outline"
            size="lg"
          >
            Open app.basemate.app
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
