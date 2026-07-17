import type { Metadata } from "next";

import { AppClient } from "./app/app-client";

export const metadata: Metadata = {
  title: "Basemate",
  description: "Your Basemate account — balances, activity, earn, sends, and settings.",
};

export const dynamic = "force-dynamic";

// The dashboard is the homepage. Marketing lives at /landing; /app remains an
// alias so existing basemate.app/app#tab deep links keep resolving.
export default function HomePage() {
  return <AppClient />;
}
