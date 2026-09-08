"use client";

import { SectionLabel } from "@/components/dashboard/primitives";
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
  formatUsd,
  normalizeStock,
  stockStatus,
  toArray,
  type IstonksStock,
} from "@/lib/istonks";

function byTicker(a: IstonksStock, b: IstonksStock): number {
  return (a.symbol ?? "").localeCompare(b.symbol ?? "");
}

export function StocksClient() {
  const { data, loading, error, unavailable } = useIstonks<unknown>("/api/istonks/stocks");

  const stocks = toArray(data).map(normalizeStock).sort(byTicker);
  const listed = stocks.filter((s) => s.listed).length;
  const tradeable = stocks.filter((s) => s.launchable || s.tradeable).length;
  const launched = stocks.reduce((sum, s) => sum + (s.launchCount ?? 0), 0);

  return (
    <div className="animate-ticker-in space-y-3">
      <div>
        <SectionLabel>quote registry</SectionLabel>
        <h1 className="mt-1 font-display text-[28px] font-semibold tracking-tight sm:text-[32px]">
          Stock pairs
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
          These are the Coinbase tokenized stocks an iStonks token can be priced against. The
          stock is the numeraire — the quote asset on the other side of the pool.
        </p>
      </div>

      {error ? <ErrorBand message={error} /> : null}

      <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-border/60 pb-5">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
            Listed
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-primary">
            {loading ? "—" : listed}
          </p>
        </div>
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
            Launchable
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-up">
            {loading ? "—" : tradeable}
          </p>
        </div>
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
            Launched
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {loading ? "—" : launched}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Registry</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Ticker · company · price · status
          </p>
        </div>

        {loading ? (
          <div className="hidden md:block">
            <Table head={["Ticker", "Company", "Price", "Status"]}>
              <LoadingRows rows={6} cols={4} />
            </Table>
          </div>
        ) : stocks.length === 0 ? (
          <EmptyState
            title={unavailable ? "Registry isn't live yet" : "No stock pairs configured"}
            body={
              unavailable
                ? "The registry endpoint hasn't been deployed to this agent yet. Once it is, every tokenized stock and its status shows up here."
                : "No tokenized stocks are configured as numeraires on this agent right now."
            }
            mascot="mate-support.png"
          />
        ) : (
          <>
            <div className="hidden md:block">
              <Table head={["Ticker", "Company", "Price", "Status"]}>
                {stocks.map((stock, i) => (
                  <Row key={stock.address ?? `${stock.symbol}-${i}`}>
                    <Cell>
                      <span className="font-mono text-[13px] font-medium">
                        {stock.symbol ?? "—"}
                      </span>
                    </Cell>
                    <Cell className="text-muted-foreground">{stock.name ?? "—"}</Cell>
                    <Cell mono>
                      {formatUsd(stock.priceUsd)}
                      {stock.paused ? (
                        <span className="ml-2 font-mono text-[12px] uppercase tracking-[0.14em] text-amber">
                          feed paused
                        </span>
                      ) : !stock.inMarketHours && stock.priceUsd != null ? (
                        <span className="ml-2 font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
                          after hours
                        </span>
                      ) : null}
                    </Cell>
                    <Cell>
                      <StatusBadge status={stockStatus(stock)} />
                    </Cell>
                  </Row>
                ))}
              </Table>
            </div>
            <ul className="divide-y divide-border/70 md:hidden">
              {stocks.map((stock, i) => (
                <li
                  key={stock.address ?? `${stock.symbol}-${i}`}
                  className="flex items-start justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[15px] font-medium">
                        {stock.symbol ?? "—"}
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

      <p className="text-[12px] leading-relaxed text-muted-foreground">
        launchable = you can pair a new iStonks launch against it · listed = on Coinbase&apos;s
        official Base product list · registered = in the catalog, not launchable yet
      </p>
    </div>
  );
}
