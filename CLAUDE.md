@AGENTS.md

## Design System

This project uses the **Basemate Design System**. Before building any UI, read the design rules in `~/.claude/skills/basemate-design/readme.md`.

Invoke `/basemate-design` when designing or building any visual component, page, or asset.

Key rules (memorize these):
- **Dark-first** — near-black canvas `#00040A`, electric blue `#0505FF` (primary), neon green `#19FB44` (win/long/PnL-up), red `#FF4D67` (loss/short)
- **Fonts** — Space Grotesk (display/headlines), Geist (UI/body), Geist Mono (tickers, %, prices, addresses)
- **Shape** — pill buttons only (never rectangles), squircle cards (`--radius-lg` 20px), chat bubbles (`--radius-bubble` 22px)
- **Mascots** live in `public/brand/mascot/` — `mate-win-buff.png` (win), `mate-peace.png` (gm), `mate-support.png`, `mate-rekt.png`. Use with white tile container on dark bg.
- **Logo** — `public/brand/logo/basemate-logo-flat.png` for nav/UI, `basemate-mark.png` for circular avatar
- **Voice** — sharp friend in the chat, second person "you", first person "I", no AI disclaimers, one action one win
- **Never invent** contract addresses or tickers — examples only: ETH, USDC, YUKI, ATBASH
