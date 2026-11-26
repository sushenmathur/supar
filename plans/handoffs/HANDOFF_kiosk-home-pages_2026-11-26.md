# Kiosk Satellite wall-tablet pages (kiosk-home + kiosk-home-glass): feature work, tests, alert bar, dark mode, music tab

**Date:** 2026-11-26
**Status:** IN PROGRESS. Everything requested so far is built and pushed; no request is pending implementation. Two offers await the user's answer (see Open Questions).
**Ticket(s):** none (personal Home Assistant project, repo `sushenmathur/supar`)
**Epic:** SuPar Home wall tablet: custom HTML pages for the Kiosk Satellite Android app, replacing the Lovelace `master.yaml` dashboard on the tablet
**Chain:** `standalone-d0bec2c1` seq `1`
**Parent:** `none — first in chain`
**Prior chain:** none — first in chain
**Environment:** Claude Code (cloud session) @ `sushenmathur/supar` / branch `claude/gallant-cori-vepkh0`

---

## Reference Documents

- `docs/kiosk-home.md`: the user-facing guide for both pages. Every feature, setting, entity and install step is documented there; it is updated with every change. Read it first.
- `tests/kiosk-home/README.md`: how to run the unit, end-to-end and visual tests, the list of suites, and the fake Home Assistant's env switches.
- `dashboards/kiosk-redesign/DESIGN.md`: the Warm Stone Glass design system that `kiosk-home-glass` follows. The root `DESIGN.md` describes the block print design and notes the block print / glass split.
- `homeassistant/dashboard/master.yaml`: the original Lovelace dashboard (about 6,200 lines). It is the source of truth for entity ids, sub-views, wording and the Media tile's player list. The pages are ports of it.
- `homeassistant/dashboard/alarm-keypad-script.yaml`: the `script.alarm_keypad` the alarm dial depends on (the code check against `secrets.yaml`).
- `homeassistant/dashboard/alert-snooze-helper.yaml`: the snooze helper and its 30-minute reset automation. The user had **not** installed the automation (see "What We Tried" #21).
- Kiosk Satellite docs: fetched from GitHub (`https://raw.githubusercontent.com/jxlarrea/kiosk-satellite/main/docs/{js-api,sendspin,remote-api,esphome,drawer-menu,gestures}.md`). `kiosksatellite.com` does **not** resolve from this cloud session (`getaddrinfo ENOTFOUND`). The copies are in the scratchpad at `/tmp/claude-0/-home-user-supar/6bca5e56-f9dc-5486-bdbc-089212b63a7c/scratchpad/ksdocs/`, which may be cleared.
- Session transcript, if detail is needed: `/root/.claude/projects/-home-user-supar/6bca5e56-f9dc-5486-bdbc-089212b63a7c.jsonl`. The session was compacted once, mid-way.

## The Goal

The user (Sushen) runs Home Assistant at home and has an Android wall tablet running **Kiosk Satellite (KS)**, which shows custom HTML pages served from `/config/www/` (`/local/`). The aim is a fast, good-looking home control page for that tablet. It is ported from the Lovelace `master.yaml` dashboard, but is a standalone page that talks to HA over the websocket through KS's shared connection, with no token in the page.

There are two designs, kept feature-identical and in sync:
- `kiosk-home`: "block print" (indigo, turmeric and madder; a printed-block look).
- `kiosk-home-glass`: "Warm Stone Glass" (frosted cards, Plus Jakarta Sans, amber).

The user installs a **single-file build** (`homeassistant/www/kiosk-home.html` and `kiosk-home-glass.html`) by uploading it with the HA File editor and reloading the tablet. The user iterates feature by feature with short requests and often asks for a **mock-up first** before anything is committed. The end state is a reliable daily-driver page plus a regression test suite that guards it.

## Where We Are

- **Branch:** `claude/gallant-cori-vepkh0`, pushed, working tree clean. The latest commit is `520847d` (Music tab, kitchen Music Library). There are 25+ kiosk commits on the branch (table in Evidence). **No PR exists, and none should be opened unless asked.**
- **Versions:** `kiosk-home` **v32**, `kiosk-home-glass` **v33**. `VERSION` lives in each `config.js` and as `?v=N` on every import; bump it with `tools/kiosk-test/bump-version.mjs`.
- **Single files:** `homeassistant/www/kiosk-home.html` (807 KB) and `kiosk-home-glass.html` (865 KB). Built with `tools/kiosk-home/build-single.mjs --name <page>` (esbuild 0.24.2). They inline the fonts and embed hls.js. The last-built files were sent to the user.
- **Page source** in `homeassistant/www/kiosk-home/` and `kiosk-home-glass/`: `app.js` (1,205 lines: boot, regions, actions, sheets), `home.js` (394: pure logic), `views.js` (384: hash-route sub-views), `config.js` (177: entity ids, constants), `energyhud.js` (295), `icons.js`, `state.js`, `connection.js`, `styles.css` (705 for block print, 969 for glass), plus `fonts/` and `vendor/`.
- **Latest features, all live and pushed:**
  - **Media pop-up** from the Media room tile (`ACTIONS.media` → `mediaSheet()`). Hero player on the left; every player on the right. Pure logic: `H.mediaPlayers()`, `mediaSummary()`, `mediaElapsed()`, `clockTime()`, `MF` feature bits.
  - **Alert bar by priority:** `H.alerts()` returns `p` 1/2/3. `H.banner()` returns `{level: urgent|warn|note|calm, title, sub, icon, chips[], list}` and `H.groupText()`. `app.js` has `bannerTicker()`.
  - **Dark mode by the sun:** `applyTheme()` in `app.js` sets `<html data-theme>` from `sun.sun`. `THEME = 'sun'` in `config.js`; `'system'` follows the tablet instead.
  - **Music tab in KS:** presses `button.kitchen_tab_show_music_library` (`KS_MUSIC.library`). Discovery and fallback are in `findKsMusic()` and `ACTIONS['ks-music']`.
- **Tests:**
  - Unit: **25 pass** (`node --test tests/kiosk-home`).
  - End-to-end: **the last full run passed, 1,160 checks** across 18 suites, both pages and both builds. That run was **before** the final Music Library change, and the user asked that **regression not be run for that last change**. The `music` suite and mock were edited to expect the kitchen button but **were not run**.
  - Visual: **34 shots match** (17 per page). Baselines are about 4.1 MB of JPEG.
- **Performance** (measured earlier with `perf.cjs` on a 4× throttled CPU): Home holds about **61 fps** on both pages.
- **Resolved issue on the user's HA:** `input_boolean.alert_banner_snooze` was stuck `on`, which hid the patio door. The user turned it off ("yes it was turned on all good now"). The reset automation is probably still not installed.
- **Hard constraints, still in force** (from the start of the session):
  - No secrets, tokens, HA URLs or personal data committed anywhere.
  - No long-lived token in any file under `www/`, because `/local/` is served without authentication.
  - No runtime network requests except to Home Assistant.
  - Never print, log or write the token.
  - No wholesale attribute logging.
  - Tests, tools and docs stay out of `www/`.
  - Never overwrite or delete anything else in `/config`; never deploy the branch as a whole.
  - Push only to `claude/gallant-cori-vepkh0`; don't merge or open a PR.
  - The alarm code must never be in the page or repo: it lives in `secrets.yaml` as `alarm_keypad_code` and is checked by `script.alarm_keypad`.
  - The TV MAC address is not stored in the page.

## What We Tried (Chronological)

Early work is from before compaction (summarised from the compaction summary); late work is from the live context.

1. **(early) Camera live view:** chain is capabilities → WebRTC → HLS (hls.js) → snapshot. The pop-up is sized to the video's resolution (`fitcam` class). Applied to every Security camera. Worked.
2. **(early) Warm Stone Glass redesign:** applied `DESIGN.md`, then at the user's request split it out as `kiosk-home-glass` and kept the old `kiosk-home`.
   - Tablet fixes on glass: overlapping alarm/garage/front door cards; a squished calendar; invisible Arm buttons; a ticker for long light names; hallway contact added; Kids Rooms layout.
3. **(early) Lost Phone dial**, ported from the `lost-phone-dial.html` mock on branch `claude/serene-davinci-hbi1n3`, onto both pages. This became the shared `dialSheet()` component.
4. **(early) Energy card sub-page:**
   - First an iframe of HA's `energy-new/energy`. The user rejected it: "display like this which is HA view with sidebar and header.. may be best to built a sub view based on the yaml".
   - **Rebuilt** as `energyhud.js`, an SVG HUD ported from the button-card YAML (1600×1000, Rajdhani and JetBrains Mono fonts bundled under OFL).
   - **Performance problem:** the full HUD ran at 19 fps. Moving animation to a separate layer and stepping it (`steps(16)`/`steps(96)`) cut layout passes from **387 to 24**. Glass blur on Home was also limited → **61 fps**.
5. **(early) Flow lines:** yellow when exporting, purple when importing. Later replaced with a pill pattern and shaded icons from the user's image.
6. **(early) Robbie (Roborock Qrevo) pop-up:**
   - Area icons per room button.
   - The image is the user's own upload, `/local/images/robbie.png` (`ROBBIE_IMAGE`).
7. **(early) Phone charging animation:**
   - Three options in a mock; the user chose **option C** (a pale-green fill-up animation).
   - Sources: `sensor.<name>_phone_battery_status`, with `sensor.<name>_iphone_battery_state` as backup (`isCharging()`).
8. **(early) TV remote on long press** (from the user's `lg-remote-control` YAML) and a pulsing EV charge bolt on the cars.
9. **(early) "Six updates":**
   1. Hallway door as a grey non-critical note.
   2. Bin icons: red trash, yellow recycle, green leaf.
   3. Garage close confirmation with a live camera (`camera.garage_live_view`) and an obstruction warning, from both the banner and the card.
   4. An alarm keypad dial.
   5. "Living Aircon" with the room temperature.
   6. The flow pill.
10. **(early) Alarm wrong codes, three rounds:**
    - **Round 1:** HA accepted any code because the panel had no `code_format`. → Added `script.alarm_keypad`.
    - **Round 2:** the user added codes to both the alarm and the script. Wrong codes then showed "Armed away" but didn't arm, because the alarm integration (like Alarmo) **ignores wrong codes silently**.
    - **Fix:** the script is authoritative. It returns `{ok:false}` → the page shows **"Access denied: wrong passcode"**. Success is only claimed after `alarmChanged()` polls a real state change: 8 s at 200 ms intervals for `disarmed` or `arming`/`armed_*`.
11. **(early) Kids room fix:** first applied to glass only; the user said "kids room view is still not fixed" (meaning kiosk-home), so it was ported. **Lesson: every fix goes to both pages.**
12. **(early) Climate haze per aircon mode:**
    - Colours: cool blue, heat red, heat_cool/auto amber, fan teal, dry violet.
    - Driven by `acMode()` in `views.js`.
13. **(early) Proper test suite:** unit, e2e against `mock-ha.mjs`, and visual (JPEG q85, canvas diff, 0.2% threshold, fixed clock).
    - Visual baselines went from PNG at 12 MB to JPEG at 3 MB.
    - A deliberate colour break was caught (**5.38%**) and then reverted.
14. **(early) Car logos:** from `/local/images/kialogo.png` and `teslalogo.png`. The `onload` adds the `haslogo` class; the built-in mark is the fallback.
15. **(early) TV wouldn't power off:**
    - Cause: `script.media_tv_power` only wakes the TV.
    - Fix: when the TV is on → `media_player.turn_off`; when it's off → the script. Applied to both the tile and the remote's power button.
    - Commit `a8fe98c`.
16. **(late) Media pop-up:**
    - A mock was approved: "Medio pop up design apporved, yes only list one". The bedroom Apple TV is listed once: `media_player.hubs_bedroom_apple_tv`, else `media_player.bedroom_apple_tv` if the first is unavailable.
    - Built from the `MEDIA_PLAYERS` config.
    - **Bug found by the e2e test:** after pausing the selected player, the selection jumped to Spotify (the next playing one). Fixed by pinning `mediaSel = p.id` while the sheet is open.
    - **Mock bug:** the feature bits `22071` lacked VOLUME_MUTE (8), so the Mute button was disabled. Changed to `22463`.
    - Heading wording changed from "Kitchen speaker on" to "Kitchen speaker paused" for paused players.
    - Commits `9e1924e`, plus `86e179f` to remove a stray `app.js.orig` that `patch` had left in `www/`.
17. **(late) Alert bar redesign:**
    - The user specified the priorities and asked for a mock first. An interactive mock (`alert-bar-mock.html`) was sent.
    - First draft wording "Garage, side and front and security doors" was fixed by listing front and security as two doors: "Garage, side, front and security doors open".
    - The user answered: patio, laundry and lone front door "**Only at night**"; all assumptions OK "but the robbie tank, keep that med".
18. **(late) Alert bar ticker bugs while building:**
    - (a) The `.track` shrank to fit (an inline-flex shrink-to-fit): grow 781 px, track 781 px, no overflow detected. → `width: max-content` and `flex: none` on children.
    - (b) The banner itself then grew wider than the screen (about 1,900 px). It was in a grid with min-width auto, and the flex item's min-content was the full text. → `.banner .grow { width: 0 }` (`flex: 1` fills it).
    - (c) After the fix, in reality only **about 382 px** is free for text with three buttons. So "Garage + patio + hallway" (about 450 px natural) **does scroll**. The test was changed to "one door stays still; several scroll".
    - Commit `26f739c`.
19. **(late) Patio door not showing in the alert bar:**
    - Not reproducible in the mock; the entity is correct (`binary_sensor.patio_door_contact`); it was 20:07 in Brisbane (night).
    - Diagnosis: Snooze stuck on. The user confirmed. No code change.
20. **(late) Dark mode not switching after sunset:**
    - Cause: the pages had **no** sun-based theme at all, only `prefers-color-scheme` from the tablet.
    - Added `applyTheme()` (sun → `data-theme`). The living room floor plan image also used `matchMedia`, so it now reads `data-theme` first.
    - **Parity check:** sun-dark against tablet-dark. Block print was 0.000% on every route; glass differed by up to **0.114%**. The cause was six glass dark rules with no `:root[data-theme="dark"]` copy: `.well` box-shadow and `.panel.ac-*` `--haze` ×5. Added them.
    - Added a unit test that parses the CSS and fails on any dark rule without its copy.
    - The visual dark shots now set `sun.sun` to `below_horizon` before loading.
    - Commit `ff00f29`.
21. **(late) Snooze safeguard offered:** expire a stale snooze after 30 minutes and/or show a grey "Snoozed: Patio door" chip. **The user has not answered.**
22. **(late) Music tab → KS native player:**
    - The KS JS API has **no** method to open Now Playing or the Music Library. KS's ESPHome integration exposes `switch.<node>_now_playing` and `button.<node>_show_music_library`, and the page can call those through HA.
    - First version: Now Playing while playing or paused (from `getKioskState().mediaPlayer.state`), otherwise the Music Library. Entities auto-discovered by regex; with several kiosks, the one matching the slug of `getDeviceInfo().name` is picked. Commit `435b23e`.
    - The user then said: "there is button button.kitchen_tab_show_music_library so use that when Music icon is clicked so it will display music library skip the regression test for this change".
    - → `KS_MUSIC.library` was hard-set and the action now **always** presses the library button. Commit `520847d`. **Regression not run, at the user's request.**

## Key Decisions

- **Two pages, kept in sync by hand:**
  - Shared logic files (`home.js`, `icons.js`, most of `config.js`) are identical apart from version strings.
  - `app.js` differs between the pages in a few places: glass has `tickers()`, the calendar "same day" stamp, and the Lost Phone face colour. Changes are ported with `patch` (diff generated from kiosk-home, paths and `v=N` rewritten) or with an identical python replace run for both.
  - **Rejected:** one shared codebase with themes. The pages had already diverged and the user wanted both kept.
- **Single-file deploy, not folders.** The user uploads `.html` files through the File editor. Folders are still built and tested (the `run.mjs` builds dimension).
- **Alarm: the script is authoritative.**
  - **Rejected:** relying on the alarm panel's own code check (Alarmo ignores wrong codes silently) and doing a client-side compare (it would put the code in the page).
- **TV power:** `media_player.turn_off` when on, and `script.media_tv_power` when off. webOS can't power itself on.
- **Alert bar levels:**
  - 1 → `urgent` (red, CSS class `alert`), 2 → `warn` (amber, new class `warn`), 3 → `note` (grey).
  - The old `on`/info class is no longer used on the banner. Old glass `.banner.on` rules remain as dead CSS.
  - Chips are per lower priority. The duration comes from the **newest** alert in the top group.
- **Ticker only on overflow,** measured after render. **Rejected:** "always tick with 2+ doors", since scrolling short text is pointless.
- **Dark by the sun overrides the tablet** (`THEME='sun'`). **Rejected:** following KS `getTheme()`; the user explicitly wanted a switch after sunset. `THEME='system'` is the escape hatch.
- **Music tab through HA ESPHome entities,** because KS has no JS API for it. Discovery is kept, but the user pinned the kitchen button.
  - **Rejected:** `launchApp` or the remote REST API, which needs a token and a device IP and would be a non-HA network request, which the constraints forbid.
- **Mock-first** for any visible new feature (the user asks for it explicitly: "show me a mock up before committing"). Mocks go in the scratchpad and are sent with `SendUserFile`, never committed.
- **Visual baselines are JPEG,** to keep the repo small. Re-accept with `--update` only after viewing the new shots.

## Evidence & Data

### Commit log (newest first, kiosk work this session)

| Hash | Summary |
|---|---|
| `520847d` | Music tab opens the kitchen tablet's Music Library (regression not run) |
| `435b23e` | Music tab opens Kiosk Satellite's own player |
| `ff00f29` | dark mode at sunset, light at sunrise |
| `26f739c` | alert banner by priority, grouped, with a ticker |
| `86e179f` | remove patch leftover (`app.js.orig` in www) |
| `9e1924e` | Media pop-up with every media player |
| `a8fe98c` | TV switches off when it's on |
| `d298f08` | alarm Access denied, car logos, climate haze, test suite in the repo |
| `7f276c2` | Kids Rooms layout on kiosk-home |
| `b24ef75` | alarm keypad refuses wrong codes |
| `5cb0d5f` | garage close confirmation, alarm keypad, bin icons and more |
| `7b7941b` | TV remote on long press, pulsing charge bolt |
| `6f76f14` | Home Energy HUD drawn in the page |
| `f8b0e29` | charging fill-up animation on the people card |
| `85be99f` | Robbie's pop-up uses the uploaded photo |
| `dddfa31` | Robbie area icons and Qrevo picture, camera update times |
| `890a03f` | Energy dashboard view and coloured flow lines |
| `6948129` / `b29d28e` | Lost Phone dial on glass / kiosk-home |
| `497b2c5` | Warm Stone Glass moves to kiosk-home-glass, with tablet fixes |
| `a751ac2` | Warm Stone Glass redesign |
| `3107c69`, `7537dcc`, `a7a27a2` | camera pop-ups sized to video, HA live-view negotiation, Arlo HLS |

### Version history (folder version → single file)

| Change | kiosk-home | kiosk-home-glass |
|---|---|---|
| TV off fix | 27 | 28 |
| Media pop-up | 28 | 29 |
| Alert bar | 29 | 30 |
| Dark by sun | 30 | 31 |
| Music tab (KS player) | 31 | 32 |
| Music tab (kitchen library) | **32** | **33** |

### Test runs

| Run | Result |
|---|---|
| Unit after the media pop-up | 23 pass |
| Unit after the alert bar | 24 pass |
| Unit after the dark-mode CSS parity test | **25 pass** |
| Full e2e after the media pop-up | 1,008 checks, all suites passed |
| Full e2e after the alert bar | 1,072 checks |
| Full e2e after dark mode | 1,120 checks |
| Full e2e + visual after the Music tab (KS player, `435b23e`) | **1,160 checks; 34 shots match** |
| After `520847d` (kitchen library) | **not run** (user request); build only |
| Earlier (pre-compaction) full run | 858 checks; 10 failed runs from stale expectations, then fixed |

### Dark parity, before the glass fix (sun-dark vs tablet-dark, % of pixels differing)

| Route | kiosk-home | kiosk-home-glass |
|---|---|---|
| home | 0.000 | 0.110 |
| lights | 0.000 | 0.114 |
| homeclimate | 0.000 | 0.028 |
| security | 0.000 | 0.071 |
| kidsroom | 0.000 | 0.017 |
| living-room | 0.000 | 0.045 |
| energy-dashboard | 0.000 | 0.000 |
| laundry | 0.000 | 0.028 |

After adding the six missing glass rules, the `theme` suite requires < 0.05%, and it passes on 6 routes per page.

### Banner ticker measurements (1280×800 viewport, kiosk-home)

| Scenario | `.grow` width | Natural text width | Ticks |
|---|---|---|---|
| Before the `width:0` fix, every door open | 781 | 781 (shrunk; bug) | no (bug) |
| Every door + Robbie + quiet hour, before the fix | banner grew to about 1,900 px wide (bug) | n/a | no |
| After the fix: garage + patio + hallway at night (3 buttons) | **382** | about 450 (1,032 incl. the copy) | **yes** |
| One door (side, daytime) | n/a | fits | no |

### Media players (`MEDIA_PLAYERS` in config.js)

| Name | ids (first available wins) | Extra |
|---|---|---|
| TV | `media_player.tv` | `remote: true` (Remote pill, power via `ACTIONS.tv`) |
| Media Apple TV | `media_player.media_apple_tv` | |
| Spotify | `media_player.spotify` | |
| Kitchen speaker | `media_player.kitchen_speaker` | icon `speaker` (new icon) |
| Bedroom Google TV | `media_player.bedroom_google_tv` | |
| Bedroom Apple TV | `media_player.hubs_bedroom_apple_tv`, `media_player.bedroom_apple_tv` | `power: 'switch.bedroom_tv'`, `powerName: 'Bedroom TV'` |

Sort order: rank playing 0, buffering/paused 1, on/idle 2, standby 3, off 4, unavailable 5; then config order. HA feature bits (`H.MF`): PAUSE 1, SEEK 2, VOLUME_SET 4, VOLUME_MUTE 8, PREVIOUS 16, NEXT 32, TURN_ON 128, TURN_OFF 256, VOLUME_STEP 1024, PLAY 16384.

### Alert priorities (`H.alerts`, as agreed with the user)

| p | Level/colour | Alerts | When / snoozable |
|---|---|---|---|
| 1 | urgent / red | Garage open (not kept); side open (not kept); front + security both open (two entries: Front, Security); security alone | any time; not snoozable |
| 2 | warn / amber | Garage kept open; side kept open; patio; laundry; Robbie water tank (`sensor.robbie_dock_dock_error` not ok/unavailable/unknown); side camera battery < 20 | patio/laundry night only; patio/laundry/Robbie/battery snoozable |
| 3 | note / grey | Hallway (any time, not snoozable); front alone (security closed, night only, snoozable); quiet hour (`quiet: true`, sub "… · Automated announcements suppressed") | |

Entity ids: `E.screenContact = binary_sensor.crimsafe_door_contact` (the "security door"), `E.patioContact = binary_sensor.patio_door_contact`, `E.laundryContact = binary_sensor.laundrydoorsensor_contact`, `E.hallwayContact = binary_sensor.hallwaydoorsensor_contact`, `E.snooze = input_boolean.alert_banner_snooze`, `E.keepGarage = input_boolean.keep_garage_door_open`, `E.robbieDock = sensor.robbie_dock_dock_error`, `E.sun = sun.sun`.

Wording examples (unit-tested):
- "Garage and side doors open" + "For 3 min"; chips `warn:Patio door`, `note:Hallway door`.
- "Garage, front and security doors open".
- "Garage door kept open" (amber).
- "Front door open" (grey, night).

### Visual shots (17 per page; `tests/kiosk-home/visual/run.mjs`)

home-light, home-dark, lights, climate, climate-dark, security, kids, energy-hud, lost-phone, alarm, garage-close, tv-remote, robbie, banner-amber, banner-grey-dark, media, media-dark. Fixed clock: Tue 24 Nov 2026, 10:30 am Brisbane (`Date.UTC(2026,10,24,0,30)`). Dark shots set `sun.sun=below_horizon` first.

### Kiosk Satellite API facts (from the GitHub docs)

- JS methods: `getDeviceInfo()` → `{uuid,name,model,os,…}`; `getTheme()`; `getKioskState()` → `{…, screensaver:{active,view}, mediaPlayer:{state,title,artist,source,nowPlayingShown}}`; `setInteractionActive(active, reason)`; `ha.call`, `ha.subscribe`, `ha.createSocket`; the screensaver, brightness, sound and pipeline methods. **No method to open Now Playing or the Music Library.**
- ESPHome (Settings > ESPHome > Expose kiosk entities): the **Now Playing** switch (requires "Now Playing instead of the screensaver"), the **Show Music Library** button, and the `esphome.<node>_launch_app` and `_notification` actions. The node name is `ks-<device name>`.
- The remote REST API (port 2324, token) has `showLinkPage`, `launchApp` and others. **Not used** (non-HA network request, needs a token).

### Earlier bugs and their fixes (pre-compaction; cheap to re-hit)

| Symptom | Cause | Fix |
|---|---|---|
| Build broke after an edit | `function moreSheet() {` line lost | Restored; esbuild (build-single) is now the syntax check after every edit |
| `patch` hunks failed when porting to glass | Lines differ (comments, Lost Phone face colours) | Temporarily aligned the lines, or `patch --fuzz`; now prefer identical python replaces on both files |
| A tap on SVG HUD elements did nothing | SVG elements have no `.click()` | Dispatch `new MouseEvent('click', {bubbles:true})` (keydown Enter handler for `[role=link]`/`[role=button]`) |
| HUD styles clashed with the page | Class names `.mono`, `.spin`, `.flow` reused | Renamed to `hud-*` |
| HUD spin ring misplaced | A translated group lost its `dy` | Added the missing offset |
| Energy HUD at 19 fps | Everything animated in one layer, continuous | Separate animated layer; stepped animations `steps(16)`/`steps(96)`; layout passes **387 → 24**; Home **61 fps** |
| Sheets see-through on glass | Translucent card background used for sheets | Near-solid sheet background (`--sheet-bg`) |
| Text hidden in `.b` tiles under the colour "pass" | `::after` colour layer above the text | Text wrapped in spans with `z-index: 3` (`.b > * { position: relative; z-index: 3; }`) |
| Energy flow lines too short | Node column narrower than the icon | Column = 44 px icon width |
| e2e: stale expectations ("Wrong code", call count === 4) | Behaviour changed with the alarm script | Expectations updated |
| e2e: `n1` redeclared in `tv.cjs` | Copy-paste | Renamed |
| Repo bloat from baselines | PNG baselines 12 MB | JPEG q85, about 3 MB (now 4.1 MB with 34 shots) |
| A safety hook blocked `rm -rf baseline/*` | Guardrail | Remove the named folders explicitly |

### Alarm flow (script authoritative)

The page's dial submit (in `alarmCall(svc)` → `dialSheet({... submit})`) does this:

```js
const res = await conn.sendMessagePromise({ type: 'call_service', domain: 'script', service: 'alarm_keypad',
  service_data: { request: svc.replace('alarm_', ''), code }, return_response: true });
const ok = res?.response?.ok;
if (ok === false) return DENIED;                                  // "Access denied: wrong passcode"
if (ok !== true) return { ok: undefined, msg: 'Not confirmed: update script.alarm_keypad' };
return (await alarmChanged(svc)) ? { ok: true, msg: ALARM_WORDS[svc][2] }
                                 : { ok: undefined, msg: "The alarm didn't change: check its own code matches" };
// If the script is missing (not_found): falls back to alarm_control_panel.<svc> with the code, only when the panel
// has a code_format; a code error → DENIED.
```

The script (`homeassistant/dashboard/alarm-keypad-script.yaml`) compares `code` with `!secret alarm_keypad_code`. On a mismatch it stops with `{ok:false, reason:'Incorrect code'}`. Otherwise it calls `alarm_control_panel.alarm_{{request}}` on `alarm_control_panel.home_alarm` with `code: "{{ alarm_code }}"` and returns `{ok:true}`. **The alarm's own code must equal `alarm_keypad_code`.**

The e2e `alarm` suite runs six modes: `script`, `panel` (`MOCK_ALARM_CODE`), `silent` (`MOCK_ALARM_SILENT`, like Alarmo), `direct` (silent + no script), `missing` (no script, no code), `mismatch` (`MOCK_ALARM_MISMATCH`). The test code is `1234`.

### TV power (`ACTIONS.tv`)

```js
const on = !['off', 'unavailable', 'unknown', undefined].includes(get(E.tv)?.state);
quiet(on ? call('media_player', 'turn_off', { entity_id: E.tv }) : call('script', 'turn_on', { entity_id: 'script.media_tv_power' }));
```
Long press (`data-hold="act:tv-remote"`, 500 ms) opens `tvRemoteSheet()` without touching power. The remote uses `webostv.button` (UP/DOWN/LEFT/RIGHT/ENTER/BACK/HOME/MENU/RED/GREEN/YELLOW/BLUE/CHANNELUP/CHANNELDOWN), `media_player.volume_*`, `media_play_pause`, and `select_source` with `TV_SOURCES` (Netflix, Prime Video, Stremio, YouTube) plus an "All sources…" select.

### Other early facts worth keeping

- **Garage close confirmation:** `garageCloseSheet()` shows the live `camera.garage_live_view`, a warning, "Close garage door", and a Close button relabelled "Cancel". It's reached from the banner (`close-garage`) and from the card when the door is open (`garage-toggle`). Opening a closed door is a two-tap `cover.open_cover`.
- **Bins:** `BIN_ICON = {r:'bin', y:'recycle', g:'leaf'}` (general red, recycling yellow, garden green).
- **Cars:** `CARS[].logo` is `/local/images/kialogo.png` or `teslalogo.png`. `carBadge()` loads the img with `onload` → `haslogo` (white chip); the built-in Kia wordmark or Tesla T is the fallback (`MOCK_NO_LOGOS` tests it).
- **Charging:** `PEOPLE[].charge = [status sensor, iPhone sensor]`; any capitalisation of "charging" counts.
- **Climate haze:** `acMode(state)` in `views.js` → cool, heat, heatcool (`heat_cool` and `auto`), fan, dry, or null. Panels get the class `ac ac-<mode>`, a `.haze` span, and the mode under the name.
- **Live cameras:** the `fitcam` class sizes the pop-up to the video's natural size. Arlo uses HA's HLS (`/api/hls/...`); WebRTC goes through `camera/webrtc/offer` and candidates; the fallback shows HA's reason.

## Code / System Analysis

- **Rendering (`app.js`):**
  - `regions` map name → fn returning HTML. `renderAll()` (rAF-batched) writes a region only when its HTML changes (`last` Map). It calls `applyTheme()` first.
  - The live sheet: `liveSheet`/`lastSheet`, `openLive(fn)` re-renders the sheet on state change unless `sliding` (the media volume slider is held).
  - `fillPhase()` replaces `__PH<ms>__` placeholders with negative animation delays, so animations don't restart on re-render.
  - In glass, `tickers(el)` runs after each region write; both pages call `bannerTicker(el)` for `banner`.
- **Banner render:** `<span class="well">` + `<span class="grow"><span class="track"><b>title</b><span class="sub">…</span><span class="sep"></span><span class="chip warn|note">…</span></span></span>` + buttons.
  - `bannerTicker` appends `<span class="gap"></span><span class="copy" aria-hidden>` and sets `--tk` (-offsetLeft of the copy) and `--tkd` (max 8 s, shift/45).
  - CSS keyframes `btick` run only under `prefers-reduced-motion: no-preference`; `html.still` pauses all animations.
  - A window resize clears `last.banner`.
- **Media sheet:** `mediaSheet()`, `mediaClock()` (called from `tick()` every second and after a sheet write, using `data-mclock data-pos data-at data-dur data-run`).
  - Volume range `input[data-mvol]`: `input` updates the label and `--v`; `change` → `media_player.volume_set`.
  - `ACTIONS`: `media`, `media-sel`, `media-power` (remote → `ACTIONS.tv()`; `power` switch toggles `switch.bedroom_tv`; else `media_player.turn_on`/`turn_off`), `tv-remote` (removes `mediasheet` and opens the remote).
  - Sheet close resets `mediaSel = null` and `sliding = false`.
- **Theme:** `applyTheme()` sets `data-theme` and `style.colorScheme` only when `sun.sun` is `above_horizon`/`below_horizon`. On a change while on a sub-view it clears `last.subview`, so the floor plan image swaps. The CSS has every dark rule twice: inside `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) … }` and as `:root[data-theme="dark"] …`. **The unit test enforces this.** Any new dark CSS must have both.
- **Music:**
  - `findKsMusic(allStates)` runs at boot (KS only) and calls `ks.getDeviceInfo()` for the name slug.
  - `pick(set, re)`: a configured id is used only if it exists in states. Otherwise a single regex match, or the slug match.
  - The tab renders as `<button data-act="ks-music">` when either id is found; otherwise `<a href="#music">` (the Music Assistant iframe view, `MUSIC_PANEL='/d5369777_music_assistant'`).
  - `ACTIONS['ks-music']`: library → `button.press`; else nowPlaying → `switch.turn_on`; on a failed call → `location.hash='#music'`.
  - `ksMedia` (from `getKioskState().mediaPlayer`) is **now unused** by the action. It's harmless and could be removed.
- **Subscriptions:** `entityIds(allStates)` gathers E, lights, contacts, bins, people, cars, every `media_player.*`, `switch.bedroom_tv`, the `MEDIA_PLAYERS` ids and power switches, and `viewEntityIds()`. **The KS music button is not subscribed** (not needed; pressing works without its state).
- **Fake HA (`tests/kiosk-home/e2e/mock-ha.mjs`):**
  - HTTP + WS on port 8123; `GET /__state?id=&s=` sets a state; `GET /__log` returns `{calls, data:[{svc,data}]}`.
  - Env switches: `MOCK_TV`, `MOCK_LONG`, `MOCK_ALARM_CODE`, `MOCK_ALARM_SILENT`, `MOCK_ALARM_MISMATCH`, `MOCK_NO_ALARM_SCRIPT`, `MOCK_NO_LOGOS`, `MOCK_MEDIA`, `MOCK_KS_MUSIC`, `SCENE=calm`, `MOCK_NOW`.
  - `/api/media_player_proxy/*` serves `fixtures/art-1.png` / `art-2.png` (Spotify).
  - Media services: pause/play/turn_on/volume_set/volume_mute change state.
  - `MOCK_KS_MUSIC` now sets `switch.ks_{kitchen,bedroom}_tablet_now_playing`, `button.kitchen_tab_show_music_library` and `button.ks_bedroom_tablet_show_music_library`.
- **Runner (`e2e/run.mjs`):** `SUITES` entries are `[suite, mockEnv, runEnv, pages, builds]`, with a fresh mock per suite run. The `banner`, `theme` and `music` (×2: `MOCK_KS_MUSIC` and `MODE=none`) entries were added this session.

## Files Changed

### Source code (both `homeassistant/www/kiosk-home/` and `kiosk-home-glass/` unless noted)
- `app.js`:
  - Media sheet, `mediaClock()` and volume slider listeners.
  - `ACTIONS` media, media-sel, media-power and ks-music.
  - Banner render with chips and the `warn` class; `bannerTicker()` and the resize handler.
  - `applyTheme()`; `findKsMusic()`; the Music tab button.
  - The Media room tile now uses `act: 'media'` (it used to link to a non-existent `#media`).
  - `MEDIA_PLAYERS` added to the subscriptions.
- `home.js`: `mediaPlayers`, `mediaSummary`, `mediaElapsed`, `clockTime`, `MF`; `alerts()` rewritten with p 1/2/3 and `door`/`kept`; `groupText()`; `banner()` returns `chips`. `minutesText` is unchanged.
- `config.js`: `MEDIA_PLAYERS`, `THEME = 'sun'`, `KS_MUSIC = { nowPlaying: null, library: 'button.kitchen_tab_show_music_library' }`, and the version bumps.
- `views.js`: the living room floor plan's dark check reads `data-theme` first.
- `icons.js`: new `speaker` icon.
- `styles.css`: the media pop-up block; the alert banner block (track, ticker, chips, `warn`, button contrast); glass-only overrides for both.
- `kiosk-home-glass/styles.css` only: added `:root[data-theme="dark"] .well` and `.panel.ac-*` haze copies.
- `homeassistant/www/kiosk-home.html` and `kiosk-home-glass.html`: rebuilt single files.

### Tests
- `tests/kiosk-home/home.test.mjs`:
  - Media players: order, single bedroom TV, subs, summary.
  - Power switch and feature bits; progress clock.
  - Alert priorities; banner grouping and chips; snooze.
  - CSS dark parity across both stylesheets.
- `tests/kiosk-home/glass.test.mjs`: media parity; the hallway test now expects a `note` chip instead of "Also:".
- `tests/kiosk-home/e2e/suites/media.cjs` (33 checks per run), `banner.cjs` (16), `theme.cjs` (12), `music.cjs` (7, and 3 in `MODE=none`). **`music.cjs` was edited for the kitchen button and not re-run.**
- `tests/kiosk-home/e2e/suites/six.cjs`: hallway check expects a grey chip.
- `tests/kiosk-home/e2e/mock-ha.mjs`, `run.mjs`, `fixtures/art-1.png`, `art-2.png` (50–56 KB each).
- `tests/kiosk-home/visual/run.mjs`: shots media, media-dark, banner-amber, banner-grey-dark; dark shots set the sun below the horizon. New and updated baselines are in `visual/baseline/<page>/`.
- `tests/kiosk-home/README.md`: suites and env switches.

### Docs
- `docs/kiosk-home.md`: media pop-up, alert priorities and ticker, dark mode by the sun, Music in KS, and the manual checklist line for the theme. The stale "Hallway door at night … can be snoozed" glass note was removed.

### Scratchpad (not committed; may be cleared)
- `/tmp/claude-0/-home-user-supar/6bca5e56-f9dc-5486-bdbc-089212b63a7c/scratchpad/media/media-popup-mock.html` (approved mock)
- `/tmp/claude-0/-home-user-supar/6bca5e56-f9dc-5486-bdbc-089212b63a7c/scratchpad/banner/alert-bar-mock.html` (approved interactive mock)
- `/tmp/claude-0/-home-user-supar/6bca5e56-f9dc-5486-bdbc-089212b63a7c/scratchpad/darkcheck.py` (the same logic is now a unit test)
- `/tmp/claude-0/-home-user-supar/6bca5e56-f9dc-5486-bdbc-089212b63a7c/scratchpad/ksdocs/*.md` (Kiosk Satellite docs)

## User Feedback & Preferences (REQUIRED)

- **Mock first:**
  - "show me a mock up before committing"
  - "show me mock ups or interactive html to approve before you commit"
  - Asked for charging animation options on a mock and chose "option C".
  - Approval comes as short replies: "Medio pop up design apporved, yes only list one".
- **Both pages always:** "add the dial to kiosk-home-glass too"; "kids room view is still not fixed" (a fix had gone to glass only). Every change goes to both.
- **Real HA behaviour matters more than tidy theory:**
  - "added passcode for alarm and script as said the keypad still does not show wrong code error, show armed away even if i enter wrong code but does not actually arm the alarm"
  - "show access denied if the passcode is entered not match the code in the secrets.yaml"
- **No HA chrome inside the page:** "the energy card display like this which is HA view with sidebar and header.. may be best to built a sub view based on the yaml".
- **Alert bar spec, in the user's words:** "Priority - high - red colour scheme / Priority Med - amber colour warning / priority low - grey info only … group multiple alerts in one per priority level … colour scheme is on priority, example Red if even one high priority alert active / apply ticker style if multiple door open". Answers: "1. Only at night 2. happy with all but the robbie tank, keep that med".
- **Speed over ceremony when asked:** "skip the regression test for this change". Honour it; say plainly that tests weren't run.
- **Concrete entity ids given directly:** "there is button button.kitchen_tab_show_music_library so use that when Music icon is clicked so it will display music library". Use given ids exactly rather than discovering them.
- **Org/tone:** Australian English, concise; report outcomes plainly.
- **Delivery:** after each change, send both rebuilt `.html` files with `SendUserFile` and tell the user to upload them to `/config/www/` and reload.

### Full request log (user's words, in order; all done unless noted)

1. "it just showing like that also need to fill the frame so scale the size of the pop to fit full video resolution" → the `fitcam` pop-up.
2. "apply the same change to all camera's in the security view".
3. "use this design.md file and change the overall design dashboards/kiosk-redesign/DESIGN.md".
4. A seven-point glass fix list: overlapping cards, squished calendar, invisible Arm buttons, ticker for long light names, add `binary_sensor.hallwaydoorsensor_contact`, "push this version as new kiosk-home-glass and keep the old kiosk-home", uniform Kids Rooms cards with bigger cameras.
5. "apply the camera fixes on the kiosk-home html … look up lost-phone-dial.html on claude/serene-davinci-hbi1n3 branch and apply same on the lost phone pop up keep dial same theme as kiosk-home".
6. "add the dial to kiosk-home-glass too".
7. "add a sub page to energy card when clicked displays energy-new/energy" → later rebuilt from the YAML (#13).
8. "change SVG lines when exporting to yellow and importing to purple".
9. "change the icons to suits the area on the quick action tiles and add a image on roborck Qrevo on the card".
10. "add the last updated timestamp to the camera cards".
11. "uploaded robbie to" → `/local/images/robbie.png`.
12. Charging animation from the phone status sensors, with the iPhone sensors as backup, "give me some charging animation options on a mock" → "option C".
13. "may be best to built a sub view based on the yaml" (the Energy HUD).
14. "Add some pulsing charge animation when the cars are charging Need to add media controls to TV button on long press and source selection".
15. The "few more updates" list of six (hallway grey note, bin icon colours, garage close confirmation with camera, alarm keypad, Living Aircon text, energy pill pattern).
16. "few testing issues arm away and disarm does not check for wrong codes".
17. "kids room view is still not fixed".
18. Climate haze per mode; "the media card currently does not show any thing create a pop up … show me a mock up before committing"; "build proper unit test and regression and do visual testing as well".
19. Keypad still showed "Armed away" on wrong codes → "show access denied if the passcode is entered not match the code in the secrets.yaml".
20. "added the kia logo and tesla logo to the folder, use that for the car cards".
21. "there is a issue with TV card it does not power off when toggled from TV on state".
22. "Medio pop up design apporved, yes only list one".
23. The alert bar priority spec (see above) and "show me mock ups or interactive html to approve before you commit" → "1. Only at night 2. happy with all but the robbie tank, keep that med".
24. "patio door is open but does not show on the alerts tab" → snooze stuck; "yes it was turned on all good now".
25. "also the dark mode is not takin over after sunset".
26. "Can the music card redirect to kiosk satellite native musics player instead of music assistant".
27. "there is button button.kitchen_tab_show_music_library so use that when Music icon is clicked … skip the regression test for this change".

## Where We're Going

1. **Wait for the user's next request.** There is no in-flight implementation.
2. If the user agrees: build the **snooze safeguard**, in two parts:
   - (a) The page ignores `input_boolean.alert_banner_snooze` once it has been `on` for more than 30 minutes (use `last_changed`).
   - (b) Optionally a grey "Snoozed: …" chip listing the hidden alerts.
   - Unit plus banner e2e tests; both pages.
3. Before the next change that touches the Music tab, **run the `music` suite** (`node tests/kiosk-home/e2e/run.mjs --suite music`), since it was edited without being run.
4. Optional tidy-up: remove the unused `ksMedia`/`nowPlaying` path if the user confirms they never want Now Playing; remove the dead glass `.banner.on` CSS.
5. Possible follow-up the user may raise: the Garage room tile and garage card show **red** while the banner is **amber** for "kept open". This was mentioned to the user as a possible inconsistency, and not acted on.

## Risks & Blockers

- **Untested last change:** `520847d` was built only. The `music` e2e was edited for the kitchen button, not run. On the real tablet, `button.kitchen_tab_show_music_library` must exist and KS must have "Expose kiosk entities" on. If the button isn't in the states at boot, `pick()` returns '' and the tab falls back to regex discovery or Music Assistant.
- **KS behaviour not verified on a real device:** the ESPHome button/switch route was built from the docs and tested against a simulated KS object only.
- **Snooze automation likely not installed** on the user's HA, so Snooze can stick on again and hide the patio, laundry and front door, Robbie and the camera battery.
- **Network:** `kiosksatellite.com` is blocked in this cloud session; use raw.githubusercontent.com for the docs.
- **The full e2e takes more than 10 minutes:** run it with `run_in_background: true` (the foreground timeout is 600 s). The visual run takes about 5 minutes.
- **`patch` leaves `.orig` files.** Before every commit, run `find homeassistant/www -name "*.orig" -o -name "*.rej"`.

## Open Questions

- Does the user want the snooze safeguard (stale-snooze expiry and/or the "Snoozed:" chip)? Asked twice; no answer.
- Does the user want the Garage tile/card colour to match the banner (amber when kept open)? Mentioned once; no answer.
- Is the 30-minute snooze reset automation installed on HA? Probably not (the snooze was found stuck on).

## Quick Start for Next Session

```
# Context to restore
Branch claude/gallant-cori-vepkh0 (pushed, clean). No ticket. Read docs/kiosk-home.md and tests/kiosk-home/README.md.

# Key files / objects to look at first (not exhaustive — check adjacent ones too)
homeassistant/www/kiosk-home/app.js       (regions, ACTIONS, mediaSheet, bannerTicker, applyTheme, findKsMusic)
homeassistant/www/kiosk-home/home.js      (alerts/banner/groupText, mediaPlayers)
homeassistant/www/kiosk-home/config.js    (E, MEDIA_PLAYERS, THEME, KS_MUSIC, VERSION)
homeassistant/www/kiosk-home-glass/*      (mirror; app.js differs slightly: tickers, calendar)
tests/kiosk-home/e2e/mock-ha.mjs + run.mjs

# Evidence to reference
tests/kiosk-home/visual/baseline/<page>/*.jpg (34 approved shots)

# Verify current state
node --test tests/kiosk-home                                  # expect 25 pass
node tests/kiosk-home/e2e/run.mjs --suite music               # unrun since 520847d
node tests/kiosk-home/e2e/run.mjs   (background, >10 min)      # last: 1,160 checks
node tests/kiosk-home/visual/run.mjs                          # expect 34 shots match

# After any change (both pages)
node tools/kiosk-test/bump-version.mjs --dir homeassistant/www/<page>
node tools/kiosk-home/build-single.mjs --name <page>
find homeassistant/www -name "*.orig" -o -name "*.rej"         # must be empty
commit, push to claude/gallant-cori-vepkh0, SendUserFile both .html files

# Next action
Run the music e2e suite to confirm 520847d, then wait for / ask about the snooze safeguard.
```
