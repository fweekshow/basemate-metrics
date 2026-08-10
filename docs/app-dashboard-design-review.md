# App dashboard design review (send-first home)

**Scope:** `/app` — Home, Activity, Interest, Contacts, Agent.  
**Theme:** Light lavender normie wallet + goofy×slick (see [`app-design-contract.md`](./app-design-contract.md)).

## Executive summary

Send-first structure is in place. **Canonical `/app` look:** lavender canvas `#EAE8F5`, white cards, electric blue `#0505FF` CTAs. Brand = **two marks only** (blue eyes tile + bubble mark), not dark terminal or legacy mate PNGs.

## P0 — Ship bar

| Item | Status |
|------|--------|
| Light lavender `/app` (no `.app-dashboard` dark override) | Done |
| `MarkTile` header + `BubbleMarkTile` empties/success | Done |
| Activity: one headline, one status chip, Details expand | Done |
| Interest: Moonwell USDC + ETH + BTC | Done |
| APY as percent string (not ×100) | Done |

## P1 — Polish

| Item | Notes |
|------|--------|
| Activity date groups (Today / Yesterday) | Optional |
| Send sheet success: bubble mark | Wire in send-sheet |
| Clash Display on `/app` (shared with marketing) | Done |
| Real-session smoke after deploy | — |

## P2 — Elevation

- Subtle row entrance motion (respect `prefers-reduced-motion`)
- Activity filters (All / Sends / Swaps)
- Figma export for founder review if needed

## Preview locally

```bash
# .env.local
APP_UI_PREVIEW=1
NEXT_PUBLIC_APP_UI_PREVIEW=1
npm run dev   # http://localhost:3001/app → Open UI preview
```

## Design pass

Run **`/design-review`** on preview `/app` with scope all five tabs + Send sheet. Baseline stored in [`app-design-baseline.json`](./app-design-baseline.json) and [`app-design-audit-2026-08-10.md`](./app-design-audit-2026-08-10.md).

## Activity data

Feed from `tx_confirmations` + send escrow enrichment (limit 200). Missing trade rows = fix labeling in core at write time.
