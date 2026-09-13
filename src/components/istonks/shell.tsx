import { ProductFrame } from "@/components/shell/product-frame";

export { RegSFooter } from "@/components/istonks/reg-s-footer";

export async function IstonksShell({
  children,
}: {
  children: React.ReactNode;
  /** @deprecated Session is read inside ProductFrame. */
  signedIn?: boolean;
}) {
  return (
    <ProductFrame regs product="istonk">
      {children}
    </ProductFrame>
  );
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  return <ProductFrame>{children}</ProductFrame>;
}
