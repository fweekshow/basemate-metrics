import type { Metadata } from "next";

import { getAppSession } from "@/lib/app-session";
import { appUiPreviewServerEnabled } from "@/lib/app-ui-preview";
import { AppClient } from "./app-client";

export const metadata: Metadata = {
  title: "Basemate",
  description:
    "Manage your Basemate account — balances, activity, earn, sends, and settings. Sign in after you've set up in iMessage.",
};

export const dynamic = "force-dynamic";

export default async function AppPage() {
  // Read the session cookie server-side so AppClient can skip the async
  // profile-check fetch and render the correct phase immediately.
  const [session, isPreview] = await Promise.all([
    getAppSession(),
    Promise.resolve(appUiPreviewServerEnabled()),
  ]);
  const initialHasSession = Boolean(session) || isPreview;

  return (
    <div className="min-h-[100dvh] bg-[#EAE8F5] bg-gradient-to-b from-[#EAE8F5] to-[#E0DFF0]">
      <AppClient initialHasSession={initialHasSession} />
    </div>
  );
}
