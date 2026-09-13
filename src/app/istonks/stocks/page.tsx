import type { Metadata } from "next";

import { IstonksShell } from "@/components/istonks/shell";
import { getIstonkSession } from "@/lib/istonk-session";
import { appUiPreviewServerEnabled } from "@/lib/app-ui-preview";
import { ExplainerBands } from "./explainer-bands";
import { StocksClient } from "./stocks-client";

export const metadata: Metadata = {
  title: "iStonks — quote registry",
  description:
    "Every Coinbase tokenized stock available as an iStonks numeraire, with listing and launchable status.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IstonksStocksPage() {
  const session = await getIstonkSession();
  const signedIn = Boolean(session) || appUiPreviewServerEnabled();

  return (
    <IstonksShell signedIn={signedIn}>
      <div className="space-y-10">
        <StocksClient />
        <ExplainerBands />
      </div>
    </IstonksShell>
  );
}
