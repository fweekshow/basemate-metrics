#!/usr/bin/env node
/**
 * Create / upsert Issuer & corridor pipeline Notion DB from fallback JSON.
 * Usage: node --env-file=.env.local scripts/seed-notion-issuer-pipeline.mjs
 */
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { extractStablecoinRows } from "./extract-stablecoin-directory.mjs";
import { notionFetch, queryDatabaseAll, propTitle } from "./notion-http.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const token = process.env.NOTION_API_KEY?.trim();
if (!token) {
  console.error("Set NOTION_API_KEY");
  process.exit(1);
}

const STAGE_OPTIONS = [
  "Identified",
  "Contacted",
  "Responded",
  "Meeting",
  "LOI Sent",
  "LOI Signed",
  "Active",
].map((name) => ({ name, color: "default" }));

const REGION_OPTIONS = [
  "Americas",
  "Europe",
  "Africa",
  "Asia-Pacific",
  "Middle East",
  "Global USD",
].map((name) => ({ name, color: "default" }));

function rt(content) {
  return [{ type: "text", text: { content: String(content).slice(0, 2000) } } }];
}

function loadRows() {
  const jsonPath = join(__dirname, "..", "src", "data", "stablecoin-directory.fallback.json");
  try {
    const j = JSON.parse(readFileSync(jsonPath, "utf8"));
    if (j.rows?.length) return j.rows;
  } catch {
    /* generate */
  }
  const html = readFileSync(join(__dirname, "..", "public", "stablecoin-directory.html"), "utf8");
  return extractStablecoinRows(html);
}

function uniqueSelect(names) {
  return [...new Set(names.filter(Boolean))].map((name) => ({
    name: String(name).slice(0, 100),
    color: "default",
  }));
}

async function resolveStartupPageId() {
  const explicit =
    process.env.NOTION_STARTUP_DATA_ROOM_PAGE_ID?.trim() ||
    process.env.NOTION_DATA_ROOM_PAGE_ID?.trim();
  if (explicit) return explicit;

  const res = await notionFetch(token, "/search", {
    method: "POST",
    body: JSON.stringify({ query: "Startup Data Room", page_size: 20 }),
  });
  for (const hit of res.results ?? []) {
    if (hit.object !== "page") continue;
    const title = (hit.properties?.title?.title ?? [])
      .map((t) => t.plain_text ?? "")
      .join("");
    if (title.toLowerCase().includes("startup data room")) return hit.id;
  }
  throw new Error("Startup Data Room page not found — set NOTION_DATA_ROOM_PAGE_ID");
}

async function findIssuerDb(pageId) {
  const search = await notionFetch(token, "/search", {
    method: "POST",
    body: JSON.stringify({ query: "Issuer", page_size: 20 }),
  });
  for (const db of search.results ?? []) {
    if (db.object !== "database") continue;
    const title = (db.title ?? []).map((t) => t.plain_text ?? "").join("");
    if (title.toLowerCase().includes("issuer") && title.toLowerCase().includes("corridor")) {
      return db.id;
    }
  }

  const blocks = await notionFetch(token, `/blocks/${pageId}/children?page_size=100`);
  for (const block of blocks.results ?? []) {
    if (block.type !== "child_database") continue;
    const title = block.child_database?.title ?? "";
    if (title.toLowerCase().includes("issuer") && title.toLowerCase().includes("corridor")) {
      return block.id;
    }
  }
  return null;
}

async function createIssuerDb(parentPageId, rows) {
  const baseOpts = uniqueSelect(rows.map((r) => r.baseStatus));
  const loiOpts = uniqueSelect(rows.map((r) => r.loiTier));

  return notionFetch(token, "/databases", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "page_id", page_id: parentPageId },
      icon: { type: "emoji", emoji: "🌐" },
      title: [{ type: "text", text: { content: "Issuer & corridor pipeline" } }],
      properties: {
        Ticker: { title: {} },
        Region: { select: { options: REGION_OPTIONS } },
        Country: { rich_text: {} },
        Currency: { rich_text: {} },
        Issuer: { rich_text: {} },
        Founder: { rich_text: {} },
        Twitter: { rich_text: {} },
        Contact: { rich_text: {} },
        "Base status": { select: { options: baseOpts.length ? baseOpts : [{ name: "BASE ✓" }] } },
        "LOI tier": { select: { options: loiOpts.length ? loiOpts : [{ name: "TOP 1" }] } },
        Stage: { select: { options: STAGE_OPTIONS } },
        "Confirmed on Base": { checkbox: {} },
        "Show on site": { checkbox: {} },
        Sort: { number: { format: "number" } },
        Notes: { rich_text: {} },
        "Last touch": { date: {} },
      },
    }),
  });
}

function rowProps(row) {
  const props = {
    Ticker: { title: rt(row.ticker) },
    Country: { rich_text: rt(row.country) },
    Currency: { rich_text: rt(row.currency) },
    Issuer: { rich_text: rt(row.issuer) },
    Founder: { rich_text: rt(row.founder) },
    Twitter: { rich_text: rt(row.twitter || row.founderTwitter) },
    Contact: { rich_text: rt(row.contact) },
    Stage: { select: { name: row.stage || "Identified" } },
    "Confirmed on Base": { checkbox: Boolean(row.confirmedOnBase) },
    "Show on site": { checkbox: row.showOnSite !== false },
    Sort: { number: row.sortOrder ?? 0 },
  };
  if (row.region) props.Region = { select: { name: row.region } };
  if (row.baseStatus) props["Base status"] = { select: { name: row.baseStatus.slice(0, 100) } };
  if (row.loiTier) props["LOI tier"] = { select: { name: row.loiTier.slice(0, 100) } };
  return props;
}

async function upsertRows(databaseId, rows) {
  const existing = await queryDatabaseAll(token, databaseId);
  const byKey = new Map();
  for (const page of existing) {
    const t = propTitle(page, "Ticker").trim().toLowerCase();
    const country = (page.properties?.Country?.rich_text ?? [])
      .map((x) => x.plain_text ?? "")
      .join("")
      .toLowerCase();
    byKey.set(`${country}:${t}`, page.id);
  }

  let created = 0;
  let updated = 0;
  for (const row of rows) {
    const key = `${row.country.toLowerCase()}:${row.ticker.toLowerCase()}`;
    const pageId = byKey.get(key);
    const properties = rowProps(row);
    if (pageId) {
      await notionFetch(token, `/pages/${pageId}`, {
        method: "PATCH",
        body: JSON.stringify({ properties }),
      });
      updated += 1;
    } else {
      await notionFetch(token, "/pages", {
        method: "POST",
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties,
        }),
      });
      created += 1;
    }
  }
  return { created, updated };
}

async function main() {
  const rows = loadRows();
  console.log(`Seeding ${rows.length} issuer rows…`);

  const pageId = await resolveStartupPageId();
  let dbId = await findIssuerDb(pageId);
  if (!dbId) {
    const db = await createIssuerDb(pageId, rows);
    dbId = db.id;
    console.log("Created Issuer & corridor pipeline DB:", dbId);
  } else {
    console.log("Issuer DB exists:", dbId);
  }

  const stats = await upsertRows(dbId, rows);
  console.log("Upsert:", stats);

  const idsPath = join(__dirname, "..", "docs", "notion-data-room.ids.env");
  let ids = "";
  try {
    ids = readFileSync(idsPath, "utf8");
  } catch {
    /* new file */
  }
  if (!ids.includes("NOTION_ISSUER_PIPELINE_DB_ID")) {
    appendFileSync(idsPath, `\nNOTION_ISSUER_PIPELINE_DB_ID=${dbId}\n`);
  } else {
    writeFileSync(
      idsPath,
      ids.replace(/NOTION_ISSUER_PIPELINE_DB_ID=.*/g, `NOTION_ISSUER_PIPELINE_DB_ID=${dbId}`),
    );
  }
  console.log("Updated", idsPath);
  console.log("Next: npm run notion:sync");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
