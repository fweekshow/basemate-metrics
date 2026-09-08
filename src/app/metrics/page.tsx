import type { Metadata } from "next";

import { Dashboard } from "@/components/dashboard/dashboard";
import { ProductFrame } from "@/components/shell/product-frame";

export const metadata: Metadata = {
  title: "basemate · metrics",
  description:
    "Live telemetry for the basemate on-chain agent (@basemateagent)",
};

export default function MetricsPage() {
  return (
    <ProductFrame>
      <Dashboard />
    </ProductFrame>
  );
}
