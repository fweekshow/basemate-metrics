"use client";

import Link from "next/link";
import { ArrowLeft, Coins, Percent, Rocket } from "lucide-react";

import { Panel, SectionLabel, StatCard } from "@/components/dashboard/primitives";
import {
  AddressLink,
  CopyButton,
  EmptyState,
  ErrorBand,
  Spinner,
  useIstonks,
} from "@/components/istonks/ui";
import {
  FEE_SPLIT,
  feeModeLabel,
  formatDateTime,
  formatUsd,
  normalizeToken,
  shortAddress,
} from "@/lib/istonks";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border/50 py-2.5 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 break-all text-right font-mono text-[12px] tabular-nums">
        {children}
      </span>
    </div>
  );
}

export function TokenClient({ address, valid }: { address: string; valid: boolean }) {
  const { data, loading, error, unavailable } = useIstonks<unknown>(
    valid ? `/api/istonks/token/${address}` : "",
  );

  const token = normalizeToken(data);

  const back = (
    <Link
      href="/istonks"
      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
    >
      <ArrowLeft className="size-3" />
      back to board
    </Link>
  );

  if (!valid) {
    return (
      <div className="space-y-4">
        {back}
        <EmptyState
          title="That isn't a Base token address"
          body="Token pages live at /istonks/token/0x… — check the address and try again."
          mascot="mate-rekt.png"
        />
      </div>
    );
  }

  return (
    <div className="animate-ticker-in space-y-4">
      {back}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <SectionLabel>token</SectionLabel>
          <h1 className="mt-1 font-display text-[28px] font-semibold tracking-tight sm:text-3xl">
            {token?.symbol ? `$${token.symbol}` : shortAddress(address, 8, 6)}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {token?.name ?? "Paired against a Coinbase tokenized stock on Base."}
          </p>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Fixed supply via Doppler. Contract owner is the Doppler Airlock protocol — not the
            launcher — so mint rate and ownership stay with the launchpad, not your wallet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={address} label="Copy address" />
          <a
            href={`https://basescan.org/token/${address}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border bg-card px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Basescan ↗
          </a>
        </div>
      </div>

      {error ? <ErrorBand message={error} /> : null}

      {loading ? (
        <Spinner />
      ) : !token ? (
        <EmptyState
          title={unavailable ? "Token detail isn't live yet" : "Nothing on record for this token"}
          body={
            unavailable
              ? "The token endpoint hasn't been deployed to this agent yet. The contract address below still works on Basescan."
              : "This agent has no launch on record at that address. It may have launched elsewhere, or the address may be wrong."
          }
          mascot="mate-support.png"
          action={
            <p className="break-all font-mono text-[11px] text-muted-foreground">{address}</p>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard
              label="Numeraire"
              value={token.pairSymbol ?? "—"}
              accent="cyan"
              icon={Coins}
              sub={token.pair?.name ?? "quote asset for the pool"}
            />
            <StatCard
              label="Stock price"
              value={formatUsd(token.pair?.priceUsd ?? null)}
              accent="primary"
              icon={Percent}
              sub={
                token.pair?.priceUpdatedAt
                  ? `feed ${formatDateTime(token.pair.priceUpdatedAt)}`
                  : "chainlink total-return feed"
              }
            />
            <StatCard
              label="Launched"
              value={token.launchedAt ? formatDateTime(token.launchedAt).slice(0, 10) : "—"}
              accent="violet"
              icon={Rocket}
              sub={token.launchedAt ? formatDateTime(token.launchedAt) : "date unavailable"}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="contract" subtitle="on Base" bodyClassName="px-4 py-2">
              <Field label="Token">
                <AddressLink address={token.tokenAddress ?? address} kind="token" full />
              </Field>
              <Field label="Pair">
                <AddressLink address={token.pairAddress} kind="token" full />
              </Field>
              <Field label="Pool">
                {token.poolId ? shortAddress(token.poolId, 10, 8) : "—"}
              </Field>
              <Field label="Fee payout">
                {feeModeLabel(token.feeMode)}
              </Field>
              <Field label="Launcher">
                <AddressLink address={token.launcher} />
              </Field>
              <Field label="Total supply">{token.totalSupply ?? "—"}</Field>
              <Field label="In pool">
                {token.poolSupplyPercent != null ? `${token.poolSupplyPercent}%` : "~90%"}
              </Field>
            </Panel>

            <Panel title="fee split" subtitle="locked in at launch" bodyClassName="px-4 py-2">
              {FEE_SPLIT.map((slice) => (
                <Field key={slice.label} label={`${slice.label} · ${slice.note}`}>
                  {slice.percent}%
                </Field>
              ))}
              <p className="py-3 text-[11px] leading-relaxed text-muted-foreground">
                The launcher share accrues to the wallet that signed this launch and can be claimed
                from the{" "}
                <Link href="/istonks/fees" className="text-primary hover:underline">
                  Fees
                </Link>{" "}
                page.
              </p>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
