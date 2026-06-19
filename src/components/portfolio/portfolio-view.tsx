"use client";

import { RefreshCw } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { usdc } from "@/lib/format";
import type {
  PortfolioCoin,
  PortfolioPayload,
  PortfolioPerpPosition,
  PortfolioStakingPosition,
} from "@/lib/portfolio-types";
import { cn } from "@/lib/utils";

type Tab = "coins" | "perpetuals" | "staking";
type ActionCopyHandler = (prompt: string) => Promise<void>;

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "coins", label: "COINS" },
  { id: "perpetuals", label: "PERPETUALS" },
  { id: "staking", label: "STAKING" },
];

function money(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `$${usdc(value)}`;
}

function amount(value: string | number | null | undefined, decimals?: number | null): string {
  if (value == null) return "";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  const maxFractionDigits =
    decimals != null ? Math.min(decimals, 6) : n >= 1 ? 4 : 6;
  return n.toLocaleString("en-US", { maximumFractionDigits: maxFractionDigits });
}

async function copyPrompt(prompt: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(prompt);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = prompt;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

function ActionLink({
  prompt,
  onCopy,
  children,
}: {
  prompt: string;
  onCopy: ActionCopyHandler;
  children: React.ReactNode;
}) {
  async function handleClick() {
    await onCopy(prompt);
  }

  return (
    <button
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-11 flex-1")}
      onClick={handleClick}
      type="button"
    >
      {children}
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card className="border-dashed p-6 text-center">
      <p className="font-mono text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

function CoinAvatar({ coin }: { coin: PortfolioCoin }) {
  if (coin.imageUrl) {
    return (
      <Image
        alt=""
        className="size-11 rounded-full bg-muted object-cover"
        height={44}
        src={coin.imageUrl}
        unoptimized
        width={44}
      />
    );
  }
  return (
    <div className="grid size-11 place-items-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
      {coin.symbol.slice(0, 3).toUpperCase()}
    </div>
  );
}

function walletLabel(data: PortfolioPayload, walletAddress: string): string {
  return data.user.walletLabels[walletAddress.toLowerCase()] ?? "Wallet";
}

function CoinsTab({ data, onCopyAction }: { data: PortfolioPayload; onCopyAction: ActionCopyHandler }) {
  const { coins } = data;
  if (coins.length === 0) return <EmptyState label="No tracked Base coin balances yet." />;
  return (
    <div className="space-y-3">
      {coins.map((coin) => (
        <Card key={coin.id} className="p-4">
          <div className="flex items-center gap-3">
            <CoinAvatar coin={coin} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-display text-base font-semibold">{coin.symbol}</h2>
                <span className="truncate text-xs text-muted-foreground">{coin.name ?? "Base token"}</span>
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                {amount(coin.amount)} {coin.symbol}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {walletLabel(data, coin.walletAddress)}
              </p>
            </div>
            <div className="text-right font-mono text-sm font-semibold">{money(coin.valueUsd)}</div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <ActionLink onCopy={onCopyAction} prompt={`Buy more ${coin.symbol}`}>Buy more</ActionLink>
            <ActionLink onCopy={onCopyAction} prompt={`Sell ${coin.symbol}`}>Sell</ActionLink>
            <ActionLink onCopy={onCopyAction} prompt={`Sell all my ${coin.symbol}`}>Sell all</ActionLink>
          </div>
        </Card>
      ))}
    </div>
  );
}

function PerpCard({
  data,
  position,
  displayIndex,
  onCopyAction,
}: {
  data: PortfolioPayload;
  position: PortfolioPerpPosition;
  displayIndex: number;
  onCopyAction: ActionCopyHandler;
}) {
  const side = position.side ? position.side.toUpperCase() : "POSITION";
  const leverage = position.leverage ? `${position.leverage}x` : "—";
  const promptLabel = `${position.pair} ${position.side ?? ""}`.trim();
  const tradeRef =
    position.pairIndex != null && position.tradeIndex != null
      ? ` (pairIndex: ${position.pairIndex}, tradeIndex: ${position.tradeIndex})`
      : "";
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-primary">#{displayIndex}</span>
            <h2 className="font-display text-lg font-semibold">{position.pair}</h2>
            <span className="rounded-full bg-secondary px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
              {position.kind}
            </span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {side} · {leverage}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {walletLabel(data, position.walletAddress)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-semibold">{money(position.collateralUsd)}</p>
          <p className="font-mono text-[11px] text-muted-foreground">spent</p>
          <p className={cn("font-mono text-xs", (position.pnlUsd ?? 0) >= 0 ? "text-up" : "text-down")}>
            PnL {money(position.pnlUsd)}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs text-muted-foreground">
        <div>SL: {position.stopLoss ?? "not set"}</div>
        <div>TP: {position.takeProfit ?? "not set"}</div>
        <div>Notional: {money(position.sizeUsd)}</div>
        <div>Leverage: {leverage}</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ActionLink onCopy={onCopyAction} prompt={`Modify SL TP for my ${promptLabel} perp${tradeRef}`}>Modify SL/TP</ActionLink>
        <ActionLink onCopy={onCopyAction} prompt={`Close my ${promptLabel} perp${tradeRef}`}>Close position</ActionLink>
      </div>
    </Card>
  );
}

function PerpsTab({ data, onCopyAction }: { data: PortfolioPayload; onCopyAction: ActionCopyHandler }) {
  const { perpetuals: positions } = data;
  if (positions.length === 0) return <EmptyState label="No open or limit perp positions right now." />;
  return (
    <div className="space-y-3">
      {positions.map((position, idx) => (
        <PerpCard key={position.id} data={data} displayIndex={idx + 1} onCopyAction={onCopyAction} position={position} />
      ))}
    </div>
  );
}

function StakingCard({
  data,
  position,
  onCopyAction,
}: {
  data: PortfolioPayload;
  position: PortfolioStakingPosition;
  onCopyAction: ActionCopyHandler;
}) {
  const protocol = position.protocol[0].toUpperCase() + position.protocol.slice(1);
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{position.asset}</h2>
          <p className="font-mono text-xs uppercase text-muted-foreground">{protocol}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-semibold">{money(position.valueUsd)}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {position.apy == null ? "APY unavailable" : `${position.apy.toFixed(2)}% APY`}
          </p>
        </div>
      </div>
      <p className="mt-3 font-mono text-xs text-muted-foreground">
        {amount(position.amount, position.decimals)} {position.asset} in {position.name}
      </p>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
        {walletLabel(data, position.walletAddress)}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ActionLink onCopy={onCopyAction} prompt={`Increase my ${protocol} ${position.asset} position`}>Increase</ActionLink>
        <ActionLink onCopy={onCopyAction} prompt={`Close my ${protocol} ${position.asset} position`}>Close</ActionLink>
      </div>
    </Card>
  );
}

function StakingTab({ data, onCopyAction }: { data: PortfolioPayload; onCopyAction: ActionCopyHandler }) {
  const { staking: positions } = data;
  if (positions.length === 0) {
    return <EmptyState label="No active Morpho, Moonwell, or Aave positions found." />;
  }
  return (
    <div className="space-y-3">
      {positions.map((position) => (
        <StakingCard key={position.id} data={data} onCopyAction={onCopyAction} position={position} />
      ))}
    </div>
  );
}

function PortfolioContent({
  data,
  activeTab,
  onCopyAction,
}: {
  data: PortfolioPayload;
  activeTab: Tab;
  onCopyAction: ActionCopyHandler;
}) {
  if (activeTab === "coins") return <CoinsTab data={data} onCopyAction={onCopyAction} />;
  if (activeTab === "perpetuals") return <PerpsTab data={data} onCopyAction={onCopyAction} />;
  return <StakingTab data={data} onCopyAction={onCopyAction} />;
}

export function PortfolioView({ user, token }: { user: string; token: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("coins");
  const [toastVisible, setToastVisible] = useState(false);
  const { data, status, error, refresh } = usePortfolio(user, token);

  async function handleCopyAction(prompt: string) {
    await copyPrompt(prompt);
    setToastVisible(true);
    window.setTimeout(() => setToastVisible(false), 2600);
  }

  return (
    <main className="min-h-screen bg-grid bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">basemate</p>
            <h1 className="font-display text-xl font-semibold">Portfolio</h1>
          </div>
          <Button variant="outline" size="icon-lg" onClick={refresh} aria-label="Refresh portfolio">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-4 px-4 py-4">
        <Card className="p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Total value</p>
          <div className="mt-2 font-display text-4xl font-semibold">
            {data ? money(data.totals.totalUsd) : "—"}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[11px] text-muted-foreground">
            <div>
              <p>Coins</p>
              <p className="text-foreground">{data ? money(data.totals.coinsUsd) : "—"}</p>
            </div>
            <div>
              <p>Perps</p>
              <p className="text-foreground">{data ? money(data.totals.perpsUsd) : "—"}</p>
            </div>
            <div>
              <p>Staking</p>
              <p className="text-foreground">{data ? money(data.totals.stakingUsd) : "—"}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 rounded-xl border border-border bg-card p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "min-h-11 rounded-lg font-mono text-[11px] font-semibold transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {status === "loading" ? <EmptyState label="Loading portfolio..." /> : null}
        {status === "error" ? <EmptyState label={error ?? "Could not load this portfolio link."} /> : null}
        {status === "ready" && data ? (
          <PortfolioContent activeTab={activeTab} data={data} onCopyAction={handleCopyAction} />
        ) : null}

        {data?.errors.length ? (
          <p className="pb-6 text-center font-mono text-[11px] text-muted-foreground">
            Some protocol reads timed out. Refresh to try again.
          </p>
        ) : null}
      </div>
      {toastVisible ? (
        <div className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-md rounded-xl border border-border px-4 py-3 text-center bg-green-600 text-black font-mono text-xs text-popover-foreground shadow-xl">
          Prompt copied. Paste it to the bot.
        </div>
      ) : null}
    </main>
  );
}
