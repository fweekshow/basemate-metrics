import type { Metadata } from "next";

import { ProductHome } from "@/components/site/product-home";
import { ProductFrame } from "@/components/shell/product-frame";

export const metadata: Metadata = {
  title: "Basemate",
  description:
    "Send anything onchain from iMessage and Android chats. Discover launches, then settle on Base.",
};

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <ProductFrame>
      <ProductHome />
    </ProductFrame>
  );
}
