"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Coins, ListChecks, Loader2, Rocket, Search } from "lucide-react";

import { Panel, SectionLabel, StatCard } from "@/components/dashboard/primitives";
import {
  Cell,
  EmptyState,
  ErrorBand,
  LoadingRows,
  Row,
  StatusBadge,
  Table,
  useIstonks,
} from "@/components/istonks/ui";
import {
  formatDate,
  formatUsd,
  feeModeLabel,
  normalizeLaunch,
  normalizeStock,
  readError,
  sortLaunchesNewestFirst,
  stockStatus,
  toArray,
  type IstonksLaunch,
  type IstonksStock,
} from "@/lib/istonks";

function byTicker(a: IstonksStock, b: IstonksStock): number {
  // Launchable first, then listed, then alpha
  const rank = (s: IstonksStock) => (s.launchable ? 0 : s.listed ? 1 : 2);
  const d = rank(a) - rank(b);
  if (d !== 0) return d;
  return (a.symbol ?? "").localeCompare(b.symbol ?? "");
}

function matchesQuery(launch: IstonksLaunch, q: string): boolean {
  if (!q) return true;
  const hay = [
    launch.symbol,
    launch.name,
    launch.pairSymbol,
    launch.tokenAddress,
    launch.poolId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function BoardClient({ signedIn }: { signedIn: boolean }) {
  const stocksFetch = useIstonks<unknown>("/api/istonks/stocks");
  const myLaunchesFetch = useIstonks<unknown>(signedIn ? "/api/app/istonks/launches" : "");

  const stocks = useMemo(
    () => toArray(stocksFetch.data).map(normalizeStock).sort(byTicker),
    [stocksFetch.data],
  );
  const launchable = stocks.filter((s) => s.launchable).length;
  const listed = stocks.filter((s) => s.listed).length;

  const myLaunches = useMemo(
    () => sortLaunchesNewestFirst(toArray(myLaunchesFetch.data).map(normalizeLaunch)),
    [myLaunchesFetch.data],
  );

  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => myLaunches.filter((l) => matchesQuery(l, query.trim().toLowerCase())),
    [myLaunches, query],
  );

  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<string[]>([]);

  async function claimLaunch(launch: IstonksLaunch) {
    const key = launch.poolId ?? launch.tokenAddress ?? launch.symbol ?? "claim";
    setClaiming(key);
    setClaimError(null);
    try {
      const res = await fetch("/api/app/istonks/fees/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          poolId: launch.poolId,
          tokenAddress: launch.tokenAddress,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readError(body) ?? `HTTP ${res.status}`);
      setClaimed((prev) => [...prev, key]);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : String(err));
    } finally {
      setClaiming(null);
    }
  }

  return (
    <div className="animate-ticker-in space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>available stonks</SectionLabel>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            What you can pair against
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Coinbase tokenized stocks on Base. Launchable ones are live for iStonks Doppler
            pairs from iMessage. Flip happens in the agent catalog — not here.
          </p>
        </div>
        <Link
          href="/istonks/launch"
          className="rounded-full bg-primary px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Launch one
        </Link>
      </div>

      {stocksFetch.error ? <ErrorBand message={stocksFetch.error} /> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Launchable"
          value={stocksFetch.loading ? "—" : String(launchable)}
          accent="up"
          icon={CheckCircle2}
          sub="open for new pairs"
        />
        <StatCard
          label="Listed"
          value={stocksFetch.loading ? "—" : String(listed)}
          accent="primary"
          icon={ListChecks}
          sub="on base.org/stocks"
        />
        <StatCard
          label="In catalog"
          value={stocksFetch.loading ? "—" : String(stocks.length)}
          accent="cyan"
          icon={Coins}
          sub="all B20 offers"
        />
      </div>

      <Panel
        title="stock pairs"
        subtitle="ticker · company · price · status"
        right={
          <Link
            href="/istonks/stocks"
            className="shrink-0 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
          >
            full registry →
          </Link>
        }
        bodyClassName="p-4 pt-3"
      >
        {stocksFetch.loading ? (
          <Table head={["Ticker", "Company", "Price", "Status"]}>
            <LoadingRows rows={6} cols={4} />
          </Table>
        ) : stocks.length === 0 ? (
          <EmptyState
            title={stocksFetch.unavailable ? "Catalog isn't live yet" : "No stocks configured"}
            body={
              stocksFetch.unavailable
                ? "The stock registry endpoint hasn't been deployed to this agent yet."
                : "The agent catalog is empty — check stockCatalog.ts."
            }
            mascot="mate-support.png"
          />
        ) : (
          <Table head={["Ticker", "Company", "Price", "Status"]}>
            {stocks.map((stock) => (
              <Row key={stock.symbol ?? stock.address ?? Math.random()}>
                <Cell mono className="font-medium">
                  ${stock.symbol ?? "—"}
                </Cell>
                <Cell>{stock.name ?? "—"}</Cell>
                <Cell mono>{formatUsd(stock.priceUsd)}</Cell>
                <Cell>
                  <StatusBadge status={stockStatus(stock)} />
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Panel>

      {signedIn ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <SectionLabel>your launches</SectionLabel>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                Manage & claim
              </h2>
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
                Search your Doppler stock pairs and claim launcher fees from the same place.
              </p>
            </div>
            <label className="relative block w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ticker, pair, address…"
                className="w-full rounded-full border border-border bg-card py-2 pr-4 pl-9 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
              />
            </label>
          </div>

          {claimError ? <ErrorBand message={claimError} /> : null}
          {myLaunchesFetch.error ? <ErrorBand message={myLaunchesFetch.error} /> : null}

          <Panel
            title="my launches"
            subtitle={`${filtered.length} shown`}
            right={
              <Link
                href="/istonks/fees"
                className="shrink-0 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
              >
                all fees →
              </Link>
            }
            bodyClassName="p-4 pt-3"
          >
            {myLaunchesFetch.loading ? (
              <Table head={["Token", "Pair", "Fees", "Date", ""]}>
                <LoadingRows rows={3} cols={5} />
              </Table>
            ) : myLaunchesFetch.unauthorized ? (
              <EmptyState
                title="Sign in to see your launches"
                body="Use the same email you set up in iMessage."
                mascot="mate-support.png"
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title={myLaunches.length === 0 ? "No launches yet" : "No matches"}
                body={
                  myLaunches.length === 0
                    ? `Launch from the site or text me a photo + name against ${stocks.find((s) => s.launchable)?.symbol ?? "NVDAc"}…`
                    : "Try a different ticker, pair, or address."
                }
                mascot="mate-peace.png"
              />
            ) : (
              <Table head={["Token", "Pair", "Fees", "Date", ""]}>
                {filtered.map((launch, i) => {
                  const key = launch.poolId ?? launch.tokenAddress ?? `${launch.symbol}-${i}`;
                  const done = claimed.includes(key);
                  return (
                    <Row key={key}>
                      <Cell>
                        {launch.tokenAddress ? (
                          <Link
                            href={`/istonks/token/${launch.tokenAddress}`}
                            className="group inline-flex flex-col"
                          >
                            <span className="font-mono text-[13px] font-medium text-foreground transition-colors group-hover:text-primary">
                              ${launch.symbol ?? "—"}
                            </span>
                            <span className="truncate text-[11px] text-muted-foreground">
                              {launch.name ?? "unnamed"}
                            </span>
                          </Link>
                        ) : (
                          <span className="font-mono text-[13px]">${launch.symbol ?? "—"}</span>
                        )}
                      </Cell>
                      <Cell mono>{launch.pairSymbol ?? "—"}</Cell>
                      <Cell mono className="text-muted-foreground">
                        {feeModeLabel(launch.feeMode)}
                      </Cell>
                      <Cell mono className="text-muted-foreground">
                        {formatDate(launch.launchedAt)}
                      </Cell>
                      <Cell>
                        <button
                          type="button"
                          disabled={claiming === key || done || !launch.poolId}
                          onClick={() => void claimLaunch(launch)}
                          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground disabled:opacity-40"
                        >
                          {claiming === key ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Rocket className="size-3" />
                          )}
                          {done ? "Claimed" : "Claim"}
                        </button>
                      </Cell>
                    </Row>
                  );
                })}
              </Table>
            )}
          </Panel>
        </section>
      ) : (
        <Panel title="your launches" subtitle="sign in to manage" bodyClassName="p-6">
          <EmptyState
            title="Sign in to see your launches"
            body="Browse the stock pairs above for free. Sign in at /app with the email you used in iMessage to search your launches and claim fees."
            mascot="mate-peace.png"
          />
          <div className="mt-4 flex justify-center">
            <Link
              href="/app"
              className="rounded-full bg-primary px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground"
            >
              Sign in
            </Link>
          </div>
        </Panel>
      )}
    </div>
  );
}
