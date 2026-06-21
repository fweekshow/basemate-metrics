#!/usr/bin/env node
/**
 * Reads latest Dune query result (GET only — no execute).
 * Usage: node --env-file=.env.local scripts/test-bankr-dune.mjs
 */

const queryId = process.env.DUNE_BANKR_LIFETIME_QUERY_ID?.trim() || "7729265";
const apiKey = process.env.DUNE_API_KEY?.trim();

if (!apiKey) {
  console.error("Set DUNE_API_KEY in .env.local");
  process.exit(1);
}

const res = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results`, {
  headers: { "X-Dune-Api-Key": apiKey },
});

const body = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error(`HTTP ${res.status}:`, body.error ?? body);
  if (res.status === 404) {
    console.error(`\nRun the query once: https://dune.com/queries/${queryId}`);
  }
  process.exit(1);
}

const rows = body.result?.rows ?? [];
console.log("state:", body.state ?? "ok");
console.log("rows:", JSON.stringify(rows.slice(0, 3), null, 2));

const row = rows[0];
const volume =
  row?.lifetime_volume_usd ??
  row?.lifetime_volume_usdc ??
  Object.values(row ?? {}).find((v) => typeof v === "number");

console.log(`\nBankr lifetime volume: $${Number(volume ?? 0).toLocaleString()}`);
