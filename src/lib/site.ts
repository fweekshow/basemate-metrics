/** Canonical public origin for OG tags, sitemaps, and absolute links. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://basemate.app";

export const SITE = {
  name: "Basemate",
  tagline: "Send, Earn, Trade, Save",
  description:
    "Money that lives in your texts. Send across borders, earn yield, trade, and save — all in iMessage and Base App on Base.",
  manifestTagline: "Send, Earn, Trade, Save",
  /** Max 100 chars — Farcaster miniapp.ogDescription limit. */
  manifestOgDescription:
    "Money that lives in your texts — send, earn, trade, and save on Base.",
  /** Root domain — Farcaster manifest + accountAssociation. */
  baseUrl: "https://basemate.app",
  /** Base App canonical URL (dashboard + chat unfurls). */
  appUrl: "https://app.basemate.app",
  pfp:
    "https://res.cloudinary.com/dg5qvbxjp/image/upload/v1770196704/IMG_9007_iv7vkm.png",
  profileUrl:
    "https://base.app/profile/0xd2d01aef95e4647e0139870a2030bf69a26f15cd",
  baseAppStoreUrl:
    "https://apps.apple.com/us/app/base-built-to-trade-earn/id1278383455",
  metricsUrl: "https://basemate.app/metrics",
  twitter: "@basemateagent",
} as const;
