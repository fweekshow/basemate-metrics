import type { AnalyticsPayload, TradingVolume } from "@/lib/types";

function parseUsdc(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

type AvantisFlow = NonNullable<AnalyticsPayload["protocolFlow"]>["avantis"];

/** Perps + swaps only (yield excluded from headline KPI). */
export interface ResolvedChatTrading {
  /** Headline KPI: perp notional + server notional + swaps. */
  notionalLifetime: number;
  notional24h: number;
  perpMarginLifetime: number;
  perpMargin24h: number;
  perpNotionalLifetime: number;
  perpNotional24h: number;
  serverMarginLifetime: number;
  serverMargin24h: number;
  serverNotionalLifetime: number;
  serverNotional24h: number;
  swapsLifetime: number;
  swaps24h: number;
  fromAgent: boolean;
}

function swapsFromProtocolFlow(flow: NonNullable<AnalyticsPayload["protocolFlow"]>): {
  lifetime: number;
  last24h: number;
} {
  const protocols = [flow.uniswap, flow.aerodrome].filter(
    (p): p is NonNullable<typeof p> => p != null,
  );
  return {
    lifetime: protocols.reduce((sum, p) => sum + parseUsdc(p.confirmedVolumeUsdc), 0),
    last24h: protocols.reduce((sum, p) => sum + parseUsdc(p.volume24hUsdc), 0),
  };
}

function avantisFromFlow(avantis: AvantisFlow): {
  perpMarginLifetime: number;
  perpMargin24h: number;
  perpNotionalLifetime: number;
  perpNotional24h: number;
  serverMarginLifetime: number;
  serverMargin24h: number;
  serverNotionalLifetime: number;
  serverNotional24h: number;
} {
  const perpMarginLifetime = parseUsdc(avantis.confirmedVolumeUsdc);
  const perpMargin24h = parseUsdc(avantis.volume24hUsdc);
  const perpNotionalLifetime =
    parseUsdc(avantis.confirmedNotionalUsdc) || perpMarginLifetime;
  const perpNotional24h = parseUsdc(avantis.notional24hUsdc) || perpMargin24h;
  const serverMarginLifetime = parseUsdc(avantis.copyVolumeUsdc);
  const serverMargin24h = parseUsdc(avantis.copyVolume24hUsdc);
  const serverNotionalLifetime =
    parseUsdc(avantis.copyNotionalUsdc) || serverMarginLifetime;
  const serverNotional24h =
    parseUsdc(avantis.copyNotional24hUsdc) || serverMargin24h;

  return {
    perpMarginLifetime,
    perpMargin24h,
    perpNotionalLifetime,
    perpNotional24h,
    serverMarginLifetime,
    serverMargin24h,
    serverNotionalLifetime,
    serverNotional24h,
  };
}

/**
 * Chat trading = perp notional + uni/aero swaps (+ server-wallet notional).
 * Yield deposits live in protocol panels only — not in this KPI.
 */
export function resolveChatTrading(data: AnalyticsPayload): ResolvedChatTrading {
  const flow = data.protocolFlow;
  const swapsFromFlow = flow ? swapsFromProtocolFlow(flow) : { lifetime: 0, last24h: 0 };

  const tv = data.tradingVolume;
  if (tv) {
    const perpMarginLifetime = parseUsdc(tv.perpsUsdc);
    const perpMargin24h = parseUsdc(tv.perps24hUsdc);
    const perpNotionalLifetime =
      parseUsdc(tv.perpsNotionalUsdc) || perpMarginLifetime;
    const perpNotional24h =
      parseUsdc(tv.perpsNotional24hUsdc) || perpMargin24h;
    const serverMarginLifetime = parseUsdc(tv.serverWalletUsdc);
    const serverMargin24h = parseUsdc(tv.serverWallet24hUsdc);
    const serverNotionalLifetime =
      parseUsdc(tv.serverWalletNotionalUsdc) || serverMarginLifetime;
    const serverNotional24h =
      parseUsdc(tv.serverWalletNotional24hUsdc) || serverMargin24h;
    const swapsLifetime =
      parseUsdc(tv.swapsUsdc) ||
      parseUsdc(tv.uniswapUsdc) + parseUsdc(tv.aerodromeUsdc) ||
      swapsFromFlow.lifetime;
    const swaps24h =
      parseUsdc(tv.swaps24hUsdc) ||
      parseUsdc(tv.uniswap24hUsdc) + parseUsdc(tv.aerodrome24hUsdc) ||
      swapsFromFlow.last24h;
    const notionalLifetime =
      parseUsdc(tv.lifetimeUsdc) ||
      perpNotionalLifetime + serverNotionalLifetime + swapsLifetime;
    const notional24h =
      parseUsdc(tv.last24hUsdc) ||
      perpNotional24h + serverNotional24h + swaps24h;

    return {
      notionalLifetime,
      notional24h,
      perpMarginLifetime,
      perpMargin24h,
      perpNotionalLifetime,
      perpNotional24h,
      serverMarginLifetime,
      serverMargin24h,
      serverNotionalLifetime,
      serverNotional24h,
      swapsLifetime,
      swaps24h,
      fromAgent: true,
    };
  }

  if (!flow) {
    return {
      notionalLifetime: 0,
      notional24h: 0,
      perpMarginLifetime: 0,
      perpMargin24h: 0,
      perpNotionalLifetime: 0,
      perpNotional24h: 0,
      serverMarginLifetime: 0,
      serverMargin24h: 0,
      serverNotionalLifetime: 0,
      serverNotional24h: 0,
      swapsLifetime: 0,
      swaps24h: 0,
      fromAgent: false,
    };
  }

  const av = avantisFromFlow(flow.avantis);
  const notionalLifetime =
    av.perpNotionalLifetime + av.serverNotionalLifetime + swapsFromFlow.lifetime;
  const notional24h =
    av.perpNotional24h + av.serverNotional24h + swapsFromFlow.last24h;

  return {
    notionalLifetime,
    notional24h,
    ...av,
    swapsLifetime: swapsFromFlow.lifetime,
    swaps24h: swapsFromFlow.last24h,
    fromAgent: false,
  };
}

/** @deprecated use resolveChatTrading */
export const resolveChatVolume = resolveChatTrading;

/** @deprecated use resolveChatTrading */
export const resolveTradeVolume = resolveChatTrading;

export type ResolvedChatVolume = ResolvedChatTrading;

export function formatVolumeKpi(usdc: number): string {
  if (!Number.isFinite(usdc) || usdc <= 0) return "$0";
  if (usdc >= 1_000_000) {
    return `$${(usdc / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (usdc >= 1_000) {
    return `$${(usdc / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `$${usdc.toFixed(usdc % 1 === 0 ? 0 : 2)}`;
}

export function formatChatTradingSub(_trading?: ResolvedChatTrading): string {
  return "Notional";
}

/** @deprecated use formatChatTradingSub */
export const formatChatVolumeSub = formatChatTradingSub;

/** @deprecated use formatChatTradingSub */
export const formatVolumeSub = formatChatTradingSub;

export function sumFeatureClicks(
  actions: AnalyticsPayload["engagement"]["topButtonActions"],
  slugs: string[],
): number {
  const set = new Set(slugs);
  return actions
    .filter((a) => set.has(a.action) || slugs.some((s) => a.action.startsWith(s)))
    .reduce((sum, a) => sum + a.count, 0);
}

export function chatVolumeFromPayload(tv: TradingVolume): number {
  const notional =
    parseUsdc(tv.perpsNotionalUsdc) +
    parseUsdc(tv.serverWalletNotionalUsdc) +
    parseUsdc(tv.swapsUsdc);
  if (notional > 0) return notional;
  return (
    parseUsdc(tv.perpsUsdc) +
    parseUsdc(tv.serverWalletUsdc) +
    parseUsdc(tv.swapsUsdc)
  );
}

/** @deprecated use chatVolumeFromPayload */
export const tradingVolumeFromPayload = chatVolumeFromPayload;

export type ResolvedTradeVolume = ResolvedChatTrading;
