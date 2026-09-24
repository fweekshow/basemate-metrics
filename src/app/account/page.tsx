import type { Metadata } from "next";

import { AccountPage } from "./account-page";

export const metadata: Metadata = {
  title: "Home",
  description: "Your cash and stocks. Send stables or stocks.",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <AccountPage tab="home" />;
}
