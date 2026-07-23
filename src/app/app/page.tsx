import type { Metadata } from "next";

import { AppClient } from "./app-client";

export const metadata: Metadata = {
  title: "Basemate",
  description:
    "Manage your Basemate account — balances, activity, earn, sends, and settings. Sign in after you've set up in iMessage.",
};

export const dynamic = "force-dynamic";

export default function AppPage() {
  return <AppClient />;
}
