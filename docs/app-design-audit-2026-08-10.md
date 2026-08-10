# `/app` design audit — 2026-08-10

**Target:** `http://localhost:3001/app` (UI preview)  
**Baseline:** [`app-design-baseline.json`](./app-design-baseline.json)

## First impression

The app reads **Basemate on lavender**: electric blue **MarkTile** in the header, white balance hero, normie-friendly spacing. No black letterbox. Goofy×slick balance: boring list chrome, personality in the two marks.

## Scores

| Metric | Grade |
|--------|-------|
| Design Score | B+ |
| AI Slop Score | A |

## Verified fixes (this pass)

- Light lavender shell; removed dark `.app-dashboard` token override
- `MarkTile` / `BubbleMarkTile` (two brand assets only)
- Activity: human headline, one status chip, collapsible Details
- Interest: Moonwell rows in `Stack`
- Clash Display for display type; Geist Mono for row money (`.app-money`)
- Send sheet success: `BubbleMarkTile`
- Bottom nav min-height 44px

## Deferred

- Activity sections by date
- Row slide-in motion (with `prefers-reduced-motion`)
- Full browser `/design-review` screenshot regression (re-run with gstack browse when iterating)

## PR summary

Design: lavender normie `/app`, two-mark brand system, Activity feed cleanup. Design score baseline B+ (preview).
