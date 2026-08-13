export type StablecoinDirectoryRow = {
  rowSlug: string;
  region: string;
  country: string;
  currency: string;
  ticker: string;
  flag: string;
  issuer: string;
  founder: string;
  founderTwitter: string;
  twitter: string;
  contact: string;
  baseStatus: string;
  loiTier: string;
  stage: string;
  confirmedOnBase: boolean;
  showOnSite: boolean;
  sortOrder: number;
};

export type StablecoinDirectoryView = {
  rows: StablecoinDirectoryRow[];
  loiSignedCount: number;
  loiTarget: number;
  source: "postgres" | "fallback";
};

const REGION_ORDER = [
  "Americas",
  "Europe",
  "Africa",
  "Asia-Pacific",
  "Middle East",
  "Global USD",
] as const;

export const STABLECOIN_REGION_ORDER: readonly string[] = REGION_ORDER;

export function sortStablecoinRows(rows: StablecoinDirectoryRow[]): StablecoinDirectoryRow[] {
  return [...rows].sort((a, b) => {
    const ri = REGION_ORDER.indexOf(a.region as (typeof REGION_ORDER)[number]);
    const rj = REGION_ORDER.indexOf(b.region as (typeof REGION_ORDER)[number]);
    const ro = (ri === -1 ? 99 : ri) - (rj === -1 ? 99 : rj);
    if (ro !== 0) return ro;
    return a.sortOrder - b.sortOrder;
  });
}

export function groupRowsByRegion(
  rows: StablecoinDirectoryRow[],
): { region: string; rows: StablecoinDirectoryRow[] }[] {
  const sorted = sortStablecoinRows(rows);
  const groups: { region: string; rows: StablecoinDirectoryRow[] }[] = [];
  let current: string | null = null;
  for (const row of sorted) {
    if (row.region !== current) {
      current = row.region;
      groups.push({ region: current, rows: [] });
    }
    groups[groups.length - 1].rows.push(row);
  }
  return groups;
}

export function regionSubtitle(region: string, rows: StablecoinDirectoryRow[]): string {
  const inRegion = rows.filter((r) => r.region === region);
  const currencies = new Set(inRegion.map((r) => r.currency).filter(Boolean));
  const issuers = inRegion.length;
  if (region === "Africa") {
    return `${currencies.size} currencies · ${issuers} issuers · 79% global stablecoin adoption rate`;
  }
  if (region === "Global USD") {
    return "the base asset under every corridor";
  }
  return `${currencies.size} currencies · ${issuers} issuers`;
}
