import { readFileSync } from "node:fs";
import { join } from "node:path";

import fallbackData from "@/data/stablecoin-directory.fallback.json";
import type { StablecoinDirectoryRow } from "@/lib/stablecoin-directory-shared";
import { getStablecoinDirectoryView } from "@/lib/stablecoin-directory";

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

export async function loadStablecoinDirectoryPage() {
  const view = await getStablecoinDirectoryView();
  return {
    view: { ...view, rows: mergeFlags(view.rows) },
    narrativeHtml: loadNarrativeHtml(),
  };
}
