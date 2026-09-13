/**
 * Shared Coinbase CDP embedded-wallet config.
 *
 * Every surface that can sign a user in has to hand `CDPReactProvider` the same
 * project and login mode, otherwise a session created on one page won't be
 * recognised on another.
 *
 * Basemate and iStonk are separate CDP projects. The same email resolves to a
 * different end user — and therefore a different smart account — in each, so
 * an iStonks page must never sign in on the Basemate project or the address it
 * links (and later funds) is the Basemate wallet.
 */

export const CDP_PROJECT_ID =
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "213ae300-ae45-48ba-b2c0-823126466b83";

export const cdpConfig = {
  projectId: CDP_PROJECT_ID,
  appName: "Stablemate",
  appLogoUrl:
    "https://res.cloudinary.com/dg5qvbxjp/image/upload/v1770196704/IMG_9007_iv7vkm.png",
  ethereum: { createOnLogin: "smart" as const },
};

/** iStonk project — must match istonk-web's NEXT_PUBLIC_CDP_PROJECT_ID and the istonk API's CDP keys. */
export const ISTONK_CDP_PROJECT_ID =
  process.env.NEXT_PUBLIC_ISTONK_CDP_PROJECT_ID ?? "eaa74d0f-2a2d-470b-8a13-51aba1bf5e7b";

export const istonkCdpConfig = {
  projectId: ISTONK_CDP_PROJECT_ID,
  appName: "iStonk",
  ethereum: { createOnLogin: "smart" as const },
};

export type Product = "basemate" | "istonk";

export function cdpConfigFor(product: Product) {
  return product === "istonk" ? istonkCdpConfig : cdpConfig;
}
