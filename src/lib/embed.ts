import type { Metadata } from "next";

import { SITE } from "@/lib/site";

function assetUrl(origin: string, path: string): string {
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Primary embed / manifest share image (1200×800 PNG, 3:2). */
export function basemateOgImage(origin: string = SITE.appUrl): string {
  return assetUrl(origin, "/images/mini-share.png");
}

/** Branded image shown on confirmed trade links in chat. */
export function basemateTxnOgImage(origin: string = SITE.appUrl): string {
  return basemateOgImage(origin);
}

/** Splash while the frame / mini app loads (200×200). */
export function basemateSplashImage(origin: string = SITE.appUrl): string {
  return assetUrl(origin, "/images/splash.png");
}

/** Mini app icon (1024×1024 PNG). */
export function basemateIconImage(origin: string = SITE.baseUrl): string {
  return assetUrl(origin, "/icon.png");
}

/** @deprecated use basemateOgImage() */
export const BASEMATE_OG_IMAGE = basemateOgImage(SITE.baseUrl);
/** @deprecated use basemateTxnOgImage() */
export const BASEMATE_TXN_OG_IMAGE = basemateTxnOgImage(SITE.baseUrl);
/** @deprecated use basemateSplashImage() */
export const BASEMATE_SPLASH_IMAGE = basemateSplashImage(SITE.baseUrl);
/** @deprecated use basemateIconImage() */
export const BASEMATE_ICON_IMAGE = basemateIconImage(SITE.baseUrl);

const SPLASH_BG = "#0A0A0A";
/** Manifest / hosted mini app splash background (Basemate blue). */
const MANIFEST_SPLASH_BG = "#0505FF";

/** Signed for basemate.app (root). */
const ROOT_ACCOUNT_ASSOCIATION = {
  header:
    "eyJmaWQiOjQ5ODU0NCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDBGNTJDQjQzOTJEMkZFYjJhMEMxMjkwYTNlN0UyMUJjMjI0NTNBNzIifQ",
  payload: "eyJkb21haW4iOiJiYXNlbWF0ZS5hcHAifQ",
  signature:
    "FnoJkDXtebgEGTajV1i61vtQyMJMUl7Iia2tKkj+XjZuzfA5R2HVERjd6bpZkWdX80tXrU0A6ip4H4JuC3N6VRs=",
} as const;

/** Signed for app.basemate.app (Base App canonical / ex-auction-miniapp domain). */
const APP_ACCOUNT_ASSOCIATION = {
  header:
    "eyJmaWQiOjQ5ODU0NCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDBGNTJDQjQzOTJEMkZFYjJhMEMxMjkwYTNlN0UyMUJjMjI0NTNBNzIifQ",
  payload: "eyJkb21haW4iOiJhcHAuYmFzZW1hdGUuYXBwIn0",
  signature:
    "y55IkgVCA832ark4Rr53DIMNzdSY6cJPUAD1wT/BUU9Ij3klBVh0W5KrG9syqsjIZizWodCcRZPSelnBHlMD8xs=",
} as const;

type FcEmbedOpts = {
  pageUrl: string;
  imageUrl: string;
  buttonTitle: string;
  splashImageUrl?: string;
};

/** Matches Avantis: fc:miniapp with launch_miniapp + required action.url. */
function fcMiniappContent(opts: FcEmbedOpts, splashFallback: string): string {
  const splash = opts.splashImageUrl ?? splashFallback;
  return JSON.stringify({
    version: "1",
    imageUrl: opts.imageUrl,
    button: {
      title: opts.buttonTitle,
      action: {
        type: "launch_miniapp",
        name: SITE.name,
        url: opts.pageUrl,
        splashImageUrl: splash,
        splashBackgroundColor: SPLASH_BG,
      },
    },
  });
}

/** Matches Avantis: fc:frame with launch_frame + required action.url. */
function fcFrameContent(opts: FcEmbedOpts, splashFallback: string): string {
  const splash = opts.splashImageUrl ?? splashFallback;
  return JSON.stringify({
    version: "1",
    imageUrl: opts.imageUrl,
    button: {
      title: opts.buttonTitle,
      action: {
        type: "launch_frame",
        name: SITE.name,
        url: opts.pageUrl,
        splashImageUrl: splash,
        splashBackgroundColor: SPLASH_BG,
      },
    },
  });
}

export function basemateEmbedMetadata(opts: {
  title: string;
  description: string;
  url: string;
  origin?: string;
  imageUrl?: string;
  buttonTitle?: string;
  splashImageUrl?: string;
  /** og:image dimensions — default share card is 1200×800 (3:2). */
  imageWidth?: number;
  imageHeight?: number;
}): Metadata {
  const origin = opts.origin ?? opts.url.replace(/\/$/, "");
  const image = opts.imageUrl ?? basemateOgImage(origin);
  const splashFallback = basemateSplashImage(origin);
  const buttonTitle = opts.buttonTitle ?? "Open Basemate";
  const imageWidth = opts.imageWidth ?? 1200;
  const imageHeight = opts.imageHeight ?? 800;
  const fcOpts: FcEmbedOpts = {
    pageUrl: opts.url,
    imageUrl: image,
    buttonTitle,
    splashImageUrl: opts.splashImageUrl ?? splashFallback,
  };

  return {
    title: opts.title,
    description: opts.description,
    metadataBase: new URL(origin),
    alternates: { canonical: opts.url },
    other: {
      "fc:miniapp": fcMiniappContent(fcOpts, splashFallback),
      "fc:frame": fcFrameContent(fcOpts, splashFallback),
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      type: "website",
      url: opts.url,
      siteName: SITE.name,
      images: [
        {
          url: image,
          width: imageWidth,
          height: imageHeight,
          alt: opts.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: {
        url: image,
        width: imageWidth,
        height: imageHeight,
        alt: opts.title,
      },
    },
  };
}

export function basemateFarcasterManifest(origin: string = SITE.appUrl) {
  const isAppHost = origin === SITE.appUrl;
  const accountAssociation = isAppHost ? APP_ACCOUNT_ASSOCIATION : ROOT_ACCOUNT_ASSOCIATION;

  return {
    accountAssociation,
    miniapp: {
      version: "1",
      name: SITE.name,
      iconUrl: basemateIconImage(origin),
      homeUrl: origin,
      imageUrl: assetUrl(origin, "/image.png"),
      buttonTitle: "Open Basemate",
      splashImageUrl: assetUrl(origin, "/splash.png"),
      splashBackgroundColor: MANIFEST_SPLASH_BG,
      primaryCategory: "finance",
      tags: ["base", "trading", "agent", "perps"],
      subtitle: "Trade, Earn and Learn",
      description: "Basemate",
      tagline: SITE.manifestTagline,
      ogTitle: SITE.name,
      ogDescription: SITE.manifestOgDescription,
      ogImageUrl: assetUrl(origin, "/image.png"),
      heroImageUrl: assetUrl(origin, "/image.png"),
    },
  };
}

const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

export function isValidTxHash(hash: string): boolean {
  return TX_HASH_RE.test(hash);
}

export function basescanTxUrl(hash: string): string {
  return `https://basescan.org/tx/${hash}`;
}

export function basemateTxnUrl(hash: string, origin: string = SITE.appUrl): string {
  return `${origin}/txn/${hash}`;
}

/**
 * A "prolink" is the compressed, URL-safe payload produced by
 * `@base-org/account/prolink`. The `/sign` page decodes it client-side and
 * replays the `wallet_sendCalls` request through the Base Account SDK, so this
 * is a conservative charset + length guard to reject obviously bad input before
 * we hand it to the decoder.
 */
const PROLINK_RE = /^[A-Za-z0-9._~%+/=-]+$/;

export function isValidProlink(prolink: string): boolean {
  return prolink.length > 0 && prolink.length <= 12000 && PROLINK_RE.test(prolink);
}

/** Basemate page that decodes a prolink and signs it with the user's Base Account. */
export function basemateSignUrl(prolink: string, origin: string = SITE.baseUrl): string {
  const link = new URL("/sign", origin);
  link.searchParams.set("p", prolink);
  return link.toString();
}
