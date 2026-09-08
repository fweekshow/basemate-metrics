import type { Metadata } from "next";

import { IstonksShell } from "@/components/istonks/shell";
import { getAppSession } from "@/lib/app-session";
import { appUiPreviewServerEnabled } from "@/lib/app-ui-preview";
import { BoardClient } from "./board-client";

export const metadata: Metadata = {
  title: "iStonks — stock pairs",
  description:
    "Coinbase tokenized stocks available for iStonks Doppler launches, plus your launches when signed in.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IstonksBoardPage() {
  const session = await getAppSession();
  const signedIn = Boolean(session) || appUiPreviewServerEnabled();

  return (
    <IstonksShell>
      <BoardClient signedIn={signedIn} />
    </IstonksShell>
  );
}
