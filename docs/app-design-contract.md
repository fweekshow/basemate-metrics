# Basemate `/app` design contract

**Scope:** Wallet dashboard at `/app` (Home, Activity, Interest, Contacts, Agent).  
**Not in scope:** Marketing site (`/`) — may keep Clash Display / editorial accents.

## North star — goofy × slick

Slick fintech chrome (lavender canvas, feed hierarchy, pill CTAs) plus **two brand marks only** — no legacy full-body mascot set.

| Asset | File | Use |
|-------|------|-----|
| **Blue eyes block** | `public/brand/mascot/mate-eyes-blue.png` on `#0505FF` tile | Header (`MarkTile`), compact brand anchor |
| **Bubble mark** | `public/brand/logo/basemate-mark-transparent.png` | Empty states, success moments (`BubbleMarkTile`) — chat bubble with eyes |

**Do not** use `mate-peace`, `mate-win`, `mate-support`, `mate-rekt`, etc. in `/app`. The logo is the mascot.

## Surface & tokens

- **Canvas:** `#EAE8F5` (`--background`)
- **Cards:** `#FFFFFF`, `--shadow-card`
- **Primary:** `#0505FF`

See [`src/app/app-dashboard.tokens.css`](../src/app/app-dashboard.tokens.css).

## Typography (`/app`)

- **Display / balance / tab titles:** **Clash Display** (`.font-app-display` — same as site `.font-display`)
- **Body:** Geist (`--font-geist-sans`)
- **Row amounts, APY, dates:** Geist Mono (`.app-money`)

## Components

| Name | Role |
|------|------|
| `MarkTile` | Blue squircle + eyes block |
| `BubbleMarkTile` | White squircle + bubble mark |
| `Row` / `Stack` | List surfaces |
| Single status chip per Activity row |

## Litmus

- First screen: **MarkTile** + balance on lavender
- Personality = two marks only, not illustration variants

## Reference

Basemate Design System: `~/.claude/skills/basemate-design/readme.md` (update mascot guidance for product to match two-mark rule).
