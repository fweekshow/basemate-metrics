import { AppClient, type AccountTab } from "@/app/app/app-client";
import { ProductFrame } from "@/components/shell/product-frame";
import { getAppSession } from "@/lib/app-session";
import { appUiPreviewServerEnabled } from "@/lib/app-ui-preview";

export async function AccountPage({ tab }: { tab: AccountTab }) {
  const [session, isPreview] = await Promise.all([
    getAppSession(),
    Promise.resolve(appUiPreviewServerEnabled()),
  ]);
  const initialHasSession = Boolean(session) || isPreview;

  return (
    <ProductFrame>
      <AppClient initialHasSession={initialHasSession} embedded tab={tab} />
    </ProductFrame>
  );
}
