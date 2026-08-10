import { NextResponse } from "next/server";

import { getPool } from "@/lib/data-room-db";
import { notionConfig } from "@/lib/notion/client";
import { syncNotionToPostgres } from "@/lib/notion/sync-data-room";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.DATA_ROOM_SYNC_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

/** POST /api/cron/notion-data-room — pull Notion CMS → Postgres cache */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = notionConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Notion not configured (NOTION_API_KEY, NOTION_*_DB_ID)" },
      { status: 503 },
    );
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }

  try {
    const result = await syncNotionToPostgres(pool, {
      contentDatabaseId: config.contentDatabaseId,
      pipelineDatabaseId: config.pipelineDatabaseId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[notion-data-room sync]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
