import { Pool, type PoolConfig } from "pg";

const SSL_DISABLED_VALUES = new Set(["0", "false", "disable", "disabled", "no", "off"]);
const SSL_ENABLED_VALUES = new Set(["1", "true", "enable", "enabled", "require", "yes", "on"]);

let poolCache: { databaseUrl: string; pool: Pool } | null = null;

function getSslMode(connectionString: string): string | undefined {
  try {
    return new URL(connectionString).searchParams.get("sslmode")?.trim().toLowerCase();
  } catch {
    return undefined;
  }
}

function resolvePgSsl(connectionString: string): PoolConfig["ssl"] | undefined {
  const explicit = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (explicit) {
    if (SSL_DISABLED_VALUES.has(explicit)) return false;
    if (SSL_ENABLED_VALUES.has(explicit)) return { rejectUnauthorized: false };
  }
  const sslMode = getSslMode(connectionString);
  if (sslMode === "disable") return false;
  if (sslMode === "require" || sslMode === "no-verify") return { rejectUnauthorized: false };
  return process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false;
}

function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || process.env.SHARED_GROUPS_DATABASE_URL?.trim();
}

export function getPool(): Pool | null {
  const url = databaseUrl();
  if (!url) return null;
  if (!poolCache || poolCache.databaseUrl !== url) {
    poolCache = {
      databaseUrl: url,
      pool: new Pool({ connectionString: url, ssl: resolvePgSsl(url) }),
    };
  }
  return poolCache.pool;
}

async function ensureVisitTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS data_room_visits (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      firm TEXT NOT NULL DEFAULT '',
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_agent TEXT,
      ip TEXT
    )
  `);
}

export async function logDataRoomVisit(input: {
  name: string;
  firm: string;
  userAgent?: string | null;
  ip?: string | null;
}): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  try {
    await ensureVisitTable(pool);
    await pool.query(
      `INSERT INTO data_room_visits (name, firm, user_agent, ip) VALUES ($1, $2, $3, $4)`,
      [input.name, input.firm, input.userAgent ?? null, input.ip ?? null],
    );
  } catch (err) {
    console.error("[data-room] visit log failed", err);
  }
}

export type TalkingToContact = {
  name: string;
  firm: string;
  stage: string;
  meetingDate: string | null;
  notes: string | null;
  tier: string | null;
};

const ACTIVE_STAGES = [
  "outreach_sent",
  "meeting_scheduled",
  "meeting_done",
  "follow_up",
  "term_sheet",
] as const;

/**
 * Active raise conversations from the agent investor funnel.
 * Updated by texting Mate: `/vc stage <firm> <stage>`, `/vc meet <firm> <day>`, etc.
 */
function mapTalkingRows(
  rows: {
    name: string;
    firm: string;
    stage: string;
    meeting_date: Date | string | null;
    notes: string | null;
    tier: string | null;
  }[],
): TalkingToContact[] {
  return rows.map((row) => ({
    name: row.name,
    firm: row.firm,
    stage: row.stage,
    meetingDate: row.meeting_date
      ? new Date(row.meeting_date).toISOString()
      : null,
    notes: row.notes,
    tier: row.tier,
  }));
}

const ORDER_BY_STAGE = `
  ORDER BY
    CASE stage
      WHEN 'term_sheet' THEN 0
      WHEN 'follow_up' THEN 1
      WHEN 'meeting_done' THEN 2
      WHEN 'meeting_scheduled' THEN 3
      WHEN 'outreach_sent' THEN 4
      ELSE 5
    END,
    meeting_date NULLS LAST,
    firm ASC`;

/**
 * Active conversations: Notion-synced `data_room_pipeline` first, else Mate `investor_contacts`.
 */
export async function getTalkingTo(): Promise<TalkingToContact[]> {
  const pool = getPool();
  if (!pool) return [];

  try {
    const notionPipeline = await pool.query<{
      name: string;
      firm: string;
      stage: string;
      meeting_date: Date | string | null;
      notes: string | null;
      tier: string | null;
    }>(
      `SELECT name, firm, stage, meeting_date, notes, tier
       FROM data_room_pipeline
       WHERE show_on_site = true OR stage = ANY($1::text[])
       ${ORDER_BY_STAGE}`,
      [ACTIVE_STAGES],
    );
    if (notionPipeline.rowCount && notionPipeline.rowCount > 0) {
      return mapTalkingRows(notionPipeline.rows);
    }
  } catch {
    // table may not exist until first Notion sync
  }

  try {
    const result = await pool.query<{
      name: string;
      firm: string;
      stage: string;
      meeting_date: Date | string | null;
      notes: string | null;
      tier: string | null;
    }>(
      `SELECT name, firm, stage, meeting_date, notes, tier
       FROM investor_contacts
       WHERE stage = ANY($1::text[])
       ${ORDER_BY_STAGE}`,
      [ACTIVE_STAGES],
    );
    return mapTalkingRows(result.rows);
  } catch {
    return [];
  }
}

export function formatStage(stage: string): string {
  return stage.replace(/_/g, " ");
}
