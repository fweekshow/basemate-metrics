#!/usr/bin/env node
/**
 * One-time: create Basemate Seed Data Room CMS in Notion.
 *
 * Prerequisites:
 * 1. Create an integration at https://www.notion.so/my-integrations
 * 2. Export NOTION_API_KEY (integration secret)
 * 3. Optional: NOTION_PARENT_PAGE_ID — any page you've shared with the integration.
 *    If omitted, tries workspace-level page create (requires integration capability).
 *
 * Writes IDs to stdout and docs/notion-data-room.env.example (no secrets).
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { notionFetch, richTextPlain } from "./notion-http.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const token = process.env.NOTION_API_KEY?.trim();
if (!token) {
  console.error("Set NOTION_API_KEY to your integration secret.");
  process.exit(1);
}

const PARENT = process.env.NOTION_PARENT_PAGE_ID?.trim();

const STAGE_OPTIONS = [
  { name: "identified", color: "gray" },
  { name: "researching", color: "brown" },
  { name: "outreach_sent", color: "blue" },
  { name: "meeting_scheduled", color: "purple" },
  { name: "meeting_done", color: "green" },
  { name: "follow_up", color: "yellow" },
  { name: "term_sheet", color: "pink" },
  { name: "passed", color: "red" },
  { name: "on_hold", color: "default" },
];

async function findExistingHub() {
  const res = await notionFetch(token, "/search", {
    method: "POST",
    body: JSON.stringify({
      query: "Basemate Seed Data Room",
      filter: { property: "object", value: "page" },
    }),
  });
  for (const page of res.results ?? []) {
    const title = page.properties?.title?.title ?? page.properties?.Name?.title;
    const text = richTextPlain(title ?? []);
    if (text.includes("Basemate Seed Data Room")) return page.id;
  }
  return null;
}

async function createHubPage() {
  const parent = PARENT
    ? { type: "page_id", page_id: PARENT }
    : { type: "workspace", workspace: true };

  return notionFetch(token, "/pages", {
    method: "POST",
    body: JSON.stringify({
      parent,
      icon: { type: "emoji", emoji: "📊" },
      properties: {
        title: {
          title: [{ type: "text", text: { content: "Basemate Seed Data Room (CMS)" } }],
        },
      },
      children: [
        {
          object: "block",
          type: "callout",
          callout: {
            icon: { type: "emoji", emoji: "💡" },
            rich_text: [
              {
                type: "text",
                text: {
                  content:
                    "Edit the two databases below. Run sync (Railway cron or npm run notion:sync) to push changes to basemate.app/data-room. Pipeline rows with “Show on site” appear under Who we're talking to.",
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "1 · Site copy & raise" } }],
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
                    "One row per field (headline, subhead, target, committed, …). Do not rename Field keys — the site maps them.",
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "2 · VC pipeline" } }],
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
                    "Firm name is the key. Stage drives ordering. Turn on “Show on site” for active conversations (or use stages outreach_sent → term_sheet).",
                },
              },
            ],
          },
        },
      ],
    }),
  });
}

async function createContentDb(parentPageId) {
  return notionFetch(token, "/databases", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "page_id", page_id: parentPageId },
      icon: { type: "emoji", emoji: "✏️" },
      title: [{ type: "text", text: { content: "Site copy & raise" } }],
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
      title: [{ type: "text", text: { content: "VC pipeline" } }],
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

async function seedContentRows(databaseId) {
  const rows = [
    ["headline", "Access only counts if everyone can reach it.", ""],
    [
      "subhead",
      "Our mission: put Base on a local cell phone in every country. Stablecoins first — then the full Base stack. Send money to anyone, anywhere, with just a text. No app. No seed phrase.",
      "",
    ],
    ["target", "$1M", "Lights up the first five country nodes"],
    ["committed", "$20K", "First close in progress"],
    ["status", "Pre-seed, actively closing", "Badge + raise strip note"],
    ["round", "Seed", ""],
    ["year", "2026", ""],
    ["traction_users", "12,413", "total users"],
    ["traction_wau", "445", "weekly active"],
    ["traction_messages", "64,810", "messages handled"],
    ["traction_notional", "$139,925", "notional moved"],
  ];

  for (const [field, value, note] of rows) {
    await notionFetch(token, "/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { type: "database_id", database_id: databaseId },
        properties: {
          Field: { title: [{ type: "text", text: { content: field } }] },
          Value: { rich_text: [{ type: "text", text: { content: value } }] },
          Note: note
            ? { rich_text: [{ type: "text", text: { content: note } }] }
            : { rich_text: [] },
        },
      }),
    });
  }
}

async function main() {
  let hubId = await findExistingHub();
  if (hubId) {
    console.log("Found existing hub page:", hubId);
  } else {
    const hub = await createHubPage();
    hubId = hub.id;
    console.log("Created hub page:", hubId);
  }

  const searchDbs = await notionFetch(token, "/search", {
    method: "POST",
    body: JSON.stringify({
      query: "Site copy",
      filter: { property: "object", value: "database" },
    }),
  });

  let contentDbId;
  let pipelineDbId;

  for (const db of searchDbs.results ?? []) {
    const t = richTextPlain(db.title ?? []);
    if (t.includes("Site copy")) contentDbId = db.id;
    if (t.includes("VC pipeline")) pipelineDbId = db.id;
  }

  if (!contentDbId) {
    const db = await createContentDb(hubId);
    contentDbId = db.id;
    console.log("Created Site copy database:", contentDbId);
    await seedContentRows(contentDbId);
    console.log("Seeded default copy rows.");
  } else {
    console.log("Site copy database exists:", contentDbId);
  }

  if (!pipelineDbId) {
    const db = await createPipelineDb(hubId);
    pipelineDbId = db.id;
    console.log("Created VC pipeline database:", pipelineDbId);
  } else {
    console.log("VC pipeline database exists:", pipelineDbId);
  }

  const envSnippet = `# Notion → data room (add to Railway basemate-metrics + .env.local)
NOTION_API_KEY=
NOTION_DATA_ROOM_PAGE_ID=${hubId}
NOTION_CONTENT_DB_ID=${contentDbId}
NOTION_PIPELINE_DB_ID=${pipelineDbId}
DATA_ROOM_SYNC_SECRET=   # random string; cron POST /api/cron/notion-data-room
`;

  const outPath = join(__dirname, "..", "docs", "notion-data-room.ids.env");
  writeFileSync(outPath, envSnippet);
  console.log("\nWrote", outPath);
  console.log(envSnippet);
  console.log(
    "\nOpen Notion → share the hub page with your integration (⋯ → Connections).",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
