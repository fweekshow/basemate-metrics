import type { Metadata } from "next";

import { IstonksShell } from "@/components/istonks/shell";
import { SignInGate } from "@/components/istonks/ui";
import { getAppSession } from "@/lib/app-session";
import { appUiPreviewServerEnabled } from "@/lib/app-ui-preview";
import { FeesClient } from "./fees-client";

export const metadata: Metadata = {
  title: "iStonks — launcher fees",
  description: "Claim the 75% launcher share of trading fees from pools you launched.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IstonksFeesPage() {
  const session = await getAppSession();
  const signedIn = Boolean(session) || appUiPreviewServerEnabled();

  return (
    <IstonksShell signedIn={signedIn}>
      {signedIn ? <FeesClient /> : <SignInGate what="Claiming launcher fees" />}
    </IstonksShell>
  );
}
