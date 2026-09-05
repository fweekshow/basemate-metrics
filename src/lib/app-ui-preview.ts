import type { AppSession } from "@/lib/app-session";

/** Dev-only dashboard preview — no agent, DB, or CDP. Never enable in production. */
export const UI_PREVIEW_TOKEN = "ui-preview";
export const UI_PREVIEW_USER = "__ui_preview__";
export const UI_PREVIEW_ADDRESS = "0x0000000000000000000000000000000000000001";

export function appUiPreviewServerEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.APP_UI_PREVIEW === "1";
}

export function isUiPreviewSession(session: AppSession | null): boolean {
  return session?.token === UI_PREVIEW_TOKEN && session.user === UI_PREVIEW_USER;
}

export function uiPreviewSession(): AppSession {
  return { user: UI_PREVIEW_USER, token: UI_PREVIEW_TOKEN, address: UI_PREVIEW_ADDRESS };
}

const MOCK_CONFIRM = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

export function mockAppApiResponse(
  segments: string[],
  method: "GET" | "POST",
  body: Record<string, unknown>,
  searchParams: URLSearchParams,
): { status: number; data: unknown } | null {
  if (!appUiPreviewServerEnabled()) return null;

  const path = segments.join("/");

  if (path === "profile" && method === "GET") {
    return {
      status: 200,
      data: {
        displayName: "Alex (preview)",
        basename: null,
        embeddedAddress: UI_PREVIEW_ADDRESS,
        delegation: { active: true, expiresAt: new Date(Date.now() + 86400000 * 30).toISOString() },
      },
    };
  }

  if (path === "portfolio" && method === "GET") {
    return {
      status: 200,
      data: {
        totals: { totalUsd: 124.5, coinsUsd: 100, stakingUsd: 24.5 },
        coins: [
          {
            id: "usdc",
            symbol: "USDC",
            name: "USD Coin",
            amount: "100.00",
            valueUsd: 100,
            imageUrl: null,
            tokenAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
          },
          {
            id: "eth",
            symbol: "ETH",
            name: "Ethereum",
            amount: "0.008",
            valueUsd: 24.5,
            imageUrl: null,
            tokenAddress: null,
          },
        ],
        staking: [
          {
            id: "mw-usdc",
            protocol: "moonwell",
            asset: "USDC",
            valueUsd: 24.5,
            apy: 4.2,
          },
        ],
        user: { wallets: [UI_PREVIEW_ADDRESS] },
      },
    };
  }

  if (path === "activity" && method === "GET") {
    const now = Date.now();
    return {
      status: 200,
      data: {
        items: [
          {
            id: "prev-1",
            kind: "send",
            activityType: "send",
            label: "Sent to Mum",
            amount: "50",
            asset: "USDC",
            memo: "Groceries",
            status: "confirmed",
            explorerUrl: "https://basescan.org/tx/0xpreview1",
            recipientPhone: "+15551234567",
            recipientName: "Mum",
            claimState: "unclaimed",
            claimDetail: "Claim link sent by text — waiting for Mum to claim.",
            claimExpiresAt: new Date(now + 86400000 * 2).toISOString(),
            createdAt: new Date(now - 3600000).toISOString(),
          },
          {
            id: "prev-2",
            kind: "send",
            activityType: "send",
            label: "Sent to Jamie",
            amount: "25",
            asset: "USDC",
            memo: null,
            status: "confirmed",
            explorerUrl: "https://basescan.org/tx/0xpreview2",
            recipientPhone: "+15559876543",
            recipientName: "Jamie",
            claimState: "claimed",
            claimDetail: "Jamie claimed the transfer.",
            claimExpiresAt: null,
            createdAt: new Date(now - 86400000).toISOString(),
          },
          {
            id: "prev-3",
            kind: "activity",
            activityType: "swap",
            label: "Swapped USDC → ETH",
            amount: "10",
            asset: "USDC",
            memo: null,
            status: "confirmed",
            explorerUrl: "https://basescan.org/tx/0xpreview3",
            recipientPhone: null,
            recipientName: null,
            claimState: null,
            claimDetail: null,
            claimExpiresAt: null,
            createdAt: new Date(now - 86400000 * 2).toISOString(),
          },
          {
            id: "prev-4",
            kind: "activity",
            activityType: "yield",
            label: "Deposited to Moonwell USDC",
            amount: "24.5",
            asset: "USDC",
            memo: null,
            status: "confirmed",
            explorerUrl: "https://basescan.org/tx/0xpreview4",
            recipientPhone: null,
            recipientName: null,
            claimState: null,
            claimDetail: null,
            claimExpiresAt: null,
            createdAt: new Date(now - 86400000 * 4).toISOString(),
          },
          {
            id: "prev-5",
            kind: "activity",
            activityType: "fund",
            label: "Added funds",
            amount: "100",
            asset: "USDC",
            memo: null,
            status: "confirmed",
            explorerUrl: null,
            recipientPhone: null,
            recipientName: null,
            claimState: null,
            claimDetail: null,
            claimExpiresAt: null,
            createdAt: new Date(now - 86400000 * 5).toISOString(),
          },
        ],
      },
    };
  }

  if (path === "contacts" && method === "GET") {
    return {
      status: 200,
      data: {
        items: [
          { id: "1", name: "Mum", phone: "+15551234567" },
          { id: "2", name: "Jamie", phone: "+15559876543" },
        ],
      },
    };
  }

  if (path === "contacts" && method === "POST") {
    return { status: 200, data: { ok: true } };
  }

  if (path === "contacts/import" && method === "POST") {
    return { status: 200, data: { ok: true, imported: 0 } };
  }

  if (path === "preferences" && method === "GET") {
    return { status: 200, data: { payMode: "manual", autoSendLimitUsd: 25, swearJarOptIn: false } };
  }

  if (path === "preferences" && method === "POST") {
    return { status: 200, data: { ok: true } };
  }

  if (path === "yield/rates" && method === "GET") {
    return {
      status: 200,
      data: {
        items: [
          {
            group: "moonwell",
            symbol: "USDC",
            name: "USD Coin",
            peg: "USD",
            issuer: "Moonwell",
            protocol: "moonwell",
            asset: "USDC",
            apy: 4.21,
            address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
            depositable: true,
          },
          {
            group: "moonwell",
            symbol: "ETH",
            name: "Moonwell WETH",
            peg: "crypto",
            issuer: "Moonwell",
            protocol: "moonwell",
            asset: "WETH",
            apy: 2.15,
            address: "0x4200000000000000000000000000000000000006",
            depositable: true,
          },
          {
            group: "moonwell",
            symbol: "BTC",
            name: "Moonwell cbBTC",
            peg: "crypto",
            issuer: "Moonwell",
            protocol: "moonwell",
            asset: "cbBTC",
            apy: 0.42,
            address: "0xcbB7C0000aB88B473b1f5aFd9bed1564409f0bA",
            depositable: true,
          },
          {
            group: "corridor",
            symbol: "EURC",
            name: "Euro Coin",
            peg: "EUR",
            issuer: "Circle",
            protocol: null,
            asset: "EURC",
            apy: null,
            address: "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42",
            depositable: false,
          },
          {
            group: "corridor",
            symbol: "MXNB",
            name: "Mexican Peso",
            peg: "MXN",
            issuer: "Bitso",
            protocol: null,
            asset: "MXNB",
            apy: null,
            address: "0xf197ffc28c23e0309b5559e7a166f2c6164c80aa",
            depositable: false,
          },
        ],
      },
    };
  }

  if (path === "yield/deposit" && method === "POST") {
    return {
      status: 200,
      data: { ok: true, txHash: "0xpreviewyielddeposit0000000000000000000000000000000000000000" },
    };
  }

  if (path === "send/resolve" && method === "GET") {
    const phone = searchParams.get("phone") ?? "";
    const claim = phone.includes("5551234567");
    return {
      status: 200,
      data: {
        delivery: claim ? "claim" : "instant",
        displayName: claim ? "Mum" : null,
        phone,
      },
    };
  }

  if (path === "send" && method === "POST") {
    const amount = Number(body.amount);
    if (amount > 100) {
      return {
        status: 400,
        data: { error: "Not enough USDC.", depositAmount: String(amount - 100) },
      };
    }
    return {
      status: 200,
      data: {
        confirmToken: MOCK_CONFIRM,
        delivery: "claim",
        recipientPhone: body.phone,
      },
    };
  }

  if (path === "record-funding" && method === "POST") {
    return { status: 200, data: { ok: true } };
  }

  return { status: 404, data: { error: `Preview mock not defined for ${method} /api/app/${path}` } };
}

export function mockPayConfirmResponse(token: string): { status: number; data: unknown } | null {
  if (!appUiPreviewServerEnabled()) return null;
  if (!/^[a-f0-9]{32}$/i.test(token)) {
    return { status: 400, data: { error: "Missing or invalid confirmation token." } };
  }
  return { status: 200, data: { ok: true, txHash: "0xpreviewsend000000000000000000000000000000000000000000000" } };
}
