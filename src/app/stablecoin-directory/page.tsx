import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { StablecoinDirectoryClient } from "@/components/stablecoin-directory/stablecoin-directory-client";
import fallbackData from "@/data/stablecoin-directory.fallback.json";
import type { StablecoinDirectoryRow } from "@/lib/stablecoin-directory-shared";
import { getStablecoinDirectoryView } from "@/lib/stablecoin-directory";

export const metadata: Metadata = {
  title: "Base Stablecoin World Directory — Basemate Partnerships",
  description:
    "Country-by-country stablecoin issuers on Base — synced from Notion issuer & corridor pipeline.",
  openGraph: {
    title: "Basemate Stablecoin Directory",
    url: "https://basemate.app/stablecoin-directory",
  },
};

export const dynamic = "force-dynamic";

const flagBySlug = new Map(
  (fallbackData.rows as StablecoinDirectoryRow[]).map((r) => [r.rowSlug, r.flag]),
);

function mergeFlags(rows: StablecoinDirectoryRow[]): StablecoinDirectoryRow[] {
  return rows.map((r) => ({
    ...r,
    flag: r.flag || flagBySlug.get(r.rowSlug) || "",
  }));
}

function loadNarrativeHtml(): string {
  try {
    return readFileSync(
      join(process.cwd(), "public/stablecoin-directory-narrative.html"),
      "utf8",
    );
  } catch {
    return "";
  }
}

export default async function StablecoinDirectoryPage() {
  const view = await getStablecoinDirectoryView();
  const rows = mergeFlags(view.rows);

  return (
    <StablecoinDirectoryClient
      view={{ ...view, rows }}
      narrativeHtml={loadNarrativeHtml()}
    />
  );
}
