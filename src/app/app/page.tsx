import type { Metadata } from "next";

import { AppClient } from "./app-client";

export const metadata: Metadata = {
  title: "Basemate",
  description: "Your Basemate account — balances, activity, earn, sends, and settings.",
};

export const dynamic = "force-dynamic";

export default function AppPage() {
  return <AppClient />;
}
