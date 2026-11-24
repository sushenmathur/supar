# Kiosk page tests

Tests for the two kiosk pages, `homeassistant/www/kiosk-home/` (block print) and `homeassistant/www/kiosk-home-glass/`
(Warm Stone Glass). Nothing here is served by Home Assistant.

| Layer | What it checks | Run |
|---|---|---|
| Unit | The pages' pure logic: alert banner, room labels, lights, energy, bins, alarm, front door, charging, aircon modes, media players, the entity diff | `node --test tests/kiosk-home` |
| End-to-end | Each feature in a real browser against a fake Home Assistant, on both pages and both builds (folder and single file) | `node tests/kiosk-home/e2e/run.mjs` |
| Visual | Screenshots of every view and pop-up compared with approved baselines | `node tests/kiosk-home/visual/run.mjs` |

## Setup (once)

```
cd tests/kiosk-home/e2e && npm install
```

Playwright with Chromium must be available (`require('playwright')`). The end-to-end and visual tests load the
pages from the repo, so rebuild the single files after a change:

```
node tools/kiosk-home/build-single.mjs
node tools/kiosk-home/build-single.mjs --name kiosk-home-glass
```

## End-to-end

`e2e/run.mjs` starts a fresh fake Home Assistant (`e2e/mock-ha.mjs`) for every suite in `e2e/suites/`, so no state
leaks between them, and prints one line per suite. Options: `--page kiosk-home`, `--suite alarm,tv`, `--quick`
(folder builds only). It exits 1 if anything fails.

| Suite | Covers |
|---|---|
| `home` | Every Home card: banner and its buttons, garage close confirmation, alarm keypad, lights, Lost Phone dial, aircon, camera |
| `views` | Every sub-view renders, its controls call the right services, no reloads between views |
| `fixes` | Car pop-ups, avatars, weather label, press-and-hold details, live camera entity |
| `fit` | Each Security camera pop-up is sized to its video |
| `live` | WebRTC and HLS live video, and the fallback with Home Assistant's reason |
| `charging` | Phone charging animation, status sensor first and iPhone sensor as backup |
| `energy` | Energy card flow colours and pill, the in-page Energy HUD, its taps, fonts and no outside requests |
| `six` | Hallway note, bin icons, garage confirmation from every entry point, aircon text, flow pill, alarm dial |
| `cars` | Car badges use the logo images from `/config/www/images/`, and fall back to the built-in marks when they're missing |
| `tv` | TV remote on long press: every button's service, sources, power, disabled when off; car charging bolt |
| `banner` | The alert banner: priorities and colours (red, amber, grey), grouping, chips, night-only doors, the ticker |
| `theme` | Dark at sunset and light at sunrise, live; the dark-by-sun page matches the tablet's dark mode pixel for pixel |
| `music` | The Music tab in Kiosk Satellite: Music Library when nothing is loaded, Now Playing while playing or paused, this kiosk's entities among several; Music Assistant without them or outside Kiosk Satellite |
| `media` | The Media pop-up: each player listed once and in order, the hero's controls and volume slider, row buttons, power (TV, bedroom TV switch, others), the TV remote, artwork only through Home Assistant, the progress clock |
| `alarm` | A wrong passcode shows "Access denied" and leaves the alarm alone, for arm home, arm away and disarm, in six set-ups: the script with an alarm without a code, with one that rejects wrong codes, with one that ignores them silently (like Alarmo); no script with an alarm code; no script and no code; and the script passing while the alarm's own code differs |
| `glass` | Glass-only layout: ticker, calendar stamps, spacing, Kids Rooms |
| `single` | The single-file build: Kiosk Satellite on/off, sign-in message, core actions |
| `perf.cjs` | Not in the runner: `NAME=kiosk-home node e2e/suites/perf.cjs home` measures frames and layout work on a 4× throttled CPU |

The fake Home Assistant has switches for scenarios: `MOCK_TV`, `MOCK_LONG`, `MOCK_ALARM_CODE`, `MOCK_ALARM_SILENT`, `MOCK_ALARM_MISMATCH`, `MOCK_NO_ALARM_SCRIPT`, `MOCK_NO_LOGOS`, `MOCK_MEDIA`, `MOCK_KS_MUSIC`,
`SCENE=calm`, and `MOCK_NOW` (a fixed clock). Tests change states through `GET /__state?id=&s=` and read the service calls
from `GET /__log`.

## Visual

`visual/run.mjs` takes the same screenshots every run: a fixed clock (Tue 24 Nov 2026, 10:30 am), fixed data, animations
off, 1280 × 800; dark shots are taken after sunset. It compares each with `visual/baseline/<page>/<shot>.jpg`; a shot fails when more than 0.2% of its pixels
differ noticeably, and the actual image and a red diff go to `visual/output/` (not committed).

When a change to the look is intended, check the new screenshots and accept them:

```
node tests/kiosk-home/visual/run.mjs --update
```

Options: `--page kiosk-home`, `--shot home-light,alarm`. Shots: home (light and dark), lights, climate (light and dark,
with four aircon modes running), security, kids rooms, energy HUD, Lost Phone, alarm keypad, garage close
confirmation, TV remote, Robbie, Media pop-up (light and dark), amber banner, grey banner (dark).
