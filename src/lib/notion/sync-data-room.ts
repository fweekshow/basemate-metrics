import type { Pool } from "pg";

import {
  propCheckbox,
  propDate,
  propRich,
  propSelect,
  propTitle,
  queryDatabaseAll,
  type NotionPage,
} from "@/lib/notion/client";

const ACTIVE_STAGES = new Set([
  "outreach_sent",
  "meeting_scheduled",
  "meeting_done",
  "follow_up",
  "term_sheet",
]);

export async function ensureDataRoomTables(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS data_room_content (
      field TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS data_room_pipeline (
      firm_slug TEXT PRIMARY KEY,
      firm TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      stage TEXT NOT NULL DEFAULT 'identified',
      meeting_date TIMESTAMPTZ,
      notes TEXT,
      tier TEXT,
      show_on_site BOOLEAN NOT NULL DEFAULT false,
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export type SyncResult = {
  contentRows: number;
  pipelineRows: number;
  visiblePipeline: number;
};

export async function syncNotionToPostgres(
  pool: Pool,
  config: {
    contentDatabaseId: string;
    pipelineDatabaseId: string;
  },
): Promise<SyncResult> {
  await ensureDataRoomTables(pool);

  const contentPages = await queryDatabaseAll(config.contentDatabaseId);
  let contentRows = 0;
  for (const page of contentPages) {
    const field = propTitle(page, "Field").trim().toLowerCase();
    if (!field) continue;
    const value = propRich(page, "Value");
    const note = propRich(page, "Note");
    await pool.query(
      `INSERT INTO data_room_content (field, value, note, synced_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (field) DO UPDATE SET value = EXCLUDED.value, note = EXCLUDED.note, synced_at = NOW()`,
      [field, value, note],
    );
    contentRows += 1;
  }

  const pipelinePages = await queryDatabaseAll(config.pipelineDatabaseId);
  const seenFirms = new Set<string>();
  let pipelineRows = 0;
  let visiblePipeline = 0;

  for (const page of pipelinePages) {
    const firmDisplay = propTitle(page, "Firm").trim();
    if (!firmDisplay) continue;
    const firmKey = firmDisplay.toLowerCase();
    seenFirms.add(firmKey);

    const name = propRich(page, "Contact") || firmDisplay;
    const stage = propSelect(page, "Stage") ?? "identified";
    const showOnSite = propCheckbox(page, "Show on site");
    const meetingStart = propDate(page, "Meeting");
    const tier = propSelect(page, "Tier");
    const notes = propRich(page, "Notes");
    const meetingDate = meetingStart ? new Date(meetingStart) : null;

    await pool.query(
      `INSERT INTO data_room_pipeline (firm_slug, firm, name, stage, meeting_date, notes, tier, show_on_site, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (firm_slug) DO UPDATE SET
         firm = EXCLUDED.firm,
         name = EXCLUDED.name,
         stage = EXCLUDED.stage,
         meeting_date = EXCLUDED.meeting_date,
         notes = EXCLUDED.notes,
         tier = EXCLUDED.tier,
         show_on_site = EXCLUDED.show_on_site,
         synced_at = NOW()`,
      [firmKey, firmDisplay, name, stage, meetingDate, notes || null, tier, showOnSite],
    );
    pipelineRows += 1;
    if (showOnSite || ACTIVE_STAGES.has(stage)) visiblePipeline += 1;
  }

  if (seenFirms.size > 0) {
    await pool.query(`DELETE FROM data_room_pipeline WHERE NOT (firm_slug = ANY($1::text[]))`, [
      Array.from(seenFirms),
    ]);
  }

  return { contentRows, pipelineRows, visiblePipeline };
}
