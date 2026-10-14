# Home Assistant dashboard (Quiet Glass)

Wall-panel dashboard for a Lenovo Idea Tab Pro 12.7" (16:10, landscape, viewed from 0.5–2 m). Calm by default: neutral flat cards, colour only when something is on or wrong, glass only on layered surfaces (navbar, pop-ups, scrim).

**`dashboard/master.yaml` is the single source of truth.** It is the complete raw dashboard configuration: 8 button-card templates (`qg_*`), the navbar template, the Home view, eight other views and the screensaver.
Edit this file (or paste the live raw config back over it), never a copy. Every colour, radius, size, shadow and duration is a CSS variable from `themes/glass.yaml`; `master.yaml` contains no hex or rgba literals and `validate.py` enforces that.

| File | What it is |
|---|---|
| `dashboard/master.yaml` | Complete raw dashboard configuration (master) |
| `dashboard/validate.py` | Checks YAML, JavaScript blocks, templates, token use, literals, type/radius scale, contrast, card budget and the "Everything's calm" rule |
| `dashboard/alert-snooze-helper.yaml` | Helper for the alert snooze toggle (unchanged) |
| `themes/glass.yaml` | Themes `Glass` (light and dark, follows the system) and `Glass Saver` (always near-black) |
| `www/quiet-glass-fonts.js`, `www/install-fonts.sh` | Loads Inter (400/500/600); falls back to system-ui if absent |
| `_archive/` | The previous `master.yaml` and `glass.yaml` (rollback) and the old paste-in fragments |
| `../docs/redesign-audit.md` | Card-by-card audit (KEEP / MOVE / MERGE / DROP), reachability, acceptance results |
| `../docs/redesign-followups.md` | Automations and device settings this design needs, assumptions, first-run checklist |
| `../dashboards/redesign-quiet-glass.html` | Static 1280 × 800 mock-up (light/dark; scenes calm, busy, room pop-up, energy pop-up, saver) |

## Install

1. **Fonts.** On the Home Assistant host run `sh homeassistant/www/install-fonts.sh /config/www` (downloads Inter, SIL Open Font License, into `/config/www/fonts/` and copies the loader). Then Settings > Dashboards > Resources > add `/local/quiet-glass-fonts.js` as a **JavaScript module**. Skip this and the dashboard simply uses the system font.
2. **Theme.** Copy `themes/glass.yaml` to `/config/themes/glass.yaml` (needs `frontend: themes: !include_dir_merge_named themes` in `configuration.yaml`). Developer tools > YAML > **Reload themes**. On the tablet's profile choose Theme **Glass** and Dark mode **Auto**. Auto follows the device, so set the tablet's own dark schedule (Android Settings > Display > Dark theme > Schedule > sunset to sunrise): that is what turns night mode on.
3. **Cards (HACS).** Needed: button-card, navbar-card, browser_mod, kiosk-mode, advanced-camera-card, garage-card, washing-machine-card, wheelie-bin-card, alert-ticker-card, calendar-card-pro, clock-weather-card, homeii-music-flow. **No longer needed by this dashboard:** card-mod and the mushroom cards.
4. **Dashboard.** Settings > Dashboards > Add dashboard > New dashboard from scratch, title "Home 2.0", URL **`home-2-0`** (all internal links use `/home-2-0/...`; Home is `/home-2-0/hubhome`, so it runs beside the existing `dashboard-hub`). Then open it > pencil > three dots > *Raw configuration editor* > select all > paste `master.yaml` > save.
5. **Kiosk.** `master.yaml` already carries `kiosk_mode` for user `suparhome` (header and sidebar hidden), so no extra step. For another user add them to `kiosk_mode: user_settings`.
6. **Hard refresh** so the new theme and resources load: in a browser Ctrl+Shift+R; in the companion app clear the frontend cache (Settings > Companion app > Debugging or Troubleshooting, the name varies by version) or force-stop and reopen. After a later theme edit, Reload themes and refresh again.
7. **Automations the design relies on** (screensaver trigger, brightness, doorbell pop-up) are not included: see `../docs/redesign-followups.md`.

## Keeping the master current

After changing the dashboard in Home Assistant, copy the raw config back into `dashboard/master.yaml`, run `python3 homeassistant/dashboard/validate.py`, then commit. The checks fail on a hex or rgba literal, a literal px or ms size, an undefined template or token, more than 2 radii, 6 font sizes or one font family, low contrast in the theme, more than ~35 Home cards at rest, or a "calm" rule that disagrees with the Now items.

## Rolling back

Paste `_archive/master.yaml` into the raw editor and copy `_archive/glass.yaml` over `/config/themes/glass.yaml`, then Reload themes and refresh.

## Mock-up

`python3 dashboards/build-quiet-glass.py` rebuilds the mock-up from the theme tokens; `dashboards/shoot-quiet-glass.sh` writes the PNGs to `dashboards/previews/redesign-quiet-glass-*.png` (headless Chromium, 1280 × 800).

## Notes

- Background: one subtle two-stop gradient per mode, set by the theme (`lovelace-background`). Views set no background image.
- Not run against a live instance. Checks so far: YAML validity, JavaScript syntax, template and token references, contrast, the calm-rule simulation and the Chromium render of the mock-up. See the checklist in `../docs/redesign-followups.md`.
