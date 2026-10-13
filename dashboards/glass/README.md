# Glass mockups

Open `index.html`. All styling is `var(--glass-*)` from `tokens.css`, the same names the Home Assistant theme will use.

| File | What |
|---|---|
| `tokens.css` | Light + dark tokens (colour, glass, radius, shadow, spacing, type, motion), `data-lite` = Glass Lite |
| `components.css` | Card (blur 24), elevated (blur 32), inset tile (no blur), states, type, motion |
| `www/wallpaper-*.svg` | Wallpapers (will be served from `/local/glass/`) |
| `fonts/` | Geist variable font, SIL OFL (licence included) |
| `theme.js` | Mock-only: icon sprite, theme / Lite / no-filter / reduced-motion toggles, stage scaling |
| `contrast.py` | WCAG check of the tokens over the real wallpapers (`python3 -I contrast.py wall-light.png wall-dark.png`) |
| `shoot.mjs` | Renders `previews/*.png` |

Toolbar toggles: **Glass Lite** (no blur), **No backdrop-filter** (solid fallback), **Reduced motion**.
Contrast result: every body-text pair is at least 4.5:1 in both modes (worst case: weakest glass over the darkest light region / strongest glass over the lightest dark region).
