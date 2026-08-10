# Notion ↔ basemate.app/data-room

The investor data room reads **Postgres cache tables** populated by Notion sync. Edit in Notion; the site updates after sync (no redeploy for hero, raise strip, traction, or pipeline).

## Notion layout (inside **Startup Data Room**)

| Notion | Site section |
|--------|----------------|
| **Site copy & raise (live on basemate.app)** database | Hero headline/subhead, target, committed, status notes, traction KPIs |
| **VC pipeline (Who we're talking to)** database | “Who we’re talking to” cards |
| Other template pages (Product, IP, …) | Not synced yet — internal only |

### Site copy database columns

- **Field** (title) — fixed keys: `headline`, `subhead`, `target`, `committed`, `status`, `round`, `year`, `traction_users`, `traction_wau`, `traction_messages`, `traction_notional`
- **Value** — text shown on the site
- **Note** — subtitle under raise stats / traction labels

### VC pipeline columns

- **Firm**, **Contact**, **Stage**, **Meeting**, **Tier**, **Notes**
- **Show on site** — check to publish (also shows if stage is `outreach_sent` … `term_sheet`)

## One-time setup

1. [Create a Notion integration](https://www.notion.so/my-integrations) and copy the secret → `NOTION_API_KEY`.
2. **Required:** In Notion, open **Basemate → Startup Data Room** → **⋯ → Connections** → enable **Basemate** (your integration bot). Without this step the API sees zero pages.
3. Copy the Startup Data Room **browser URL** into `.env.local`:
   ```bash
   NOTION_API_KEY=ntn_...
   NOTION_STARTUP_DATA_ROOM_PAGE_ID=https://www.notion.so/Startup-Data-Room-xxxxxxxx
   DATABASE_URL=...
   ```
4. Run:

```bash
npm run notion:populate
```

This fills Product Description, Technology Stack, team, replaces Acme copy, and creates **Site copy & raise** + **VC pipeline** databases.

5. Copy IDs from `docs/notion-data-room.ids.env` + `DATA_ROOM_SYNC_SECRET` into **Railway → basemate-metrics**.

## Sync

**Local (after editing Notion):**

```bash
npm run notion:sync
```

**Production (cron):** `POST https://basemate.app/api/cron/notion-data-room`  
Header: `Authorization: Bearer <DATA_ROOM_SYNC_SECRET>`

Suggested: Railway cron every 15 minutes.

## Fallbacks

- If sync never ran, the site uses `src/lib/investor.ts`.
- If the Notion pipeline database is empty, **Who we’re talking to** falls back to Mate `investor_contacts` (XMTP `/vc` commands).

## Security

- Never commit `NOTION_API_KEY` or `DATA_ROOM_SYNC_SECRET`.
- Rotate the integration secret if it was pasted in chat or logs.
