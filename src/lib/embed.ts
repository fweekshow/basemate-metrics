import type { Metadata } from "next";

import { SITE } from "@/lib/site";

/** Primary embed image for site / frame previews (1200×630). */
export const BASEMATE_OG_IMAGE = `${SITE.baseUrl}/basemate-og.png`;

/** Branded image shown on confirmed trade links in chat. */
export const BASEMATE_TXN_OG_IMAGE = `${SITE.baseUrl}/txnmate.jpeg`;

/** Splash while the frame / mini app loads (square-friendly logo). */
export const BASEMATE_SPLASH_IMAGE = BASEMATE_OG_IMAGE;

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
  /** og:image dimensions — txn card is 1536×1024; default OG is 1200×630. */
  imageWidth?: number;
  imageHeight?: number;
}): Metadata {
  const image = opts.imageUrl ?? BASEMATE_OG_IMAGE;
  const buttonTitle = opts.buttonTitle ?? "Open Basemate";
  const imageWidth = opts.imageWidth ?? 1200;
  const imageHeight = opts.imageHeight ?? 630;
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
    frame: {
      version: "1",
      name: SITE.name,
      iconUrl: BASEMATE_OG_IMAGE,
      homeUrl: SITE.baseUrl,
      imageUrl: BASEMATE_OG_IMAGE,
      buttonTitle: "Open Basemate",
      splashImageUrl: BASEMATE_SPLASH_IMAGE,
      splashBackgroundColor: SPLASH_BG,
      primaryCategory: "finance",
      tags: ["base", "trading", "agent", "perps"],
      ogTitle: SITE.name,
      ogDescription: SITE.description,
      ogImageUrl: BASEMATE_OG_IMAGE,
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
