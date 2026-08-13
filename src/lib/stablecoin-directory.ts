import fallbackData from "@/data/stablecoin-directory.fallback.json";
import { getPool } from "@/lib/data-room-db";
import { ensureDataRoomTables } from "@/lib/notion/sync-data-room";

import {
  sortStablecoinRows,
  type StablecoinDirectoryRow,
  type StablecoinDirectoryView,
} from "./stablecoin-directory-shared";

export type { StablecoinDirectoryRow, StablecoinDirectoryView } from "./stablecoin-directory-shared";
export {
  groupRowsByRegion,
  regionSubtitle,
  STABLECOIN_REGION_ORDER,
} from "./stablecoin-directory-shared";

function mapPgRow(r: {
  row_slug: string;
  region: string;
  country: string;
  currency: string;
  ticker: string;
  flag: string;
  issuer: string;
  founder: string;
  founder_twitter: string;
  twitter: string;
  contact: string;
  base_status: string;
  loi_tier: string;
  stage: string;
  confirmed_on_base: boolean;
  show_on_site: boolean;
  sort_order: number;
}): StablecoinDirectoryRow {
  return {
    rowSlug: r.row_slug,
    region: r.region,
    country: r.country,
    currency: r.currency,
    ticker: r.ticker,
    flag: r.flag,
    issuer: r.issuer,
    founder: r.founder,
    founderTwitter: r.founder_twitter,
    twitter: r.twitter,
    contact: r.contact,
    baseStatus: r.base_status,
    loiTier: r.loi_tier,
    stage: r.stage,
    confirmedOnBase: r.confirmed_on_base,
    showOnSite: r.show_on_site,
    sortOrder: r.sort_order,
  };
}

function fallbackView(): StablecoinDirectoryView {
  const rows = (fallbackData.rows as StablecoinDirectoryRow[]).filter((r) => r.showOnSite !== false);
  const loiSignedCount = rows.filter(
    (r) => r.stage === "LOI Signed" || r.stage === "Active",
  ).length;
  return {
    rows: sortStablecoinRows(rows),
    loiSignedCount,
    loiTarget: 10,
    source: "fallback",
  };
}

export async function getStablecoinDirectoryView(): Promise<StablecoinDirectoryView> {
  const pool = getPool();
  if (!pool) return fallbackView();

  try {
    await ensureDataRoomTables(pool);
    const res = await pool.query<{
      row_slug: string;
      region: string;
      country: string;
      currency: string;
      ticker: string;
      flag: string;
      issuer: string;
      founder: string;
      founder_twitter: string;
      twitter: string;
      contact: string;
      base_status: string;
      loi_tier: string;
      stage: string;
      confirmed_on_base: boolean;
      show_on_site: boolean;
      sort_order: number;
    }>(
      `SELECT row_slug, region, country, currency, ticker, flag, issuer, founder, founder_twitter,
              twitter, contact, base_status, loi_tier, stage, confirmed_on_base, show_on_site, sort_order
       FROM stablecoin_directory_rows
       WHERE show_on_site = true
       ORDER BY region, sort_order`,
    );

    if (!res.rowCount) return fallbackView();

    const rows = res.rows.map(mapPgRow);
    const loiSignedCount = rows.filter(
      (r) => r.stage === "LOI Signed" || r.stage === "Active",
    ).length;

    return {
      rows: sortStablecoinRows(rows),
      loiSignedCount,
      loiTarget: 10,
      source: "postgres",
    };
  } catch {
    return fallbackView();
  }
}
