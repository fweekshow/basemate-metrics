import { Wallet } from "lucide-react";

import { OfframpFlow } from "@/app/pay/offramp-flow";
import { SiteShell } from "@/components/site/site-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReturnSearchParams = Promise<{ o?: string | string[] }>;

export default async function OfframpReturnPage({
  searchParams,
}: {
  searchParams: ReturnSearchParams;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.o) ? params.o[0] : params.o;

  return (
    <SiteShell>
      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <Wallet className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Complete your cash out
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Review Coinbase&apos;s order and approve the exact USDC transfer from your Base Account.
            </p>
          </div>
        </header>
        {token ? (
          <OfframpFlow token={token} mode="return" />
        ) : (
          <p className="text-center text-sm text-destructive">Missing cash-out session.</p>
        )}
      </section>
    </SiteShell>
  );
}
