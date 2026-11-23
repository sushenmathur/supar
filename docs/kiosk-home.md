# SuPar Home: block print kiosk page (`kiosk-home`)

A live version of your Home dashboard, built as a hand-made page for the kitchen tablet. It runs in Kiosk Satellite's **Custom Pages** and uses the block print design (option 2 in `dashboards/home-2026/`). It shows everything on today's `hubhome` view, wired to the same entities with the same rules, and talks to Home Assistant over its websocket API. Nothing in your Lovelace config changes.

It's a test page that sits beside your dashboard, and it can be removed in one step (see **Rollback**).

## Files

All page files live in `homeassistant/www/kiosk-home/` and get copied to `/config/www/kiosk-home/`.

| File | What it is |
|---|---|
| `index.html` | Page shell (fixed 1280×800 design, scaled to the screen inside the KS insets) |
| `app.js` | Connection, rendering, actions, sheets (Announce, Lost Phone, WiFi, Robbie, Aircon, camera, alarm code) |
| `home.js` | Pure ports of each card's logic: alert banner, room labels, light slots, energy, washer/dryer, Robbie, bins, alarm, front door |
| `config.js` | Every entity ID, light list, room list and navigation route, taken from `master.yaml` |
| `state.js` | State-diff and small helpers |
| `connection.js` | KS shared connection, or the browser's HA session (same as kiosk-test) |
| `icons.js`, `styles.css`, `fonts/` | Icons, block print styling and self-hosted Hind |
| `vendor/haws.mjs` | home-assistant-js-websocket 9.8.1 (same build as kiosk-test) |

Tests live in `tests/kiosk-home/` and run with `node --test tests/kiosk-home`.

## What it shows and does

Parity with `hubhome` (behaviour map taken from `master.yaml`):

- **Alert banner**
  - Same alerts, priorities and wording, with the same buttons: Close door, Keep garage open, Keep side open, Snooze 30 min and End quiet hour.
  - When there's nothing to report it shows a calm "All clear" strip instead of disappearing, so the layout doesn't jump.
  - Close door needs a second tap.
- **Day column**
  - Greeting, date, clock, weather and the India/Austin clocks.
  - Sushen and Paro with place, battery and charging.
  - The family calendar's next three events, live through `calendar/event/subscribe`.
  - Sorento and Bluey with place, battery and charging.
- **Quick actions**
  - Good Night (second tap to confirm), Festive.
  - Announce: pick speakers, type a message, or start or end quiet hour.
  - Lost Phone: the 4-digit keypad and phone choice. It calls `script.lost_phone` and reads its response.
  - WiFi QR.
  - Robbie: start or pause, dock, stop, and the six room-clean buttons.
- **Rooms**
  - The six tiles with the same labels. Tapping one opens that Lovelace view.
  - An open garage prints in madder here too.
- **TV and Aircon**
  - TV runs `script.media_tv_power`.
  - Aircon opens a sheet with its HVAC modes and cooler/warmer controls.
- **Lights**
  - The six dynamic slots with the dashboard's replacement rule: favourites that are off give way to lights that are on elsewhere.
  - The count covers all 18 lights in the house, as the navbar badge does.
- **Energy**
  - The same sums: today, sold, bill to date, estimate, the grid/home/solar flow, Tesla and Kia charging, and self-powered %.
- **Utilities and security**
  - Next bins, washer and dryer.
  - Home Alarm with **Arm home / Arm away / Disarm**. It asks for a code only if the entity has a `code_format`.
  - Garage door: second tap to toggle.
  - Front door: second tap to unlock.
  - Front-door snapshot, refreshed every 10 s and paused while the screensaver is up or the page is hidden. Tapping it opens the live view.
- **Tab bar**
  - Links to the existing Rooms, Lights, Climate, Security and Music views.
  - **More** opens Phones, Settings, Dev tools and Restart Home Assistant (second tap to restart; a non-admin kiosk user can't restart, and the page says so).
  - The Lights and Security badges are counted the same way as the navbar's. Lights is an ink badge; Security turns madder because an open door needs attention.

Differences from the Lovelace view, on purpose:

- The always-hidden alert ticker card is left out (the banner covers the same alerts).
- The bins tile is always visible. The dashboard shows it only on Sundays and Mondays.
- The Festive action is always visible. The dashboard limits it to a date window.
- **Bins (best effort):** the wheelie-bin sensors aren't defined in this repo. The page accepts days, dates or "Today"/"Tomorrow", and picks the soonest collection. Check it on the tablet.

## Deploy

1. Copy `homeassistant/www/kiosk-home/` (with `vendor/` and `fonts/`) to `/config/www/kiosk-home/`.
2. If `/config/www` didn't exist before, restart Home Assistant once.
3. Check it in a browser where you're signed in to HA: `http://<your-ha>/local/kiosk-home/index.html`.

### Single-file option (File editor upload)

The HA File editor uploads files, not folders. For that case there's a one-file build of the same page, `homeassistant/www/kiosk-home.html`, with scripts, styles and fonts inlined (about 120 KB).

1. In the File editor, open the `www` folder (create it if it isn't there) and upload `kiosk-home.html`.
2. Use the path `/local/kiosk-home.html` in Kiosk Satellite instead of `/local/kiosk-home/index.html`.

To update it, re-upload the file over the old one. To rebuild it after changing the page, run:

```bash
node tools/kiosk-home/build-single.mjs
```

Commit the result. The same 23 browser checks pass against the single file.

## Kiosk Satellite setup

1. **Settings › Home Assistant › Custom Pages** → turn on **Share Home Assistant connection** (already on if kiosk-test works).
2. **Add page:** name **SuPar Home (block print)**, path `/local/kiosk-home/index.html`, then **Save & Validate**.
3. Pick it from the dashboard picker to try it. Don't make it the default dashboard until you're happy with it.

The page acts as the kiosk token's HA user, so the same advice as kiosk-test applies: use a non-admin user.

## Updating

After changing any page file:

```bash
node tools/kiosk-test/bump-version.mjs --dir homeassistant/www/kiosk-home
```

Then copy the folder again. Kiosk Satellite always loads fresh. A normal browser needs one reload.

## Debugging and rollback

- The console logs `kiosk-home loaded v<n>` once per load, and a summary line (`N entities via kiosk-satellite`). It also logs short error codes when a service call fails. It never logs attributes or URLs.
- **Rollback:** delete `/config/www/kiosk-home/` (or `/config/www/kiosk-home.html`) and remove the custom page entry in Kiosk Satellite.

## Checked before handing over

- Unit tests (`node --test tests/kiosk-home`).
- A scripted Chromium run against a mock Home Assistant with these entity IDs:
  - light toggle
  - two-tap garage close, which updates the banner and the room tile
  - arm and disarm
  - two-tap unlock and its 3 s timeout
  - Announce sequence
  - Lost Phone with a wrong and then a right passcode
  - Aircon target change
  - an external door change repainting the page
  - camera refresh
  - KS sharing on and off
  - no-session message
- It hasn't been run against your real Home Assistant yet.

## Manual checklist (on the tablet)

- [ ] **KS, sharing on:** the page loads with your real data. The clock, weather and people are correct.
- [ ] **Lights:** tapping a light changes it within about 1 s. A light switched elsewhere shows up within about 1 s.
- [ ] **Garage:** opening it raises the banner. Close door needs two taps and closes it.
- [ ] **Alarm:** arm home, then disarm (a code prompt appears only if your alarm needs one).
- [ ] **Announce:** a test message plays on the chosen speaker.
- [ ] **Lost Phone:** the right passcode rings the phone; a wrong one says "Wrong passcode".
- [ ] **Bins:** the tile shows the right next collection. If it doesn't, tell me what the sensor states look like.
- [ ] **Theme:** switching KS between light and dark restyles the page without a reload.
- [ ] **Room tiles and tabs:** they open the right Lovelace views.
