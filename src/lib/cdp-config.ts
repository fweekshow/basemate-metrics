/**
 * Shared Coinbase CDP embedded-wallet config.
 *
 * Every surface that can sign a user in has to hand `CDPReactProvider` the same
 * project and login mode, otherwise a session created on one page won't be
 * recognised on another.
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
