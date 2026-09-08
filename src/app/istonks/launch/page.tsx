import type { Metadata } from "next";

import { IstonksShell } from "@/components/istonks/shell";
import { LaunchClient } from "./launch-client";

export const metadata: Metadata = {
  title: "iStonks — launch",
  description:
    "Launch a memecoin paired against a Coinbase tokenized stock on Base. Pick both-token or stock-only fee payouts.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function IstonksLaunchPage() {
  return (
    <IstonksShell>
      <LaunchClient />
    </IstonksShell>
  );
}
