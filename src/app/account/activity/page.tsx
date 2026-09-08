import type { Metadata } from "next";

import { AccountPage } from "../account-page";

export const metadata: Metadata = { title: "Activity" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <AccountPage tab="activity" />;
}
