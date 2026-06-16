export interface ButtonAction {
  action: string;
  count: number;
}

export interface ActivityWindow {
  messages: number;
  memberJoins: number;
  memberLeaves: number;
  uniqueActiveUsers: number;
}

export interface ProtocolFlowMetric {
  users: number;
  clicks: number;
  clicks24h: number;
  confirmedVolumeUsdc: string;
  volume24hUsdc: string;
  confirmedTxCount: number;
}

export interface BankrFlowMetric {
  totalLaunches: number;
  launches24h: number;
  failedLaunches: number;
  tradingVolume24hUsdc: number;
  tradingVolumeLifetimeUsdc?: number;
}

export interface AnalyticsPayload {
  generatedAt: string;
  instanceId: string;
  groups: {
    agentInGroup: number;
    totalKnown: number;
    suggestable: number;
    boostedActive: number;
    totalMembersInAgentGroups: number;
    messagesObservedInAgentGroups: number;
  };
  users: {
    total: number;
    withWallet: number;
    messagesReceived: number;
    remindersCreated: number;
    proactiveDmsSent: number;
    proactiveDmsLast24h: number;
  };
  recommendations: {
    pending: number;
    sent: number;
    failed: number;
    sentLast24h: number;
  };
  activity: {
    last24h: ActivityWindow;
    last7d: ActivityWindow;
  };
  keywords: {
    active: number;
    totalImpressions: number;
    impressionsLast24h: number;
    totalSpentUsdc: string;
  };
  tokenLaunches: {
    allTime: {
      success: number;
      failed: number;
    };
    last24h: {
      success: number;
      failed: number;
    };
  };
  copyTradeSubscriptions: number;
  boost: {
    paymentCount: number;
    totalRevenueUsdc: string;
  };
  engagement: {
    buttonClicksLifetime: number;
    buttonClicksLast24h: number;
    topButtonActions: ButtonAction[];
  };
  legacyGroups?: {
    activeGroups: number;
    totalMessages: number;
    totalMentionedMessages: number;
  };
  protocolFlow?: {
    moonwell: ProtocolFlowMetric;
    morpho: ProtocolFlowMetric;
    aave: ProtocolFlowMetric;
    avantis: ProtocolFlowMetric & {
      copyVolumeUsdc: string;
      copyVolume24hUsdc: string;
    };
    bankr: BankrFlowMetric;
  };
}

/** A single poll snapshot kept client-side to draw live trend sparklines. */
export interface MetricSample {
  t: number;
  messages24h: number;
  activeUsers24h: number;
  buttonClicks24h: number;
  totalUsers: number;
}
