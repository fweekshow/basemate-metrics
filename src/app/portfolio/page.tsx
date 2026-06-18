import type { Metadata } from "next";

import { PortfolioView } from "@/components/portfolio/portfolio-view";

export const metadata: Metadata = {
  title: "basemate · portfolio",
  description: "Your iMessage Basemate portfolio.",
  openGraph: {
    title: "View more details",
    description: "Your full Basemate portfolio — holdings, perps, and yield.",
  },
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; token?: string }>;
}) {
  const params = await searchParams;
  return <PortfolioView user={params.user ?? ""} token={params.token ?? ""} />;
}
