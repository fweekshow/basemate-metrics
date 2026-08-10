#!/usr/bin/env bun
/**
 * Pull Notion → Postgres (local or prod DATABASE_URL).
 * Usage: bun scripts/sync-notion-data-room.ts
 */
import pg from "pg";

import { syncNotionToPostgres } from "../src/lib/notion/sync-data-room";

const { Pool } = pg;

const contentDatabaseId = process.env.NOTION_CONTENT_DB_ID?.trim();
const pipelineDatabaseId = process.env.NOTION_PIPELINE_DB_ID?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!process.env.NOTION_API_KEY?.trim() || !contentDatabaseId || !pipelineDatabaseId || !databaseUrl) {
  console.error(
    "Need NOTION_API_KEY, NOTION_CONTENT_DB_ID, NOTION_PIPELINE_DB_ID, DATABASE_URL",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

try {
  const result = await syncNotionToPostgres(pool, {
    contentDatabaseId,
    pipelineDatabaseId,
  });
  console.log("Sync OK:", result);
} finally {
  await pool.end();
}
