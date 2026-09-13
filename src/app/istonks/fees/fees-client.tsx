"use client";

import { useState } from "react";
import Link from "next/link";
import { Coins, Loader2, RefreshCw } from "lucide-react";

import { Panel, SectionLabel, StatCard } from "@/components/dashboard/primitives";
import {
  Cell,
  EmptyState,
  ErrorBand,
  LoadingRows,
  Row,
  SignInGate,
  Table,
  useIstonks,
} from "@/components/istonks/ui";
import {
  FEE_SPLIT,
  feeModeLabel,
  formatUsd,
  normalizeFee,
  readError,
  toArray,
  type IstonksFee,
} from "@/lib/istonks";

function feeKey(fee: IstonksFee, index: number): string {
  return fee.id ?? fee.poolId ?? fee.tokenAddress ?? `fee-${index}`;
}

export function FeesClient() {
  const { data, loading, error, unavailable, unauthorized, reload } = useIstonks<unknown>(
    "/api/istonks/app/istonks/fees",
  );
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<string[]>([]);

  const fees = toArray(data).map(normalizeFee);
  const totalUsd = fees.reduce((sum, fee) => sum + (fee.amountUsd ?? 0), 0);
  const claimableCount = fees.filter((fee) => fee.claimable).length;
  const launcherShare = FEE_SPLIT[0].percent;

  async function claim(fee: IstonksFee, key: string) {
    setClaiming(key);
    setClaimError(null);
    try {
      const res = await fetch("/api/istonks/app/istonks/fees/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          poolId: fee.poolId,
          tokenAddress: fee.tokenAddress,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readError(body) ?? `HTTP ${res.status}`);
      setClaimed((prev) => [...prev, key]);
      reload();
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : String(err));
    } finally {
      setClaiming(null);
    }
  }

  if (unauthorized) return <SignInGate what="Claiming launcher fees" />;

  return (
    <div className="animate-ticker-in space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>fees</SectionLabel>
          <h1 className="mt-1 font-display text-[28px] font-semibold tracking-tight sm:text-[32px]">
            Launcher fees
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
            You keep {launcherShare}% of trading fees on every pool you launched. The split is
            locked into the pool at launch — see{" "}
            <Link href="/istonks/stocks" className="text-primary hover:underline">
              the breakdown
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <RefreshCw className="size-3" />
          Refresh
        </button>
      </div>

      {error ? <ErrorBand message={error} /> : null}
      {claimError ? <ErrorBand message={claimError} /> : null}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Pending"
          value={loading ? "—" : formatUsd(totalUsd)}
          accent="up"
          icon={Coins}
          sub={`across ${loading ? "—" : fees.length} pool${fees.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Claimable now"
          value={loading ? "—" : String(claimableCount)}
          accent="primary"
          sub={`your share is ${launcherShare}%`}
        />
      </div>

      <Panel title="pending fees" subtitle="token · pool · amount" bodyClassName="p-4 pt-3">
        {loading ? (
          <Table head={["Token", "Fees", "Amount", ""]}>
            <LoadingRows rows={3} cols={4} />
          </Table>
        ) : fees.length === 0 ? (
          <EmptyState
            title={unavailable ? "Fee claims aren't live yet" : "Nothing to claim"}
            body={
              unavailable
                ? "The fee endpoint hasn't been deployed to this agent yet. Your share still accrues in the pool — it just isn't readable here."
                : "No fees have accrued to your wallet yet. Fees build up as people trade the pools you launched."
            }
            mascot={unavailable ? "mate-support.png" : "mate-peace.png"}
            action={
              <Link
                href="/istonks"
                className="font-mono text-[11px] text-primary hover:underline"
              >
                see the launch board →
              </Link>
            }
          />
        ) : (
          <Table head={["Token", "Fees", "Amount", ""]}>
            {fees.map((fee, i) => {
              const key = feeKey(fee, i);
              const busy = claiming === key;
              const done = claimed.includes(key);
              return (
                <Row key={key}>
                  <Cell>
                    <div className="inline-flex flex-col">
                      <span className="font-mono text-[13px] font-medium">
                        ${fee.tokenSymbol ?? "—"}
                      </span>
                      {fee.pairSymbol ? (
                        <span className="text-[11px] text-muted-foreground">
                          paired {fee.pairSymbol}
                        </span>
                      ) : null}
                    </div>
                  </Cell>
                  <Cell mono className="text-muted-foreground">
                    {feeModeLabel(fee.feeMode)}
                  </Cell>
                  <Cell mono>
                    {fee.amount ?? "—"}
                    {fee.asset ? (
                      <span className="ml-1 text-muted-foreground">{fee.asset}</span>
                    ) : null}
                    {fee.amountUsd != null ? (
                      <span className="ml-2 text-[11px] text-muted-foreground">
                        {formatUsd(fee.amountUsd)}
                      </span>
                    ) : null}
                  </Cell>
                  <Cell className="text-right">
                    <button
                      type="button"
                      disabled={!fee.claimable || busy || done}
                      onClick={() => void claim(fee, key)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:hover:brightness-100"
                    >
                      {busy ? <Loader2 className="size-3 animate-spin" /> : null}
                      {done ? "Claimed" : busy ? "Claiming" : "Claim"}
                    </button>
                  </Cell>
                </Row>
              );
            })}
          </Table>
        )}
      </Panel>
    </div>
  );
}
