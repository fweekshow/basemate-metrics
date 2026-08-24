import type { Metadata } from "next";

import { DataRoomContent } from "@/components/data-room/data-room-content";
import { getDataRoomInvestorView } from "@/lib/data-room-content";

export const metadata: Metadata = {
  title: "Data Room · Stablemate Pre-Seed",
  description:
    "Stablemate investor data room — pre-seed deck, one-pager, network, business model and the ask.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DataRoomPage() {
  const investorView = await getDataRoomInvestorView();

  return <DataRoomContent investorView={investorView} />;
}
