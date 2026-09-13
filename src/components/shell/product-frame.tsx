import { ProductShell } from "@/components/shell/product-shell";
import { SessionProvider } from "@/components/shell/session-provider";
import { getAppSession } from "@/lib/app-session";
import { appUiPreviewServerEnabled } from "@/lib/app-ui-preview";
import type { Product } from "@/lib/cdp-config";
import { getIstonkSession } from "@/lib/istonk-session";

export async function ProductFrame({
  children,
  regs = false,
  product = "basemate",
}: {
  children: React.ReactNode;
  regs?: boolean;
  product?: Product;
}) {
  // iStonks pages carry their own session: a Basemate sign-in resolves the
  // same email to a different (Basemate-project) wallet.
  const session = product === "istonk" ? await getIstonkSession() : await getAppSession();
  const signedIn = Boolean(session) || appUiPreviewServerEnabled();

  return (
    <SessionProvider product={product} initialSignedIn={signedIn} address={session?.address ?? null}>
      <ProductShell regs={regs}>{children}</ProductShell>
    </SessionProvider>
  );
}
