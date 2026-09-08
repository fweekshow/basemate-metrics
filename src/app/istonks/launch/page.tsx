import type { Metadata } from "next";

import { IstonksShell } from "@/components/istonks/shell";
import { SignInGate } from "@/components/istonks/ui";
import { getAppSession } from "@/lib/app-session";
import { appUiPreviewServerEnabled } from "@/lib/app-ui-preview";
import { LaunchClient } from "./launch-client";

export const metadata: Metadata = {
  title: "iStonks — launch",
  description:
    "Launch a memecoin paired against a Coinbase tokenized stock on Base. Pick both-token or stock-only fee payouts.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IstonksLaunchPage() {
  const session = await getAppSession();
  const signedIn = Boolean(session) || appUiPreviewServerEnabled();

  return (
    <IstonksShell signedIn={signedIn}>
      {signedIn ? <LaunchClient /> : <SignInGate what="Launching an iStonks token" />}
    </IstonksShell>
  );
}
