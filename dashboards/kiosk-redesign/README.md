# SuPar Home kiosk: three redesign options

Mock-ups for `kiosk-home.html` (the Kiosk Satellite custom page). Each option is one **override stylesheet** that loads
after the page's own styles. It changes colours, type, corners and state treatments only, with no markup or behaviour
changes, so the mock-ups show your real layout and real logic.

| Option | Direction | "On" | Info alert | Urgent | Type | Palette source (ui-ux-pro-max) |
|---|---|---|---|---|---|---|
| 1 Warm Stone | Light first, calm | Soft amber tint + gold icon | White card, amber bar | Red | Plus Jakarta Sans | Home Decoration & Interior |
| 2 Midnight Slate | Dark first, ambient | Warm amber glow | Sky-blue bar | Red | Outfit + Work Sans | Smart Home/IoT Dashboard |
| 3 Indigo Studio | Evolution of today | Solid indigo card | Turmeric tint | Madder | Hind (current) | Ambient deep indigo + your turmeric/madder |

All three fix what the review found in the current page:
- turmeric meant both "on" and "info alert", so the info banner looked like another device that was on
- about 13 tiles were filled turmeric at once, so nothing stood out
- the offset colour block reads as a doubled border at kiosk distance
- "Sorento · Home · 78%" was cut off

Every key text pair is 4.5:1 or better in light and dark.

## Files

| Path | What it is |
|---|---|
| `previews/<option>-light.png`, `-dark.png` | Screenshots at 1280×800 |
| `previews/palettes.png`, `palettes.html` | Palette sheet |
| `snapshots/<option>.html` | Standalone static page (sample data, no scripts needed, opens offline) |
| `themes/<option>.css` | Built theme (fonts embedded). This is what would go into the kiosk |
| `themes/src/` | Theme sources: `_base.css` (shared layer) + one token file per option |
| `harness/` | Simulated Home Assistant (`fake-ha.js`), renderer (`render.cjs`), theme build (`build-themes.py`) |

All states, calendar events and images are sample data from `harness/fake-ha.js`, not a live Home Assistant.

## Rebuild

```
python3 harness/build-themes.py
cd harness && NODE_PATH=$(npm root -g) node render.cjs
```

## Using an option on the tablet

Append the chosen `themes/<option>.css` to `homeassistant/www/kiosk-home/styles.css` (source on the
`claude/gallant-cori-vepkh0` branch), rebuild the single file with `tools/kiosk-home/build-single.mjs` and bump the version.
