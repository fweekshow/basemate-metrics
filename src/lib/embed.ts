import type { Metadata } from "next";

import { SITE } from "@/lib/site";

/** Primary embed / manifest share image (1200×800 PNG, 3:2). */
export const BASEMATE_OG_IMAGE = `${SITE.baseUrl}/images/mini-share.png`;

/** Branded image shown on confirmed trade links in chat. */
export const BASEMATE_TXN_OG_IMAGE = `${SITE.baseUrl}/images/mini-share.png`;

/** Splash while the frame / mini app loads (200×200). */
export const BASEMATE_SPLASH_IMAGE = `${SITE.baseUrl}/images/splash.png`;

/** Mini app icon (1024×1024 PNG). */
export const BASEMATE_ICON_IMAGE = `${SITE.baseUrl}/images/icon.png`;

const SPLASH_BG = "#0A0A0A";

type FcEmbedOpts = {
  pageUrl: string;
  imageUrl: string;
  buttonTitle: string;
  splashImageUrl?: string;
};

/** Matches Avantis: fc:miniapp with launch_miniapp + required action.url. */
function fcMiniappContent(opts: FcEmbedOpts): string {
  const splash = opts.splashImageUrl ?? BASEMATE_SPLASH_IMAGE;
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
function fcFrameContent(opts: FcEmbedOpts): string {
  const splash = opts.splashImageUrl ?? BASEMATE_SPLASH_IMAGE;
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
  imageUrl?: string;
  buttonTitle?: string;
  splashImageUrl?: string;
  /** og:image dimensions — default share card is 1200×800 (3:2). */
  imageWidth?: number;
  imageHeight?: number;
}): Metadata {
  const image = opts.imageUrl ?? BASEMATE_OG_IMAGE;
  const buttonTitle = opts.buttonTitle ?? "Open Basemate";
  const imageWidth = opts.imageWidth ?? 1200;
  const imageHeight = opts.imageHeight ?? 800;
  const fcOpts: FcEmbedOpts = {
    pageUrl: opts.url,
    imageUrl: image,
    buttonTitle,
    splashImageUrl: opts.splashImageUrl,
  };

  return {
    title: opts.title,
    description: opts.description,
    metadataBase: new URL(SITE.baseUrl),
    alternates: { canonical: opts.url },
    other: {
      "fc:miniapp": fcMiniappContent(fcOpts),
      "fc:frame": fcFrameContent(fcOpts),
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

export function basemateFarcasterManifest() {
  return {
    miniapp: {
      version: "1",
      name: SITE.name,
      iconUrl: BASEMATE_ICON_IMAGE,
      homeUrl: SITE.baseUrl,
      imageUrl: BASEMATE_OG_IMAGE,
      buttonTitle: "Open Basemate",
      splashImageUrl: BASEMATE_SPLASH_IMAGE,
      splashBackgroundColor: SPLASH_BG,
      primaryCategory: "finance",
      tags: ["base", "trading", "agent", "perps"],
      subtitle: SITE.tagline,
      description: SITE.description,
      tagline: SITE.tagline,
      ogTitle: SITE.name,
      ogDescription: SITE.description,
      ogImageUrl: BASEMATE_OG_IMAGE,
      heroImageUrl: BASEMATE_OG_IMAGE,
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

export function basemateTxnUrl(hash: string): string {
  return `${SITE.baseUrl}/txn/${hash}`;
}
