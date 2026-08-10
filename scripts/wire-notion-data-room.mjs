#!/usr/bin/env node
/**
 * Attach CMS databases to your existing Notion "Startup Data Room" page,
 * replace template (Acme) copy, and seed rows that match basemate.app/data-room.
 *
 *   NOTION_API_KEY=secret node scripts/wire-notion-data-room.mjs
 *   NOTION_STARTUP_DATA_ROOM_PAGE_ID=...  (optional if search finds the page)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { notionFetch, queryDatabaseAll, richTextPlain } from "./notion-http.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const token = process.env.NOTION_API_KEY?.trim();
if (!token) {
  console.error("Set NOTION_API_KEY");
  process.exit(1);
}

/** Matches src/lib/investor.ts + your mission copy (synced to Site copy DB). */
const SITE_COPY_ROWS = [
  [
    "headline",
    "Access only counts if everyone can reach it.",
    "Hero H1 on basemate.app/data-room",
  ],
  [
    "subhead",
    "Our mission: put Base on a local cell phone in every country. 8B people have a cell phone — almost none have an onchain account. Stablecoins first, then the full Base stack. Send money to anyone, anywhere, with just a text. No app. No seed phrase.",
    "Hero paragraph",
  ],
  ["target", "$1M", "Lights up the first five country nodes"],
  ["pending", "$20K", "Soft-circled — first close in progress"],
  ["committed", "$0", "Wired / docs signed"],
  ["status", "Pre-seed, actively closing", "Raise strip + badge context"],
  ["round", "Seed", ""],
  ["year", "2026", ""],
  ["traction_users", "12,413", "total users"],
  ["traction_wau", "445", "weekly active"],
  ["traction_messages", "64,810", "messages handled"],
  ["traction_notional", "$139,925", "notional moved"],
];

const STAGE_OPTIONS = [
  "identified",
  "researching",
  "outreach_sent",
  "meeting_scheduled",
  "meeting_done",
  "follow_up",
  "term_sheet",
  "passed",
  "on_hold",
].map((name) => ({ name, color: "default" }));

async function findStartupDataRoomPageId() {
  const explicit = process.env.NOTION_STARTUP_DATA_ROOM_PAGE_ID?.trim();
  if (explicit) return explicit;

  const res = await notionFetch(token, "/search", {
    method: "POST",
    body: JSON.stringify({ query: "Startup Data Room", page_size: 20 }),
  });

  for (const hit of res.results ?? []) {
    if (hit.object !== "page") continue;
    const titleProp = hit.properties?.title?.title ?? hit.properties?.Name?.title;
    const title = richTextPlain(titleProp ?? []);
    if (title.toLowerCase().includes("startup data room")) return hit.id;
  }
  throw new Error(
    'Could not find "Startup Data Room". Share that page with your integration, or set NOTION_STARTUP_DATA_ROOM_PAGE_ID.',
  );
}

async function findChildDatabases(pageId) {
  const blocks = await notionFetch(token, `/blocks/${pageId}/children?page_size=100`);
  const dbs = { content: null, pipeline: null, team: null };

  for (const block of blocks.results ?? []) {
    if (block.type !== "child_database") continue;
    const title = block.child_database?.title ?? "";
    const t = title.toLowerCase();
    if (t.includes("site copy") || t.includes("raise")) dbs.content = block.id;
    if (t.includes("vc pipeline") || t.includes("investor pipeline")) dbs.pipeline = block.id;
    if (t.includes("founding team")) dbs.team = block.id;
  }

  const search = await notionFetch(token, "/search", {
    method: "POST",
    body: JSON.stringify({ query: "Site copy", page_size: 10 }),
  });
  for (const db of search.results ?? []) {
    if (db.object !== "database") continue;
    const title = richTextPlain(db.title ?? []);
    if (title.includes("Site copy")) dbs.content = db.id;
    if (title.includes("VC pipeline")) dbs.pipeline = db.id;
  }

  return dbs;
}

async function createContentDb(parentPageId) {
  return notionFetch(token, "/databases", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "page_id", page_id: parentPageId },
      icon: { type: "emoji", emoji: "✏️" },
      title: [{ type: "text", text: { content: "Site copy & raise (live on basemate.app)" } }],
      properties: {
        Field: { title: {} },
        Value: { rich_text: {} },
        Note: { rich_text: {} },
      },
    }),
  });
}

async function createPipelineDb(parentPageId) {
  return notionFetch(token, "/databases", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "page_id", page_id: parentPageId },
      icon: { type: "emoji", emoji: "🤝" },
      title: [{ type: "text", text: { content: "VC pipeline (Who we're talking to)" } }],
      properties: {
        Firm: { title: {} },
        Contact: { rich_text: {} },
        Stage: { select: { options: STAGE_OPTIONS } },
        "Show on site": { checkbox: {} },
        Meeting: { date: {} },
        Tier: {
          select: {
            options: [
              { name: "tier1", color: "red" },
              { name: "tier2", color: "blue" },
              { name: "tier3", color: "gray" },
            ],
          },
        },
        Notes: { rich_text: {} },
      },
    }),
  });
}

async function upsertContentRows(databaseId) {
  const existing = await queryDatabaseAll(token, databaseId);
  const byField = new Map();
  for (const page of existing) {
    const field = richTextPlain(page.properties?.Field?.title ?? []).trim().toLowerCase();
    if (field) byField.set(field, page.id);
  }

  for (const [field, value, note] of SITE_COPY_ROWS) {
    const key = field.toLowerCase();
    const props = {
      Field: { title: [{ type: "text", text: { content: field } }] },
      Value: { rich_text: [{ type: "text", text: { content: value } }] },
      Note: note
        ? { rich_text: [{ type: "text", text: { content: note } }] }
        : { rich_text: [] },
    };

    if (byField.has(key)) {
      await notionFetch(token, `/pages/${byField.get(key)}`, {
        method: "PATCH",
        body: JSON.stringify({ properties: props }),
      });
    } else {
      await notionFetch(token, "/pages", {
        method: "POST",
        body: JSON.stringify({
          parent: { type: "database_id", database_id: databaseId },
          properties: props,
        }),
      });
    }
  }
}

async function patchIntroCallout(pageId) {
  const blocks = await notionFetch(token, `/blocks/${pageId}/children?page_size=50`);
  for (const block of blocks.results ?? []) {
    if (block.type !== "callout") continue;
    const text = richTextPlain(block.callout?.rich_text ?? []);
    if (!text.toLowerCase().includes("acme") && !text.toLowerCase().includes("digital transformation")) {
      continue;
    }
    await notionFetch(token, `/blocks/${block.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        callout: {
          rich_text: [
            {
              type: "text",
              text: {
                content:
                  "Basemate · Seed 2026 — The messaging network for stablecoins. Edit hero + raise numbers in “Site copy & raise” below; sync pushes to basemate.app/data-room. Pipeline rows with Show on site appear under Who we're talking to.",
              },
            },
          ],
          icon: { type: "emoji", emoji: "📱" },
        },
      }),
    });
    console.log("Updated intro callout on Startup Data Room.");
    return;
  }
}

async function appendCmsSection(pageId) {
  const blocks = await notionFetch(token, `/blocks/${pageId}/children?page_size=100`);
  const hasHeading = (blocks.results ?? []).some((b) => {
    if (b.type !== "heading_2") return false;
    return richTextPlain(b.heading_2?.rich_text ?? "").includes("Live site CMS");
  });
  if (hasHeading) return;

  await notionFetch(token, `/blocks/${pageId}/children`, {
    method: "PATCH",
    body: JSON.stringify({
      children: [
        {
          object: "block",
          type: "divider",
          divider: {},
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Live site CMS (basemate.app/data-room)" } }],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content:
                    "Edit the two databases in this section. Run sync on Railway (or bun scripts/sync-notion-data-room.ts locally) after changes. Mate /vc commands still update Postgres investor_contacts when Notion pipeline is empty.",
                },
              },
            ],
          },
        },
      ],
    }),
  });
  console.log("Added Live site CMS section to Startup Data Room.");
}

async function main() {
  const pageId = await findStartupDataRoomPageId();
  console.log("Startup Data Room page:", pageId);

  await patchIntroCallout(pageId);
  await appendCmsSection(pageId);

  let { content, pipeline } = await findChildDatabases(pageId);

  if (!content) {
    const db = await createContentDb(pageId);
    content = db.id;
    console.log("Created Site copy database:", content);
  } else {
    console.log("Site copy database:", content);
  }

  if (!pipeline) {
    const db = await createPipelineDb(pageId);
    pipeline = db.id;
    console.log("Created VC pipeline database:", pipeline);
  } else {
    console.log("VC pipeline database:", pipeline);
  }

  await upsertContentRows(content);
  console.log("Site copy rows synced from basemate.app defaults.");

  const envBlock = `
# Notion → /data-room (Railway basemate-metrics)
NOTION_API_KEY=
NOTION_DATA_ROOM_PAGE_ID=${pageId}
NOTION_CONTENT_DB_ID=${content}
NOTION_PIPELINE_DB_ID=${pipeline}
DATA_ROOM_SYNC_SECRET=
`;

  const idsPath = join(__dirname, "..", "docs", "notion-data-room.ids.env");
  writeFileSync(idsPath, envBlock.trim() + "\n");
  console.log("\nWrote", idsPath);
  console.log(envBlock);
  console.log(
    "\nNext: add vars to Railway, POST /api/cron/notion-data-room with Bearer DATA_ROOM_SYNC_SECRET, or run bun scripts/sync-notion-data-room.ts",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
