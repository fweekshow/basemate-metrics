"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Rocket, Search } from "lucide-react";

import { Panel, SectionLabel } from "@/components/dashboard/primitives";
import {
  Cell,
  EmptyState,
  ErrorBand,
  LoadingRows,
  Row,
  SignInGate,
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
    <div className="animate-ticker-in space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>available stonks</SectionLabel>
          <h1 className="mt-1 font-display text-[28px] font-semibold tracking-tight sm:text-[32px]">
            What you can pair against
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Coinbase tokenized stocks on Base. Launchable ones are live for iStonks Doppler
            pairs from iMessage.
          </p>
        </div>
        <Link
          href="/istonks/launch"
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Launch one
        </Link>
      </div>

      {stocksFetch.error ? <ErrorBand message={stocksFetch.error} /> : null}

      <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-border/60 pb-5 text-[15px]">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
            Launchable
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-up">
            {stocksFetch.loading ? "—" : launchable}
          </p>
        </div>
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
            Listed
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-primary">
            {stocksFetch.loading ? "—" : listed}
          </p>
        </div>
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
            In catalog
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {stocksFetch.loading ? "—" : stocks.length}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Stock pairs</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Ticker · company · price · status
            </p>
          </div>
          <Link
            href="/istonks/stocks"
            className="inline-flex min-h-11 items-center font-mono text-[12px] text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Full registry →
          </Link>
        </div>

        {stocksFetch.loading ? (
          <div className="hidden md:block">
            <Table head={["Ticker", "Company", "Price", "Status"]}>
              <LoadingRows rows={6} cols={4} />
            </Table>
          </div>
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
          <>
            <div className="hidden md:block">
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
            </div>
            <ul className="divide-y divide-border/70 md:hidden">
              {stocks.map((stock) => (
                <li
                  key={stock.symbol ?? stock.address ?? Math.random()}
                  className="flex items-start justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[15px] font-medium">
                        ${stock.symbol ?? "—"}
                      </span>
                      <StatusBadge status={stockStatus(stock)} />
                    </div>
                    <p className="mt-1 truncate text-[14px] text-muted-foreground">
                      {stock.name ?? "—"}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-[15px] tabular-nums">
                    {formatUsd(stock.priceUsd)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {signedIn ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <SectionLabel>your launches</SectionLabel>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                Manage & claim
              </h2>
              <p className="mt-1 max-w-2xl text-base leading-relaxed text-muted-foreground">
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
                className="min-h-11 w-full rounded-full border border-border bg-card py-2 pr-4 pl-9 font-mono text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
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
                className="inline-flex min-h-11 shrink-0 items-center font-mono text-[12px] text-muted-foreground transition-colors hover:text-primary"
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
                            <span className="truncate text-[12px] text-muted-foreground">
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
                          className="inline-flex min-h-11 items-center gap-1 rounded-full bg-primary px-4 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-primary-foreground disabled:opacity-40"
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
        <SignInGate what="Seeing your launches" />
      )}
    </div>
  );
}
