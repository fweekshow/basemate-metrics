import { INVESTOR } from "@/lib/investor";
import { getPool } from "@/lib/data-room-db";

export type DataRoomInvestorView = {
  round: string;
  year: string;
  status: string;
  target: string;
  targetNote: string;
  committed: string;
  committedNote: string;
  headline: string;
  subhead: string;
  traction: { value: string; label: string }[];
};

function mapFromStatic(): DataRoomInvestorView {
  return {
    round: INVESTOR.round,
    year: INVESTOR.year,
    status: INVESTOR.status,
    target: INVESTOR.target,
    targetNote: INVESTOR.targetNote,
    committed: INVESTOR.committed,
    committedNote: INVESTOR.committedNote,
    headline: INVESTOR.headline,
    subhead: INVESTOR.subhead,
    traction: INVESTOR.traction.map((t) => ({ value: t.value, label: t.label })),
  };
}

async function loadContentMap(): Promise<Map<string, { value: string; note: string }>> {
  const pool = getPool();
  const map = new Map<string, { value: string; note: string }>();
  if (!pool) return map;

  try {
    const res = await pool.query<{ field: string; value: string; note: string }>(
      `SELECT field, value, note FROM data_room_content`,
    );
    for (const row of res.rows) {
      map.set(row.field, { value: row.value, note: row.note ?? "" });
    }
  } catch {
    // table may not exist yet
  }
  return map;
}

function pick(
  map: Map<string, { value: string; note: string }>,
  key: string,
  fallback: string,
): string {
  return map.get(key)?.value?.trim() || fallback;
}

function pickNote(
  map: Map<string, { value: string; note: string }>,
  key: string,
  fallback: string,
): string {
  return map.get(key)?.note?.trim() || fallback;
}

/** Hero + raise strip + traction — Notion sync overrides static INVESTOR when present. */
export async function getDataRoomInvestorView(): Promise<DataRoomInvestorView> {
  const base = mapFromStatic();
  const map = await loadContentMap();
  if (map.size === 0) return base;

  return {
    round: pick(map, "round", base.round),
    year: pick(map, "year", base.year),
    status: pick(map, "status", base.status),
    target: pick(map, "target", base.target),
    targetNote: pickNote(map, "target", base.targetNote),
    committed: pick(map, "committed", base.committed),
    committedNote: pickNote(map, "committed", base.committedNote),
    headline: pick(map, "headline", base.headline),
    subhead: pick(map, "subhead", base.subhead),
    traction: [
      {
        value: pick(map, "traction_users", base.traction[0]?.value ?? ""),
        label: pickNote(map, "traction_users", base.traction[0]?.label ?? "total users"),
      },
      {
        value: pick(map, "traction_wau", base.traction[1]?.value ?? ""),
        label: pickNote(map, "traction_wau", base.traction[1]?.label ?? "weekly active"),
      },
      {
        value: pick(map, "traction_messages", base.traction[2]?.value ?? ""),
        label: pickNote(map, "traction_messages", base.traction[2]?.label ?? "messages handled"),
      },
      {
        value: pick(map, "traction_notional", base.traction[3]?.value ?? ""),
        label: pickNote(map, "traction_notional", base.traction[3]?.label ?? "notional moved"),
      },
    ],
  };
}
