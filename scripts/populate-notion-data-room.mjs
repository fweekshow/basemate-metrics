#!/usr/bin/env node
/**
 * Populate all Startup Data Room template pages + live CMS databases.
 * Requires NOTION_API_KEY and page shared with the "Basemate" integration.
 *
 *   NOTION_STARTUP_DATA_ROOM_PAGE_ID=<url or uuid>
 *   npm run notion:populate
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  listBlockChildrenAll,
  notionFetch,
  parseNotionPageId,
  queryDatabaseAll,
  richTextPlain,
} from "./notion-http.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const token = process.env.NOTION_API_KEY?.trim();
if (!token) {
  console.error("Set NOTION_API_KEY in .env.local");
  process.exit(1);
}

function rt(text) {
  const chunks = [];
  let s = text;
  while (s.length > 0) {
    chunks.push({ type: "text", text: { content: s.slice(0, 2000) } });
    s = s.slice(2000);
  }
  return chunks.length ? chunks : [{ type: "text", text: { content: "" } }];
}

function h2(text) {
  return { object: "block", type: "heading_2", heading_2: { rich_text: rt(text) } };
}
function h3(text) {
  return { object: "block", type: "heading_3", heading_3: { rich_text: rt(text) } };
}
function p(text) {
  return { object: "block", type: "paragraph", paragraph: { rich_text: rt(text) } };
}
function bullet(text) {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: rt(text) },
  };
}

const SITE_COPY_ROWS = [
  ["headline", "Access only counts if everyone can reach it.", "Hero H1 on basemate.app/data-room"],
  [
    "subhead",
    "Our mission: put Base on a local cell phone in every country. 8B people have a cell phone — almost none have an onchain account. Stablecoins first, then the full Base stack. Send money to anyone, anywhere, with just a text. No app. No seed phrase.",
    "Hero paragraph",
  ],
  ["target", "$1M", "Lights up the first five country nodes"],
  ["pending", "$20K", "Soft-circled — first close in progress"],
  ["committed", "$0", "Wired / docs signed"],
  ["status", "Pre-seed, actively closing", "Raise strip"],
  ["round", "Seed", ""],
  ["year", "2026", ""],
  ["traction_users", "12,413", "total users"],
  ["traction_wau", "445", "weekly active"],
  ["traction_messages", "64,810", "messages handled"],
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

/** @type {Record<string, import('./notion-http.mjs').unknown[]>} */
const PAGE_BLOCKS = {
  "Product Description": [
    h2("Basemate"),
    p(
      "Basemate is the messaging network for stablecoins. Every country gets a Mate phone number on iMessage, RCS, and WhatsApp. Text it — a wallet is created. Send USDC (and local stablecoins on Base) to any phone number on earth. No app download. No seed phrase.",
    ),
    h3("What users do"),
    bullet("Text the local Mate number to open a wallet and see balance"),
    bullet("Send money with natural language (“send $50 to Mum”)"),
    bullet("Claim escrow when a recipient gets their first text from Mate"),
    h3("What we are building"),
    bullet("Country nodes: local number + local stablecoin corridor on Base"),
    bullet("Agent layer: trading, yield, and payments inside the thread"),
    bullet("Relay + metrics at basemate.app for operators and investors"),
  ],
  "Technology Stack": [
    h2("Stack"),
    bullet("Channels: iMessage (Spectrum), RCS, WhatsApp; Base App / XMTP for crypto-native surfaces"),
    bullet("Wallets: Coinbase CDP smart accounts + phone-linked escrow"),
    bullet("Chain: Base mainnet — stablecoins first, full Base stack over time"),
    bullet("Agent: basemate-imessage / basemate-tba monorepo, Postgres, Redis"),
    bullet("Web: basemate.app — /app wallet, /metrics, /data-room, headless onramp /pay"),
  ],
  "Intellectual Property": [
    h2("IP & defensibility"),
    p(
      "Distribution moat: operator relationships for in-thread wallets per country. Product IP around phone escrow, cross-channel identity, and agent-orchestrated stablecoin flows. Trademarks: Basemate, Mate. Patents not filed — trade secrets in routing, compliance hooks, and issuer integrations.",
    ),
  ],
  "Revenue Model": [
    h2("Revenue"),
    bullet("Spread / take on send and FX when crossing stablecoin corridors"),
    bullet("Issuer and ramp partner rev-share on volume through each country node"),
    bullet("Premium agent features (trading, yield) over time"),
    bullet("Enterprise / B2B2C deals with local telco and wallet partners"),
  ],
  "Customer Segments": [
    h2("Segments"),
    bullet("Remittance senders who already live in iMessage / WhatsApp"),
    bullet("Crypto-native users who want phone-number UX"),
    bullet("Local issuers and ramps seeking distribution in chat"),
    bullet("Country operators licensing the Mate number + stack"),
  ],
  "Market Research": [
    h2("Market"),
    p(
      "~8B mobile subscribers; remittance and P2P flows exceed $800B/year globally. Stablecoins on Base are live in 20+ local currencies. Almost no one has an onchain account — everyone has SMS/iMessage.",
    ),
  ],
  "Competitive Analysis": [
    h2("Landscape"),
    bullet("Wallet apps: high friction, no default in chat"),
    bullet("Neobanks in chat: region-locked, not stablecoin-native on Base"),
    bullet("Basemate: phone-first, country nodes, stablecoins + full Base stack in thread"),
  ],
  "Marketing Strategies": [
    h2("Go-to-market"),
    bullet("Per-country Mate number + local stablecoin story"),
    bullet("Creator and community loops on Base + X"),
    bullet("Investor/data-room led seed raise; LOIs with issuers (target 10 this round)"),
  ],
  "Sales Strategies & Pipelines": [
    h2("Sales & pipeline"),
    p(
      "VC pipeline lives in the “VC pipeline (Who we're talking to)” database on Startup Data Room. Check Show on site after sync to publish on basemate.app/data-room. Issuer LOIs tracked in corridor table on the live site (manual for now).",
    ),
  ],
  History: [
    h2("History"),
    p(
      "US node live on iMessage and RCS. 12k+ users, $140k+ notional moved. Team building toward five country nodes with this seed round.",
    ),
  ],
  Projections: [
    h2("Use of proceeds · Q3 2027 target"),
    bullet("5 countries signed"),
    bullet("5 issuers onboard"),
    bullet("25k users on the network"),
  ],
  Statements: [
    h2("Raise snapshot"),
    p("Target $1M seed · $20K pending · $0 committed · Pre-seed, actively closing. Edit live numbers in Site copy & raise database."),
  ],
};

const TEAM = [
  { name: "Matthew Meakin", role: "Founder & CEO" },
  { name: "Risavdeb Petra", role: "Co-Founder & CTO" },
  { name: "Aritra Roy", role: "Co-Founder & Engineer" },
  { name: "Michael Gale", role: "Co-Founder & CBO" },
];

async function resolveStartupPageId() {
  const fromEnv =
    process.env.NOTION_STARTUP_DATA_ROOM_PAGE_ID ||
    process.env.NOTION_DATA_ROOM_PAGE_ID;
  if (fromEnv) return parseNotionPageId(fromEnv);

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
  return null;
}

async function assertPageAccess(pageId) {
  try {
    return await notionFetch(token, `/pages/${pageId}`);
  } catch (err) {
    throw new Error(
      `${err.message}\n\nShare “Startup Data Room” with the Basemate integration: page ⋯ → Connections → Basemate.\nThen set NOTION_STARTUP_DATA_ROOM_PAGE_ID to the page URL in .env.local`,
    );
  }
}

async function archiveTemplateTips(pageId) {
  const blocks = await listBlockChildrenAll(token, pageId);
  for (const block of blocks) {
    const t =
      block.type === "callout"
        ? richTextPlain(block.callout?.rich_text ?? [])
        : block.type === "paragraph"
          ? richTextPlain(block.paragraph?.rich_text ?? "")
          : "";
    if (t.toLowerCase().includes("notion tip") || t.toLowerCase().includes("notion tips")) {
      await notionFetch(token, `/blocks/${block.id}`, { method: "PATCH", body: JSON.stringify({ archived: true }) });
    }
  }
}

async function appendBlocksIfEmpty(pageId, title, blocks) {
  const existing = await listBlockChildrenAll(token, pageId);
  const nonEmpty = existing.filter((b) => b.type !== "unsupported");
  if (nonEmpty.length > 2) {
    console.log(`  skip ${title} (${nonEmpty.length} blocks already)`);
    return;
  }
  await archiveTemplateTips(pageId);
  for (let i = 0; i < blocks.length; i += 50) {
    await notionFetch(token, `/blocks/${pageId}/children`, {
      method: "PATCH",
      body: JSON.stringify({ children: blocks.slice(i, i + 50) }),
    });
  }
  console.log(`  filled ${title}`);
}

async function listSubpages(startupPageId) {
  const blocks = await listBlockChildrenAll(token, startupPageId);
  /** @type {{ id: string, title: string }[]} */
  const pages = [];
  for (const b of blocks) {
    if (b.type === "child_page") {
      pages.push({ id: b.id, title: b.child_page?.title ?? "" });
    }
    if (b.type === "child_database") {
      pages.push({ id: b.id, title: b.child_database?.title ?? "", isDatabase: true });
    }
  }
  const search = await notionFetch(token, "/search", {
    method: "POST",
    body: JSON.stringify({ query: "Startup Data Room", page_size: 5 }),
  });
  for (const hit of search.results ?? []) {
    if (hit.object !== "page") continue;
    if (hit.parent?.page_id === startupPageId.replace(/-/g, "")) {
      /* parent uses id without dashes sometimes */
    }
    if (hit.parent?.page_id === startupPageId) {
      const titleProp = hit.properties?.title?.title ?? hit.properties?.Name?.title;
      const title = richTextPlain(titleProp ?? []);
      if (!pages.some((p) => p.id === hit.id)) pages.push({ id: hit.id, title });
    }
  }
  return pages;
}

async function upsertTeamDatabase(databaseId) {
  const db = await notionFetch(token, `/databases/${databaseId}`);
  const props = db.properties ?? {};
  const titleKey = Object.keys(props).find((k) => props[k].type === "title") ?? "Name";
  const roleKey =
    Object.keys(props).find((k) => props[k].type === "select") ??
    Object.keys(props).find((k) => props[k].type === "multi_select") ??
    Object.keys(props).find((k) => props[k].type === "rich_text") ??
    "Role";

  const existing = await queryDatabaseAll(token, databaseId);
  const byName = new Map();
  for (const page of existing) {
    const name = richTextPlain(page.properties?.[titleKey]?.title ?? []);
    byName.set(name.toLowerCase(), page.id);
  }

  for (const person of TEAM) {
    const prop = {
      [titleKey]: { title: rt(person.name) },
    };
    const roleProp = props[roleKey];
    if (roleProp?.type === "select") {
      prop[roleKey] = { select: { name: person.role.includes("CEO") ? "CEO" : person.role.includes("CTO") ? "CTO" : "COO" } };
    } else if (roleProp?.type === "multi_select") {
      const tag = person.role.includes("CEO") ? "CEO" : person.role.includes("CTO") ? "CTO" : person.role.includes("CBO") ? "COO" : "COO";
      prop[roleKey] = { multi_select: [{ name: tag }] };
    } else if (roleProp?.type === "rich_text") {
      prop[roleKey] = { rich_text: rt(person.role) };
    }

    if (byName.has(person.name.toLowerCase())) {
      await notionFetch(token, `/pages/${byName.get(person.name.toLowerCase())}`, {
        method: "PATCH",
        body: JSON.stringify({ properties: prop }),
      });
    } else {
      await notionFetch(token, "/pages", {
        method: "POST",
        body: JSON.stringify({
          parent: { type: "database_id", database_id: databaseId },
          properties: prop,
        }),
      });
    }
  }
  console.log("  updated Founding Team database");
}

async function ensureCmsDatabases(startupPageId) {
  let content = null;
  let pipeline = null;
  let team = null;

  const blocks = await listBlockChildrenAll(token, startupPageId);
  for (const b of blocks) {
    if (b.type !== "child_database") continue;
    const t = (b.child_database?.title ?? "").toLowerCase();
    if (t.includes("site copy")) content = b.id;
    if (t.includes("vc pipeline")) pipeline = b.id;
    if (t.includes("founding team")) team = b.id;
  }

  if (!content) {
    const db = await notionFetch(token, "/databases", {
      method: "POST",
      body: JSON.stringify({
        parent: { type: "page_id", page_id: startupPageId },
        title: [{ type: "text", text: { content: "Site copy & raise (live on basemate.app)" } }],
        properties: {
          Field: { title: {} },
          Value: { rich_text: {} },
          Note: { rich_text: {} },
        },
      }),
    });
    content = db.id;
    console.log("Created Site copy DB", content);
  }

  if (!pipeline) {
    const db = await notionFetch(token, "/databases", {
      method: "POST",
      body: JSON.stringify({
        parent: { type: "page_id", page_id: startupPageId },
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
    pipeline = db.id;
    console.log("Created VC pipeline DB", pipeline);
  }

  const existing = await queryDatabaseAll(token, content);
  const byField = new Map();
  for (const page of existing) {
    const field = richTextPlain(page.properties?.Field?.title ?? []).trim().toLowerCase();
    if (field) byField.set(field, page.id);
  }
  for (const [field, value, note] of SITE_COPY_ROWS) {
    const props = {
      Field: { title: rt(field) },
      Value: { rich_text: rt(value) },
      Note: note ? { rich_text: rt(note) } : { rich_text: [] },
    };
    if (byField.has(field.toLowerCase())) {
      await notionFetch(token, `/pages/${byField.get(field.toLowerCase())}`, {
        method: "PATCH",
        body: JSON.stringify({ properties: props }),
      });
    } else {
      await notionFetch(token, "/pages", {
        method: "POST",
        body: JSON.stringify({
          parent: { type: "database_id", database_id: content },
          properties: props,
        }),
      });
    }
  }
  console.log("Seeded Site copy & raise rows");

  if (team) {
    try {
      await upsertTeamDatabase(team);
    } catch (err) {
      console.warn("  Founding Team skip:", err.message);
    }
  }

  return { content, pipeline, startupPageId };
}

async function patchStartupIntro(startupPageId) {
  const blocks = await listBlockChildrenAll(token, startupPageId);
  for (const block of blocks) {
    if (block.type === "callout") {
      await notionFetch(token, `/blocks/${block.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          callout: {
            icon: { type: "emoji", emoji: "📱" },
            rich_text: rt(
              "Basemate · Seed 2026 — Access only counts if everyone can reach it. Mission: put Base on a local cell phone in every country. Edit live copy in Site copy & raise; VC pipeline powers Who we're talking to on basemate.app/data-room after sync.",
            ),
          },
        }),
      });
      console.log("Updated Startup Data Room intro callout");
      return;
    }
  }
}

async function main() {
  const pageId = await resolveStartupPageId();
  if (!pageId) {
    console.error(
      "No Startup Data Room page found.\n\n1. Open Startup Data Room in Notion\n2. ⋯ → Connections → add **Basemate**\n3. Copy page URL into .env.local:\n   NOTION_STARTUP_DATA_ROOM_PAGE_ID=https://www.notion.so/...\n4. npm run notion:populate",
    );
    process.exit(1);
  }

  await assertPageAccess(pageId);
  console.log("Startup Data Room:", pageId);

  await patchStartupIntro(pageId);
  const { content, pipeline } = await ensureCmsDatabases(pageId);

  const subpages = await listSubpages(pageId);
  for (const sub of subpages) {
    if (sub.isDatabase) continue;
    const key = Object.keys(PAGE_BLOCKS).find(
      (k) => sub.title.toLowerCase() === k.toLowerCase(),
    );
    if (key) await appendBlocksIfEmpty(sub.id, key, PAGE_BLOCKS[key]);
  }

  for (const [title, blocks] of Object.entries(PAGE_BLOCKS)) {
    if (subpages.some((s) => s.title.toLowerCase() === title.toLowerCase())) continue;
    const res = await notionFetch(token, "/search", {
      method: "POST",
      body: JSON.stringify({ query: title, page_size: 5 }),
    });
    for (const hit of res.results ?? []) {
      if (hit.object !== "page") continue;
      const t = richTextPlain(hit.properties?.title?.title ?? []);
      if (t.toLowerCase() === title.toLowerCase()) {
        await appendBlocksIfEmpty(hit.id, title, blocks);
        break;
      }
    }
  }

  const idsPath = join(__dirname, "..", "docs", "notion-data-room.ids.env");
  writeFileSync(
    idsPath,
    `NOTION_DATA_ROOM_PAGE_ID=${pageId}\nNOTION_CONTENT_DB_ID=${content}\nNOTION_PIPELINE_DB_ID=${pipeline}\n`,
  );
  console.log("\nDone. Wrote", idsPath);
  console.log("Run: npm run notion:sync  (needs DATABASE_URL)");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
