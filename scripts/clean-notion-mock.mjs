#!/usr/bin/env node
/** Remove Acme template rows; keep Basemate founding team. */
import {
  listBlockChildrenAll,
  notionFetch,
  queryDatabaseAll,
  richTextPlain,
} from "./notion-http.mjs";

const token = process.env.NOTION_API_KEY?.trim();
if (!token) {
  console.error("NOTION_API_KEY required");
  process.exit(1);
}

const MOCK_NAMES = new Set(
  ["joe anderson", "john smith", "lisa brown"].map((s) => s.toLowerCase()),
);

const TEAM = [
  { name: "Matthew Meakin", role: "CEO" },
  { name: "Risavdeb Petra", role: "CTO" },
  { name: "Aritra Roy", role: "Engineer" },
  { name: "Michael Gale", role: "COO" },
];

const TEAM_DB = process.env.NOTION_FOUNDING_TEAM_DB_ID?.trim() || "7244bfda-9c83-82ab-892e-8177e515cb52";
const TEAMSPACE_HOME =
  process.env.NOTION_TEAMSPACE_HOME_PAGE_ID?.trim() || "27a4bfda-9c83-83a9-bb2f-81fd34007eff";

/** Template “Highlighted Clients” gallery on Sales Strategies & Pipelines */
const HIGHLIGHTED_CLIENTS_DB =
  process.env.NOTION_HIGHLIGHTED_CLIENTS_DB_ID?.trim() || "8854bfda-9c83-82c3-ad2a-81b4f633cd7f";
const SALES_STRATEGIES_PAGE =
  process.env.NOTION_SALES_STRATEGIES_PAGE_ID?.trim() || "d7f4bfda-9c83-8299-8c17-8132f9e13b58";
const VC_PIPELINE_DB =
  process.env.NOTION_PIPELINE_DB_ID?.trim() || "3b84bfda-9c83-81f1-b198-d6b1b18c110d";

const MOCK_CLIENT_NAMES = new Set(
  [
    "bluedove inc.",
    "bluedove",
    "ecothrive",
    "medisure",
    "safehaven security",
    "edusphere",
    "foodiefi",
  ].map((s) => s.toLowerCase()),
);

function rt(text) {
  return [{ type: "text", text: { content: text.slice(0, 2000) } }];
}

async function cleanFoundingTeam() {
  const db = await notionFetch(token, `/databases/${TEAM_DB}`);
  const titleKey = Object.keys(db.properties).find((k) => db.properties[k].type === "title") ?? "Name";
  const roleKey =
    Object.keys(db.properties).find((k) => db.properties[k].type === "multi_select") ??
    Object.keys(db.properties).find((k) => db.properties[k].type === "select") ??
    "Role";

  const pages = await queryDatabaseAll(token, TEAM_DB);
  for (const page of pages) {
    const name = richTextPlain(page.properties?.[titleKey]?.title ?? []).trim();
    if (MOCK_NAMES.has(name.toLowerCase())) {
      await notionFetch(token, `/pages/${page.id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true }),
      });
      console.log("Archived mock:", name);
    }
  }

  const remaining = await queryDatabaseAll(token, TEAM_DB);
  const byName = new Map();
  for (const page of remaining) {
    const name = richTextPlain(page.properties?.[titleKey]?.title ?? "").trim();
    if (name) byName.set(name.toLowerCase(), page.id);
  }

  for (const person of TEAM) {
    const prop = { [titleKey]: { title: rt(person.name) } };
    const roleType = db.properties[roleKey]?.type;
    if (roleType === "multi_select") {
      prop[roleKey] = { multi_select: [{ name: person.role }] };
    } else if (roleType === "select") {
      prop[roleKey] = { select: { name: person.role } };
    }

    if (byName.has(person.name.toLowerCase())) {
      await notionFetch(token, `/pages/${byName.get(person.name.toLowerCase())}`, {
        method: "PATCH",
        body: JSON.stringify({ properties: prop }),
      });
      console.log("Updated:", person.name);
    } else {
      await notionFetch(token, "/pages", {
        method: "POST",
        body: JSON.stringify({
          parent: { type: "database_id", database_id: TEAM_DB },
          properties: prop,
        }),
      });
      console.log("Created:", person.name);
    }
  }
}

async function cleanTeamspaceHome() {
  const blocks = await listBlockChildrenAll(token, TEAMSPACE_HOME);
  for (const block of blocks) {
    const text =
      block.type === "callout"
        ? richTextPlain(block.callout?.rich_text ?? [])
        : block.type === "paragraph"
          ? richTextPlain(block.paragraph?.rich_text ?? "")
          : "";
    if (
      text.includes("Welcome to the team!") ||
      text.includes("Type the @ key to tag a teammate") ||
      text.toLowerCase().includes("notion tip")
    ) {
      await notionFetch(token, `/blocks/${block.id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true }),
      });
    }
  }

  await notionFetch(token, `/blocks/${TEAMSPACE_HOME}/children`, {
    method: "PATCH",
    body: JSON.stringify({
      children: [
        {
          object: "block",
          type: "callout",
          callout: {
            icon: { type: "emoji", emoji: "📱" },
            rich_text: rt(
              "Basemate — put Base on a local cell phone in every country. Stablecoins first, then the full Base stack. Seed 2026 · mateo@basemate.app · Live data room: basemate.app/data-room",
            ),
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: rt(
              "Edit Startup Data Room → Site copy & raise and VC pipeline in Notion, then sync to the site. Slack/email below are for your team — fill in what you use.",
            ),
          },
        },
      ],
    }),
  });
  console.log("Updated Teamspace Home");
}

async function cleanHighlightedClients() {
  const db = await notionFetch(token, `/databases/${HIGHLIGHTED_CLIENTS_DB}`);
  const titleKey =
    Object.keys(db.properties).find((k) => db.properties[k].type === "title") ?? "Name";

  const pages = await queryDatabaseAll(token, HIGHLIGHTED_CLIENTS_DB);
  for (const page of pages) {
    const name = richTextPlain(page.properties?.[titleKey]?.title ?? []).trim();
    const lower = name.toLowerCase();
    const desc = Object.values(page.properties ?? {})
      .filter((p) => p.type === "rich_text")
      .map((p) => richTextPlain(p.rich_text ?? ""))
      .join(" ")
      .toLowerCase();
    const isTemplate =
      MOCK_CLIENT_NAMES.has(lower) ||
      desc.includes("ai-powered drone") ||
      desc.includes("telemedicine") ||
      desc.includes("home chefs");
    if (isTemplate) {
      await notionFetch(token, `/pages/${page.id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true }),
      });
      console.log("Archived template client:", name || page.id);
    }
  }
}

async function refreshSalesStrategiesPage() {
  const pageId = SALES_STRATEGIES_PAGE;
  const blocks = await listBlockChildrenAll(token, pageId);
  for (const block of blocks) {
    if (block.type === "child_database") continue;
    const text =
      block.type === "paragraph"
        ? richTextPlain(block.paragraph?.rich_text ?? [])
        : block.type === "bulleted_list_item"
          ? richTextPlain(block.bulleted_list_item?.rich_text ?? "")
          : "";
    if (
      text.includes("Issuer LOIs tracked") ||
      text.toLowerCase().includes("notion tip") ||
      text.includes("VC pipeline lives in")
    ) {
      await notionFetch(token, `/blocks/${block.id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true }),
      });
    }
  }

  await notionFetch(token, `/blocks/${pageId}/children`, {
    method: "PATCH",
    body: JSON.stringify({
      children: [
        {
          object: "block",
          type: "callout",
          callout: {
            icon: { type: "emoji", emoji: "🤝" },
            rich_text: rt(
              "Seed raise pipeline lives in the database “VC pipeline (Who we're talking to)” on Startup Data Room — not Highlighted Clients. Add VCs there, check Show on site, run notion:sync → basemate.app/data-room.",
            ),
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: rt(
              "Use this page for notes on outreach motion: warm intros, issuer LOIs (target 10), corridor partners. Retire the template “Highlighted Clients” gallery — those were startup-kit placeholders.",
            ),
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: rt("VC conversations → VC pipeline DB (syncs to data room)"),
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: rt("Stablecoin issuer LOIs → track in corridor table on site + your own LOI list here"),
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: rt("Fundraise status → Site copy & raise DB (target, committed, traction)"),
          },
        },
      ],
    }),
  });
  console.log("Updated Sales Strategies & Pipelines page");
}

await cleanFoundingTeam();
await cleanTeamspaceHome();
await cleanHighlightedClients();
await refreshSalesStrategiesPage();
console.log("Notion mock cleanup done.");
