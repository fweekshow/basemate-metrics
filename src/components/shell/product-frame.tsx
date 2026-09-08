import { ProductShell } from "@/components/shell/product-shell";
import { SessionProvider } from "@/components/shell/session-provider";
import { getAppSession } from "@/lib/app-session";
import { appUiPreviewServerEnabled } from "@/lib/app-ui-preview";

export async function ProductFrame({
  children,
  regs = false,
}: {
  children: React.ReactNode;
  regs?: boolean;
}) {
  const session = await getAppSession();
  const signedIn = Boolean(session) || appUiPreviewServerEnabled();

  return (
    <SessionProvider initialSignedIn={signedIn} address={session?.address ?? null}>
      <ProductShell regs={regs}>{children}</ProductShell>
    </SessionProvider>
  );
}
