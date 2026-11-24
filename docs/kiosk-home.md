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
| `energyhud.js` | The Home Energy HUD for `#energy-dashboard`. Its photos are `/local/images/energy-dashboard-bg1.png` (day) and `energy-dashboard-bg-night.png` (when `sensor.dashboard_night_mode` is on), already on Home Assistant; its fonts, Rajdhani and JetBrains Mono (SIL OFL), are in `fonts/` so nothing loads from Google Fonts |
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
  - Sushen and Paro with place, battery and charging. While a phone charges, the battery turns green and its empty part fills with pale green, fades and starts again; the solid green stays at the real level. Charging comes from `sensor.<name>_phone_battery_status`, or from `sensor.<name>_iphone_battery_state` when that is missing, `unavailable` or `unknown` (set in `PEOPLE` in `config.js`). A state of "charging", in any capitalisation, counts.
  - The family calendar's next three events, live through `calendar/event/subscribe`.
  - Sorento (Kia wordmark) and Bluey (Tesla T mark) with place, battery and charging.
  - Tapping a car opens its pop-up, which updates live while open:
    - photo, place, driving or parked, battery and charging
    - Sorento: charge power, last charge, charger switch, on-road toggle, location
    - Bluey: range, last charge, lock and boot (second tap to confirm), charger
  - Sushen and Paro show their Home Assistant profile pictures.
  - The weather is labelled Griffin.
  - **Hold any light** (Home, the Lights view or the floor plan) for its details: on/off, brightness presets for dimmable lights, and when it last changed.
- **Quick actions**
  - Good Night (second tap to confirm), Festive.
  - Announce: pick speakers, type a message, or start or end quiet hour.
  - Lost Phone: a combination-lock dial beside a keypad (the design in `dashboards/lost-phone-dial.html` on the `claude/serene-davinci-hbi1n3` branch, drawn in block print colours), with the phone choice above the keys. Each digit turns the dial and fills one of four segments. ✓ calls `script.lost_phone` and reads its response: the dial turns green when the alert is sent, and shakes red for a wrong passcode. A hardware keyboard works too (digits, Backspace, Enter). The glass copy has the same dial in its own colours (warm stone dial, amber pointer).
  - WiFi QR.
  - Robbie: a picture of the Roborock Qrevo, start or pause, dock, stop, and the six room-clean buttons, each with an icon for its area (kitchen, TV, sofa, coffee cup, mop, hallway). The picture is a built-in drawing; to use a photo, copy it to `/config/www/` and set `ROBBIE_IMAGE` in `config.js` (for example `/local/robbie.png`).
- **Rooms**
  - The six tiles with the same labels. Tapping one opens that room's view on this page.
  - An open garage prints in madder here too.
- **TV and Aircon**
  - TV: a tap runs `script.media_tv_power`. **Press and hold** for the remote (from the Media TV pop-up's lg-remote-control card): arrows and OK, Back, Home, Menu, the red/green/yellow/blue buttons (`webostv.button`), power (`script.media_tv_power`), mute and volume, channel up/down, previous/play-pause/next, the quick sources Netflix, Prime Video, Stremio and YouTube (`TV_SOURCES` in `config.js`), and a list of every other source the TV reports (`media_player.select_source`). While the TV is off, only power works.
  - Aircon opens a sheet with its HVAC modes and cooler/warmer controls.
- **Lights**
  - The six dynamic slots with the dashboard's replacement rule: favourites that are off give way to lights that are on elsewhere.
  - The count covers all 18 lights in the house, as the navbar badge does.
- **Energy**
  - The same sums: today, sold, bill to date, estimate, the grid/home/solar flow, Tesla and Kia charging (a car that's charging shows a pulsing ⚡ and its row turns green), and self-powered %.
- **Utilities and security**
  - Next bins, washer and dryer.
  - Home Alarm with **Arm home / Arm away / Disarm**. It asks for a code only if the entity has a `code_format`.
  - Garage door: second tap to toggle.
  - Front door: second tap to unlock.
  - Front-door snapshot, refreshed every 10 s and paused while the screensaver is up or the page is hidden. Tapping it opens the live view.
- **Tab bar**
  - Opens the sub-views below (Rooms opens a room picker).
  - **More** opens Phones, Settings, Dev tools and Restart Home Assistant (second tap to restart; a non-admin kiosk user can't restart, and the page says so).
  - The Lights and Security badges are counted the same way as the navbar's. Lights is an ink badge; Security turns madder because an open door needs attention.

### Sub-views (same page, hash routes)

The tab bar and room tiles open the other `master.yaml` views inside the same page, so Kiosk Satellite switches between them without reloading and keeps one Home Assistant connection. To give a view its own Kiosk Satellite entry, use the same path with the hash, e.g. `/local/kiosk-home.html#lights`.

| Route | From | What it has |
|---|---|---|
| `#lights` | Lights | "N of 18 lights on", Evening, Night (two taps), All off (two taps); three room panels with a master switch, every light as a toggle, and a brightness picker (10–100%) on dimmable lights that are on |
| `#homeclimate` | Climate | Average temperature badge, AC off-timer (room, duration, Start, Cancel, running timers); four rooms with room temperature, target −/+ and HVAC modes |
| `#security` | Security | Alarm arm/disarm, garage Open (two taps) / Stop / Close (two taps), front door lock (unlock takes two taps), all seven door sensors, seven camera snapshots, each with the time Home Assistant last updated it (tap for live), patio and backyard motion |
| `#living-room` | Living Room | The floor plan with tappable light buttons (and Aircon, which opens Climate), Robbie controls and the five clean buttons, motion badges |
| `#garage` | Garage | Door open/stop/close, garage light, keep-open, garage camera, sensor chips; Bluey and Kia with location, driving/parked, battery, charging, and their controls (lock and boot take two taps) |
| `#kidsroom` | Kids Rooms | Samar and Shanaya: sensor chips (night light, tall lamp and occupancy toggle), live camera, aircon target and cool/heat/off |
| `#outdoor` | Outdoor | Backyard & Patio, Front (front door, downlight, outdoor lights, driveway, outdoor plug), Side & Laundry |
| `#laundry` | Laundry | Drying advice, water leak and laundry door badges; washer and dryer status, last run, last start, energy and cost, notify toggles, dryer power |
| `#music` | Music | The Music Assistant panel (`/d5369777_music_assistant`, set as `MUSIC_PANEL` in `config.js`) embedded under the tab bar, plus an Open full screen button |
| `#energy-dashboard` | Energy | The Home Energy HUD, drawn in the page (`energyhud.js`, a port of the button-card "Home Energy" view): the house photo with glass cards for grid, today, billing, solar, home, Tesla and Kia, live flows and the weather and tariff. Taps open the page's own details pop-up; the Home card and the HOME button go back to Home. Opened by tapping the Energy card on Home (or Enter on it); it has no tab of its own |

Differences from the Lovelace sub-views, on purpose or because the source isn't in the repo:

- **No history graphs** on Climate: the page shows the current room temperature instead of the 12-hour line.
- **Music** shows the Music Assistant panel itself rather than the dashboard's third-party music card. It uses a same-origin path, so no IP address is stored in the page.
- **Live camera view** always streams the camera entity the pop-up is for. The Home card shows `camera.front_door_snapshot_2`, but its pop-up streams `camera.front_door_live_view_2`. It follows Home Assistant's own camera dialog:
  1. It asks the camera which live formats it supports (`camera/capabilities`).
  2. It plays WebRTC if offered (`camera/webrtc/offer` with ICE candidates), otherwise HLS (`camera/stream`, played with hls.js). Arlo cameras can take 10 to 20 seconds to start.
  3. If no live format works, it shows the latest image with Home Assistant's reason printed on it, for example `HLS: start_stream_failed: …`. That text, or the matching `kiosk-home: no live view …` console line in the KS remote admin, says why.
  4. The pop-up resizes to the camera's own resolution, as large as the screen allows, so a square or wide camera fills the frame without black bars. This applies to every camera pop-up (Home, Security, Garage and Kids Rooms). A red **LIVE · HLS** or **LIVE · WebRTC** badge in the corner confirms you're watching live video, not the last recording.

  hls.js 1.7.4 (Apache-2.0) is in `vendor/`. It's loaded only when a camera pop-up opens; in the single-file build it's embedded as inert base64 text. Closing the pop-up closes the WebRTC connection or HLS player.
- **Garage door and washer/dryer cards** are third-party too. The page uses the same entities from their config, with plain controls.
- Two things in `master.yaml` look like typos and are copied as they are: Outdoor reads `binary_sensor.patio_door` (the navbar uses `binary_sensor.patio_door_contact`), and the dryer's notify toggle points at `automation.washing_machine_finished_announcement`.

Differences from the Lovelace view, on purpose:

- The always-hidden alert ticker card is left out (the banner covers the same alerts).
- The bins tile is always visible. The dashboard shows it only on Sundays and Mondays.
- The Festive action is always visible. The dashboard limits it to a date window.
- **Bins (best effort):** the wheelie-bin sensors aren't defined in this repo. The page accepts days, dates or "Today"/"Tomorrow", and picks the soonest collection. Check it on the tablet.

## Look and motion

- **Weather and time of day:** the clock card shows a printed weather picture. The page background takes on a faint dawn, dusk or night tint from `sun.sun`.
- **Calendar:** today's date stamp is turmeric.
- **Moving only when something is happening:**
  - Energy flow lines march in the direction power is moving: yellow while solar is going to the home or out to the grid, purple while power comes in from the grid, grey when idle.
  - Robbie, washer and dryer icons turn while they run.
  - An urgent alert's colour drifts slightly.
  - The clock stamps on the minute.
  - Views fade in.
- **Kept light on the tablet:**
  - Everything moving is transform/opacity only, so it runs on the GPU.
  - Animations pause under the screensaver or when the page is hidden, and are off with reduced motion.
  - The energy HUD keeps its moving parts (flow dots, ring dashes) on a separate transparent layer and steps them at 16 and 4 updates a second, so the photo, frosted glass and text aren't repainted each frame. It only runs while the view is open.
  - Measured with Playwright on a 4× throttled CPU, with one live state change a second:
    - every view holds 61 fps
    - Lights and Security do no layout or style work while idle
    - Home does one layout per real update, plus about 3 style recalculations a second for the running animations

## Glass version (`kiosk-home-glass`)

A second copy of the page in the **Warm Stone Glass** design (`dashboards/kiosk-redesign/DESIGN.md`): frosted cards over a warm backdrop, Plus Jakarta Sans, amber for devices that are on, an amber stripe for info banners and red for alerts, with a matching dark mode. Install it next to `kiosk-home`, so you can switch between them in Kiosk Satellite:

| | Block print | Glass |
|---|---|---|
| Folder | `www/kiosk-home/` | `www/kiosk-home-glass/` |
| Single file | `www/kiosk-home.html` | `www/kiosk-home-glass.html` |
| Kiosk Satellite URL | `/local/kiosk-home.html` | `/local/kiosk-home-glass.html` |
| Build the single file | `node tools/kiosk-home/build-single.mjs` | `node tools/kiosk-home/build-single.mjs --name kiosk-home-glass` |
| Bump the version | `--dir homeassistant/www/kiosk-home` | `--dir homeassistant/www/kiosk-home-glass` |

It does everything the block print page does, and also:
- **Hallway door at night.** It raises a banner alert, as the patio and laundry doors do, and can be snoozed.
- **Long tile names scroll.** Names too long for their tile, such as "Bedroom Downlights", scroll gently instead of being cut off. Only names that don't fit move, and they stop with reduced motion or under the screensaver.
- **One date stamp per day.** The family calendar shows each day's stamp once, so two events on the same day sit under one stamp.
- **Clearer buttons and spacing.** Arm home and Arm away have a solid fill and edge, and the alarm, garage and front door cards are spaced further apart.
- **Kids Rooms.** One compact row of sensor chips, and both cameras the same, larger size.
- **Performance.** Frosted glass (`backdrop-filter`) is the costliest effect: a blurred card is redrawn every frame something behind or inside it moves. On Home only the clock, calendar and alarm cards are blurred; the rest get a denser fill. With that, Home holds 61 fps on a 4× throttled CPU, and the sub-views keep full glass. If the tablet still lags, lower `--glass-blur` or remove the blur (see `prefers-reduced-transparency` in its `styles.css`).

Changes to one copy aren't made to the other automatically: if a fix belongs in both, apply it to both folders and rebuild both files.

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
- [ ] **Lost Phone:** the right passcode rings the phone; a wrong one turns the dial red and says "Access denied: wrong passcode".
- [ ] **Bins:** the tile shows the right next collection. If it doesn't, tell me what the sensor states look like.
- [ ] **Theme:** switching KS between light and dark restyles the page without a reload.
- [ ] **Room tiles and tabs:** they open the right Lovelace views.
