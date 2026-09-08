import type { Metadata } from "next";

import { AppClient } from "./app/app-client";
import { ImessageGate } from "@/components/site/imessage-gate";
import { getAppSession } from "@/lib/app-session";

export const metadata: Metadata = {
  title: "Basemate",
  description:
    "Basemate on iMessage. Send Money in your Texts. Text +1 (628) 316-5638 to start.",
};

export const dynamic = "force-dynamic";

// Anonymous visitors see the iMessage companion gate. Returning users with a
// dashboard session cookie land on the app. Explicit sign-in lives at /app.
export default async function HomePage() {
  const session = await getAppSession();
  if (session) return <AppClient />;
  return <ImessageGate />;
}
