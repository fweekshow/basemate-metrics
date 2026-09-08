"use client";

import { CheckCircle2, ListChecks, Rocket } from "lucide-react";

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
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Stock pairs</h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          These are the Coinbase tokenized stocks an iStonks token can be priced against. The
          stock is the numeraire — the quote asset on the other side of the pool.
        </p>
      </div>

      {error ? <ErrorBand message={error} /> : null}

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Listed"
          value={loading ? "—" : String(listed)}
          accent="primary"
          icon={ListChecks}
          sub="on base.org/stocks"
        />
        <StatCard
          label="Launchable"
          value={loading ? "—" : String(tradeable)}
          accent="up"
          icon={CheckCircle2}
          sub="open for new iStonks pairs"
        />
        <StatCard
          label="Launched"
          value={loading ? "—" : String(launched)}
          accent="violet"
          icon={Rocket}
          sub="tokens paired to a stock"
        />
      </div>

      <Panel
        title="registry"
        subtitle="ticker · company · price · status"
        bodyClassName="p-4 pt-3"
      >
        {loading ? (
          <Table head={["Ticker", "Company", "Price", "Status"]}>
            <LoadingRows rows={6} cols={4} />
          </Table>
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
          <Table head={["Ticker", "Company", "Price", "Status"]}>
            {stocks.map((stock, i) => (
              <Row key={stock.address ?? `${stock.symbol}-${i}`}>
                <Cell>
                  <span className="font-mono text-[13px] font-medium">{stock.symbol ?? "—"}</span>
                </Cell>
                <Cell className="text-muted-foreground">{stock.name ?? "—"}</Cell>
                <Cell mono>
                  {formatUsd(stock.priceUsd)}
                  {stock.paused ? (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-amber">
                      feed paused
                    </span>
                  ) : !stock.inMarketHours && stock.priceUsd != null ? (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
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
        )}
      </Panel>

      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        launchable = you can pair a new iStonks launch against it · listed = on Coinbase&apos;s
        official Base product list · registered = in the catalog, not launchable yet
      </p>
    </div>
  );
}
