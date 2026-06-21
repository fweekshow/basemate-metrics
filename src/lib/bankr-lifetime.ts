const LIFETIME_READ_CACHE_MS = 30 * 60 * 1000;

/** Dashboard query: dune.com/freeksh00w/basemate (not 7729173 draft). */
const DEFAULT_QUERY_ID = "7729265";

let lifetimeCache: { value: number; fetchedAt: number } | null = null;

function parseLifetimeVolumeFromRows(
  rows: Array<Record<string, unknown>> | undefined,
): number | null {
  if (!rows?.length) return null;
  const row = rows[0];
  if (!row) return null;

  for (const key of [
    "lifetime_volume_usd",
    "lifetime_volume_usdc",
    "lifetime_volume",
    "volume_usd",
    "volume",
  ]) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }

  const firstNumeric = Object.values(row).find(
    (v) =>
      (typeof v === "number" && Number.isFinite(v)) ||
      (typeof v === "string" && Number.isFinite(Number(v))),
  );
  if (firstNumeric == null) return null;
  return typeof firstNumeric === "number" ? firstNumeric : Number(firstNumeric);
}

async function readDuneLatestLifetimeVolumeUsdc(): Promise<number> {
  const apiKey = process.env.DUNE_API_KEY?.trim();
  const queryId =
    process.env.DUNE_BANKR_LIFETIME_QUERY_ID?.trim() || DEFAULT_QUERY_ID;
  if (!apiKey) throw new Error("DUNE_API_KEY not set");

  const res = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results`, {
    headers: { "X-Dune-Api-Key": apiKey },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `No saved Dune results for query ${queryId} — run it once on dune.com/queries/${queryId}`,
      );
    }
    throw new Error(`Dune read failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    state?: string;
    result?: { rows?: Array<Record<string, unknown>> };
  };

  if (data.state && data.state !== "QUERY_STATE_COMPLETED") {
    throw new Error(`Dune query not ready: ${data.state}`);
  }

  const volume = parseLifetimeVolumeFromRows(data.result?.rows);
  if (volume == null) throw new Error("Dune result missing lifetime volume column");
  return volume;
}

/** Bankr lifetime vol via cached GET of latest Dune query result (no execute). */
export async function resolveBankrLifetimeVolumeUsdc(): Promise<number | null> {
  if (!process.env.DUNE_API_KEY?.trim()) return null;

  if (lifetimeCache && Date.now() - lifetimeCache.fetchedAt < LIFETIME_READ_CACHE_MS) {
    return lifetimeCache.value;
  }

  const volume = await readDuneLatestLifetimeVolumeUsdc();
  lifetimeCache = { value: volume, fetchedAt: Date.now() };
  return volume;
}
