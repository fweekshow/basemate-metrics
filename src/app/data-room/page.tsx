import type { Metadata } from "next";

import { DataRoomContent } from "@/components/data-room/data-room-content";
import { DataRoomGate } from "@/components/data-room/data-room-gate";
import { getDataRoomSession } from "@/lib/data-room-auth";
import { getTalkingTo } from "@/lib/data-room-db";

export const metadata: Metadata = {
  title: "Data Room · Mate Seed",
  description:
    "Mate investor data room — seed deck, one-pager, investor update, and raise details.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ next?: string | string[] }>;

export default async function DataRoomPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getDataRoomSession();
  const params = await searchParams;
  const nextRaw = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : undefined;

  if (!session) {
    return <DataRoomGate nextPath={nextPath} />;
  }

  const talkingTo = await getTalkingTo();

  return (
    <DataRoomContent
      visitorName={session.name}
      visitorFirm={session.firm}
      talkingTo={talkingTo}
    />
  );
}
