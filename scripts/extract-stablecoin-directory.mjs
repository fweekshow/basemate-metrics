#!/usr/bin/env node
/**
 * Parse public/stablecoin-directory.html → JSON rows for fallback + Notion seed.
 * Usage: node scripts/extract-stablecoin-directory.mjs [--write]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, "..", "public", "stablecoin-directory.html");
const outPath = join(__dirname, "..", "src", "data", "stablecoin-directory.fallback.json");

const REGION_MAP = {
  americas: "Americas",
  europe: "Europe",
  africa: "Africa",
  "asia-pacific": "Asia-Pacific",
  "middle east": "Middle East",
  "global usd — settlement layer": "Global USD",
  "global usd": "Global USD",
};

function stripTags(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function firstMatch(re, s) {
  const m = s.match(re);
  return m ? m[1].trim() : "";
}

function parseRow(trHtml, region, sortOrder, dim) {
  const flag = firstMatch(/class="flag"[^>]*>([^<]+)/, trHtml);
  const country = firstMatch(/class="cn"[^>]*>([^<]+)/, trHtml);
  const currency = firstMatch(/class="cc"[^>]*>([^<]+)/, trHtml);
  const ticker = firstMatch(/class="tok"[^>]*>([^<]+)/, trHtml) || firstMatch(/<td class="tok">([^<]+)/, trHtml);
  const issuer = firstMatch(/class="iss"[^>]*>([^<]+)/, trHtml);
  const founder = firstMatch(/class="ceo"[^>]*>([^<]+)/, trHtml);
  const founderTw = firstMatch(/class="ceo"[\s\S]*?class="tw-h"[^>]*>([^<]+)/, trHtml);
  const twitter =
    firstMatch(/<td>\s*<span class="tw-h">([^<]+)<\/span>\s*<\/td>/, trHtml) ||
    firstMatch(/class="tw-h"[^>]*>(@[^<]+)/, trHtml);
  const contact = firstMatch(/<td class="em">([^<]+)<\/td>/, trHtml);
  const baseStatus = firstMatch(/class="dot[^"]*"[^>]*>([^<]+)/, trHtml);
  const loiTier =
    firstMatch(/class="pri[^"]*"[^>]*>([^<]+)/, trHtml) ||
    stripTags(firstMatch(/<td>\s*<span class="pri[^>]+>([\s\S]*?)<\/span>/, trHtml));

  if (!ticker) return null;

  const slugBase = `${country || "global"}-${ticker}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const confirmedOnBase = !dim && /BASE ✓|NATIVE ✓|ACTIVE/i.test(baseStatus);

  return {
    rowSlug: slugBase,
    region,
    country: country || (region === "Global USD" ? "US Dollar" : ""),
    currency: currency.replace(/·.*/g, "").trim(),
    ticker: ticker.trim(),
    flag: flag.trim(),
    issuer: issuer.trim(),
    founder: founder.trim(),
    founderTwitter: founderTw.trim(),
    twitter: twitter.trim(),
    contact: contact.trim(),
    baseStatus: baseStatus.trim(),
    loiTier: loiTier.trim(),
    stage: "Identified",
    confirmedOnBase,
    showOnSite: true,
    sortOrder,
  };
}

export function extractStablecoinRows(html) {
  const rows = [];
  let currentRegion = "Americas";
  let sortInRegion = 0;

  const rgRe = /class="rg-l"[^>]*>([^<]+)</gi;
  const parts = html.split(/<div class="rg">/);
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];
    const regionLabel = firstMatch(/class="rg-l"[^>]*>([^<]+)/, chunk).trim();
    const key = regionLabel.toLowerCase();
    currentRegion = REGION_MAP[key] || regionLabel;
    sortInRegion = 0;

    const tbody = firstMatch(/<tbody>([\s\S]*?)<\/tbody>/, chunk);
    if (!tbody) continue;

    const trs = tbody.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    for (const tr of trs) {
      const dim = /\bclass="[^"]*dim\b/.test(tr);
      sortInRegion += 1;
      const row = parseRow(tr, currentRegion, sortInRegion, dim);
      if (row) rows.push(row);
    }
  }

  return rows;
}

const write = process.argv.includes("--write");
const html = readFileSync(htmlPath, "utf8");
const rows = extractStablecoinRows(html);

if (write) {
  writeFileSync(outPath, `${JSON.stringify({ rows, generatedFrom: "public/stablecoin-directory.html" }, null, 2)}\n`);
  console.log(`Wrote ${rows.length} rows → ${outPath}`);
} else {
  console.log(JSON.stringify({ count: rows.length, sample: rows.slice(0, 2) }, null, 2));
}
