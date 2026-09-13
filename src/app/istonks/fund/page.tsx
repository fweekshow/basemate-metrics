import type { Metadata } from "next";

import { IstonksShell } from "@/components/istonks/shell";
import { SignInGate } from "@/components/istonks/ui";
import { getIstonkSession } from "@/lib/istonk-session";
import { appUiPreviewServerEnabled } from "@/lib/app-ui-preview";
import { FundClient } from "./fund-client";

export const metadata: Metadata = {
  title: "iStonks — fund your wallet",
  description:
    "Top up the Base wallet you launch from. Launches are self-funded — you need ETH for gas.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IstonksFundPage() {
  const session = await getIstonkSession();
  const signedIn = Boolean(session) || appUiPreviewServerEnabled();

  return (
    <IstonksShell signedIn={signedIn}>
      {signedIn ? <FundClient /> : <SignInGate what="Funding your launch wallet" />}
    </IstonksShell>
  );
}
