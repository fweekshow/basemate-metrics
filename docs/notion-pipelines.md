# Notion pipelines — investment (VC) + issuer (partners)

Both pipelines live under **Startup Data Room** in Notion. One sync job updates Postgres and the public site.

## Surfaces

| Pipeline | Notion database | Postgres table | Public URL |
|----------|-----------------|----------------|------------|
| **Investment (VC)** | VC pipeline (Who we're talking to) | `data_room_pipeline` | [/data-room](/data-room) — Who we're talking to |
| **Issuer / partners** | Issuer & corridor pipeline | `stablecoin_directory_rows` | [/stablecoin-directory](/stablecoin-directory) |

Site copy & raise (hero, traction, raise strip) uses **Site copy & raise** → `data_room_content` on `/data-room`.

## Env (Railway basemate-metrics)

```bash
NOTION_API_KEY=
NOTION_CONTENT_DB_ID=
NOTION_PIPELINE_DB_ID=          # investment / VC
NOTION_ISSUER_PIPELINE_DB_ID=   # issuer directory (optional until seeded)
DATA_ROOM_SYNC_SECRET=
DATABASE_URL=
```

IDs: [docs/notion-data-room.ids.env](./notion-data-room.ids.env) (no secrets).

## One-time: create issuer database

```bash
npm run stablecoin:extract    # refresh src/data/stablecoin-directory.fallback.json from HTML
npm run notion:seed-issuers   # creates DB + rows in Notion (needs NOTION_API_KEY + page access)
```

Or full populate (data room copy + VC DB + sales page text):

```bash
npm run notion:populate
npm run notion:seed-issuers
```

Share **Startup Data Room** with the Basemate integration (Connections).

## Sync

```bash
npm run notion:sync
```

Production cron (same as data room):

```http
POST https://basemate.app/api/cron/notion-data-room
Authorization: Bearer <DATA_ROOM_SYNC_SECRET>
```

Response includes `issuerRows`, `visibleIssuerRows`, `loiSignedCount`.

## Issuer database columns

See [notion-data-room.md](./notion-data-room.md) for VC columns. Issuer DB:

- **Ticker** (title), Region, Country, Currency, Issuer, Founder, Twitter, Contact
- **Base status**, **LOI tier**, **Stage** (Identified → … → LOI Signed → Active)
- **Confirmed on Base**, **Show on site**, Sort, Notes, Last touch

LOI count on the directory header uses rows with Stage **LOI Signed** or **Active** (target 10).

## Fallback

If `NOTION_ISSUER_PIPELINE_DB_ID` is unset or sync never ran, `/stablecoin-directory` uses [src/data/stablecoin-directory.fallback.json](../src/data/stablecoin-directory.fallback.json).

Legacy URL `/stablecoin-directory.html` redirects to `/stablecoin-directory`.

## Team workflow

1. **VCs** — edit Investment pipeline in Notion → sync → `/data-room`.
2. **Issuers** — edit Issuer & corridor pipeline → sync → `/stablecoin-directory`.
3. **Raise copy** — Site copy & raise DB → sync → `/data-room` hero/traction.
