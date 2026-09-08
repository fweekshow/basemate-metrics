"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Fuel, Smartphone, Wallet } from "lucide-react";

import { Panel, SectionLabel } from "@/components/dashboard/primitives";
import {
  AddressLink,
  CopyButton,
  ErrorBand,
  SignInGate,
  Spinner,
  useIstonks,
} from "@/components/istonks/ui";
import { BASE_CHAIN_ID } from "@/lib/istonks";

interface Profile {
  displayName: string | null;
  basename: string | null;
  embeddedAddress: string | null;
}

export function FundClient() {
  const { data, loading, error, unauthorized } = useIstonks<Profile>("/api/app/profile");
  const address = data?.embeddedAddress ?? null;
  // EIP-681 payment URI — wallets that scan this land on Base with the
  // recipient prefilled instead of guessing the network.
  const paymentUri = address ? `ethereum:${address}@${BASE_CHAIN_ID}` : null;

  if (unauthorized) return <SignInGate what="Funding your launch wallet" />;

  return (
    <div className="animate-ticker-in space-y-4">
      <div>
        <SectionLabel>fund</SectionLabel>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          Your launch wallet
        </h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          Launches are self-funded. You sign every transaction from this wallet, so it needs a
          little ETH on Base for gas before you can launch anything.
        </p>
      </div>

      {error ? <ErrorBand message={error} /> : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          title="receive on base"
          subtitle={data?.basename ?? data?.displayName ?? "your embedded wallet"}
          bodyClassName="p-6"
        >
          {loading ? (
            <Spinner />
          ) : !address ? (
            <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
              <p>
                No embedded wallet on this account yet. Text the agent once from iMessage and
                it&apos;ll create one, then this page will show the address.
              </p>
              <Link
                href="/app"
                className="inline-flex rounded-full bg-primary px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground"
              >
                Open wallet
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)]">
                <QRCodeSVG
                  value={paymentUri ?? address}
                  size={176}
                  level="M"
                  marginSize={0}
                  bgColor="#FFFFFF"
                  fgColor="#0A0A1A"
                  title="Base wallet address QR code"
                />
              </div>
              <p className="w-full break-all rounded-lg border border-border bg-muted px-3 py-3 text-center font-mono text-[12px]">
                {address}
              </p>
              <div className="flex w-full flex-wrap items-center justify-center gap-2">
                <CopyButton value={address} label="Copy address" />
                <a
                  href={`https://basescan.org/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-border bg-card px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  Basescan ↗
                </a>
              </div>
              <p className="text-center font-mono text-[10px] leading-relaxed text-muted-foreground">
                Base mainnet only (chain {BASE_CHAIN_ID}). Sending from another network will lose
                the funds.
              </p>
            </div>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel title="gas" subtitle="what a launch actually costs you" bodyClassName="p-5">
            <div className="flex gap-3">
              <Fuel className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
                <p>
                  A launch is a handful of Base transactions signed by you. You don&apos;t need to
                  buy the tokenized stock and you don&apos;t need to seed the other side of the
                  pool — you need ETH for gas, and that&apos;s it.
                </p>
                <p className="text-foreground">
                  Keep a small ETH balance here so a launch never fails mid-flow.
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="apple pay" subtitle="card and wallet top-ups" bodyClassName="p-5">
            <div className="flex gap-3">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
                <p>
                  You&apos;re signed in, so you can buy USDC on Base with Apple Pay, Google Pay, or
                  card through Coinbase — same onramp the wallet uses. Minimum $2.
                </p>
                <Link
                  href="/app"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <Wallet className="size-3.5" />
                  Add funds in wallet
                </Link>
              </div>
            </div>
          </Panel>

          {address ? (
            <Panel title="wallet" subtitle="linked to your account" bodyClassName="px-5 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Address
                </span>
                <AddressLink address={address} />
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
