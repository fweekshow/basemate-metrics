/**
 * iStonks shared types + normalizers.
 *
 * Parsers are tolerant of a few envelope shapes (`items`, nested `launch`).
 * Keep this file client-safe —
 * no `next/headers`, no env reads. Server-only fetching lives in
 * `istonks-server.ts`.
 */

/** Fee split locked into the Doppler multicurve pool at launch. */
export const FEE_SPLIT = [
  { label: "Launcher", percent: 75, note: "whoever texted the launch" },
  { label: "iStonks", percent: 10, note: "treasury" },
  { label: "Basemate", percent: 10, note: "buyback" },
  { label: "Doppler", percent: 5, note: "airlock" },
] as const;

export const BASE_CHAIN_ID = 8453;
export const BASESCAN_URL = "https://basescan.org";

export type StockStatus = "launchable" | "listed" | "registered";

export interface IstonksLaunch {
  name: string | null;
  symbol: string | null;
  tokenAddress: string | null;
  pairSymbol: string | null;
  pairAddress: string | null;
  poolId: string | null;
  launcher: string | null;
  /** ISO timestamp, or null when upstream omitted it. */
  launchedAt: string | null;
  /** "both" | "stock". Null for legacy launches. */
  feeMode: string | null;
}

export interface IstonksStock {
  symbol: string | null;
  name: string | null;
  address: string | null;
  decimals: number | null;
  feedAddress: string | null;
  listed: boolean;
  /** Product switch — we will pair launches against this. */
  launchable: boolean;
  /** @deprecated Prefer launchable */
  tradeable: boolean;
  priceUsd: number | null;
  priceUpdatedAt: string | null;
  paused: boolean;
  inMarketHours: boolean;
  launchCount: number | null;
}

export interface IstonksToken extends IstonksLaunch {
  pair: IstonksStock | null;
  totalSupply: string | null;
  /** Share of supply seeded into the pool, as a percent (0–100). */
  poolSupplyPercent: number | null;
  tokenURI: string | null;
  imageUrl: string | null;
}

export interface IstonksFee {
  id: string | null;
  tokenSymbol: string | null;
  tokenAddress: string | null;
  pairSymbol: string | null;
  poolId: string | null;
  /** Human-readable amount as returned by the agent (string to avoid f64 loss). */
  amount: string | null;
  amountUsd: number | null;
  asset: string | null;
  claimable: boolean;
  feeMode: string | null;
}

/* ── primitives ─────────────────────────────────────────────────────── */

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(source: Dict, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function num(source: Dict, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function bool(source: Dict, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return false;
}

/** Accepts ISO strings, epoch seconds, and epoch milliseconds. */
function timestamp(source: Dict, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      const ms = value > 1e12 ? value : value * 1000;
      const date = new Date(ms);
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
    if (typeof value === "string" && value.trim()) {
      const date = new Date(value.trim());
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
  }
  return null;
}

/**
 * Pulls the list out of whatever envelope the agent used — a bare array, or an
 * object keyed by `launches` / `stocks` / `fees` / `items` / `data` / `results`.
 */
export function toArray(payload: unknown): Dict[] {
  const candidate = Array.isArray(payload)
    ? payload
    : isDict(payload)
      ? ["launches", "stocks", "fees", "tokens", "items", "data", "results"]
          .map((key) => payload[key])
          .find(Array.isArray)
      : undefined;
  if (!Array.isArray(candidate)) return [];
  return candidate.filter(isDict);
}

/** Reads `{ error }` / `{ detail }` out of a failed proxy response. */
export function readError(payload: unknown): string | null {
  if (!isDict(payload)) return null;
  return str(payload, "error", "message", "detail");
}

/* ── normalizers ─────────────────────────────────────────────────────── */

export function normalizeLaunch(raw: Dict): IstonksLaunch {
  return {
    name: str(raw, "name", "tokenName"),
    symbol: str(raw, "symbol", "tokenSymbol", "ticker"),
    tokenAddress: str(raw, "tokenAddress", "predictedToken", "token", "address"),
    pairSymbol: str(raw, "pairSymbol", "numeraireSymbol", "stockSymbol"),
    pairAddress: str(raw, "pairAddress", "numeraire", "numeraireAddress"),
    poolId: str(raw, "poolId", "pool"),
    launcher: str(raw, "launcher", "wallet", "walletAddress", "userAddress", "deployer"),
    launchedAt: timestamp(raw, "launchedAt", "createdAt", "deployedAt", "timestamp"),
    feeMode: str(raw, "feeMode", "fee_mode"),
  };
}

export function normalizeStock(raw: Dict): IstonksStock {
  const priceUsd = num(raw, "priceUsd", "price", "numerairePriceUsd");
  const launchable = bool(raw, "launchable", "tradeable", "hasPool");
  return {
    symbol: str(raw, "symbol", "ticker"),
    name: str(raw, "name", "company", "companyName"),
    address: str(raw, "address", "tokenAddress"),
    decimals: num(raw, "decimals"),
    feedAddress: str(raw, "feedAddress", "feed", "priceFeed"),
    listed: bool(raw, "listed"),
    launchable,
    tradeable: launchable,
    priceUsd,
    priceUpdatedAt: timestamp(raw, "priceUpdatedAt", "updatedAt"),
    paused: bool(raw, "paused"),
    inMarketHours: bool(raw, "inMarketHours", "marketOpen"),
    launchCount: num(raw, "launchCount", "launches", "pairCount"),
  };
}

export function normalizeToken(payload: unknown): IstonksToken | null {
  if (!isDict(payload)) return null;
  const raw = isDict(payload.token)
    ? payload.token
    : isDict(payload.launch)
      ? payload.launch
      : payload;
  const launch = normalizeLaunch(raw);
  if (!launch.tokenAddress && !launch.symbol) return null;
  const pairRaw = isDict(payload.pair) ? payload.pair : isDict(raw.pair) ? raw.pair : null;
  return {
    ...launch,
    pair: pairRaw ? normalizeStock(pairRaw) : null,
    totalSupply: str(raw, "totalSupply", "supply"),
    poolSupplyPercent: num(raw, "poolSupplyPercent", "poolSharePercent"),
    tokenURI: str(raw, "tokenURI", "tokenUri", "metadataUri"),
    imageUrl: str(raw, "imageUrl", "image"),
  };
}

export function normalizeFee(raw: Dict): IstonksFee {
  const amount = str(raw, "amount", "amountFormatted") ?? num(raw, "amount")?.toString() ?? null;
  const hasBalance = amount != null && Number(amount) > 0;
  return {
    id: str(raw, "id", "poolId", "tokenAddress"),
    tokenSymbol: str(raw, "tokenSymbol", "symbol"),
    tokenAddress: str(raw, "tokenAddress", "token"),
    pairSymbol: str(raw, "pairSymbol", "numeraireSymbol"),
    poolId: str(raw, "poolId", "pool"),
    amount,
    amountUsd: num(raw, "amountUsd", "usd", "valueUsd"),
    asset: str(raw, "asset", "assetSymbol", "currency"),
    claimable: "claimable" in raw || "available" in raw ? bool(raw, "claimable", "available") : hasBalance,
    feeMode: str(raw, "feeMode", "fee_mode"),
  };
}

export function feeModeLabel(mode: string | null | undefined): string {
  if (mode === "stock") return "stock only";
  if (mode === "both") return "token + stock";
  return "—";
}

/* ── derived helpers ─────────────────────────────────────────────────── */

export function stockStatus(stock: IstonksStock): StockStatus {
  if (stock.launchable || stock.tradeable) return "launchable";
  if (stock.listed) return "listed";
  return "registered";
}

export function sortLaunchesNewestFirst(launches: IstonksLaunch[]): IstonksLaunch[] {
  return [...launches].sort((a, b) => {
    const at = a.launchedAt ? Date.parse(a.launchedAt) : 0;
    const bt = b.launchedAt ? Date.parse(b.launchedAt) : 0;
    return bt - at;
  });
}

/** Launches bucketed per day over the trailing `days` window — real data, not filler. */
export function launchesPerDay(launches: IstonksLaunch[], days = 14): number[] {
  const dayMs = 86_400_000;
  const today = Math.floor(Date.now() / dayMs);
  const buckets = new Array(days).fill(0) as number[];
  for (const launch of launches) {
    if (!launch.launchedAt) continue;
    const bucket = days - 1 - (today - Math.floor(Date.parse(launch.launchedAt) / dayMs));
    if (bucket >= 0 && bucket < days) buckets[bucket] += 1;
  }
  return buckets;
}

export function shortAddress(address: string | null, lead = 6, tail = 4): string {
  if (!address) return "—";
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

export function isAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

export function formatUsd(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().slice(0, 10);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 16)} UTC`;
}
