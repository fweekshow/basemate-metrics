export type PortfolioProtocol = "morpho" | "moonwell" | "aave";

export interface PortfolioCoin {
  id: string;
  walletAddress: string;
  symbol: string;
  name: string | null;
  imageUrl: string | null;
  tokenAddress: string | null;
  amount: string;
  priceUsd: number | null;
  valueUsd: number;
}

export interface PortfolioPerpPosition {
  id: string;
  walletAddress: string;
  kind: "open" | "limit";
  pair: string;
  side: "long" | "short" | null;
  leverage: number | null;
  collateralUsd: number | null;
  sizeUsd: number | null;
  valueUsd: number;
  pnlUsd: number | null;
  takeProfit: string | null;
  stopLoss: string | null;
  openPrice: string | null;
  limitPrice: string | null;
  pairIndex: number | null;
  tradeIndex: number | null;
}

export interface PortfolioStakingPosition {
  id: string;
  walletAddress: string;
  protocol: PortfolioProtocol;
  asset: string;
  name: string;
  amount: number | null;
  valueUsd: number | null;
  apy: number | null;
  healthFactor: number | null;
}

export interface PortfolioPayload {
  generatedAt: string;
  user: {
    id: string;
    wallets: string[];
    walletLabels: Record<string, string>;
    serverWallet: string;
  };
  totals: {
    coinsUsd: number;
    perpsUsd: number;
    stakingUsd: number;
    totalUsd: number;
  };
  coins: PortfolioCoin[];
  perpetuals: PortfolioPerpPosition[];
  staking: PortfolioStakingPosition[];
  errors: Array<{ section: "coins" | "perpetuals" | "staking"; message: string }>;
}
