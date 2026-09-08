import type { Metadata } from "next";

import { ProductFrame } from "@/components/shell/product-frame";
import { AppHashRedirect } from "./redirect-client";

export const metadata: Metadata = {
  title: "Account",
  description: "Opening your Basemate account.",
  robots: { index: false, follow: true },
};

export default function AppPage() {
  return (
    <ProductFrame>
      <AppHashRedirect />
    </ProductFrame>
  );
}
