import type { Metadata } from "next";

import { AccountPage } from "@/app/account/account-page";
import { ProductHome } from "@/components/site/product-home";
import { ProductFrame } from "@/components/shell/product-frame";
import { getAppSession } from "@/lib/app-session";
import { appUiPreviewServerEnabled } from "@/lib/app-ui-preview";

export const metadata: Metadata = {
  title: "Basemate",
  description: "Send stables and stocks. See your cash and what you hold.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [session, isPreview] = await Promise.all([
    getAppSession(),
    Promise.resolve(appUiPreviewServerEnabled()),
  ]);
  if (session || isPreview) {
    return <AccountPage tab="home" />;
  }
  return (
    <ProductFrame>
      <ProductHome />
    </ProductFrame>
  );
}
