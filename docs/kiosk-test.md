# Kiosk Satellite test page (`kiosk-test`)

A hand-built HTML/JS page to test replacing the SuPar Home Lovelace dashboard on the tablet with a Kiosk Satellite (KS) **Custom Page**. It reads the SuPar Home dashboard config, finds every entity it uses, groups them by area and shows each one as a tile with basic controls. It's plain ES modules with no framework, no build step for the page itself, and no network requests other than to Home Assistant.

It's a test. Nothing else in this repo or in Home Assistant changes, and the page never writes HA config. The only writes are the service calls a person triggers by tapping.

## File map

| Path | What it is |
|---|---|
| `homeassistant/www/kiosk-test/index.html` | Page shell. Copied to `/config/www/kiosk-test/` |
| `homeassistant/www/kiosk-test/app.js` | Boot, data loading, hash routing, layout, live updates |
| `homeassistant/www/kiosk-test/connection.js` | KS shared connection or browser HA session, error messages, backoff |
| `homeassistant/www/kiosk-test/entities.js` | Pure logic (no DOM): entity extraction, grouping, state diffs, redaction. Also imported by Node |
| `homeassistant/www/kiosk-test/tiles.js` | Tiles, controls, confirmation taps, details sheet, camera refresh |
| `homeassistant/www/kiosk-test/config.js` | `VERSION`, `SOURCE_DASHBOARDS`, timings |
| `homeassistant/www/kiosk-test/styles.css` | Glass theme styling (light/dark via `prefers-color-scheme`), KS insets |
| `homeassistant/www/kiosk-test/vendor/haws.mjs` | home-assistant-js-websocket, vendored (see below) |
| `tests/kiosk-test/` | `node --test tests/kiosk-test`, with synthetic fixtures (not the real dashboard) |
| `tools/kiosk-test/smoke.mjs` | Live read-only check against HA (needs `HA_URL` and `HA_TOKEN`) |
| `tools/kiosk-test/bump-version.mjs` | Cache-busting version bump |

Only `homeassistant/www/kiosk-test/` is ever deployed. Tests, tools and this README stay out of `www/` because HA serves everything under `/config/www/` at `/local/` without signing in.

## How this repo maps to `/config` (findings)

- **The repo is not the `/config` folder.** It's a dashboard workspace: `homeassistant/` holds the files that get copied into HA by hand (`homeassistant/themes/glass.yaml` → `/config/themes/glass.yaml`, `homeassistant/dashboard/master.yaml` pasted into the raw configuration editor), and `dashboards/` holds design mock-ups.
- **There was no `www/` folder and no `.gitignore`.** Following the existing convention, the page lives at `homeassistant/www/kiosk-test/`, which maps to `/config/www/kiosk-test/`. Nothing is ignored, so `.gitignore` wasn't touched.
- **Deploy method: manual copy.** There's no CI, no deploy script and no sign of a git-pull add-on. `homeassistant/README.md` describes copying files and pasting YAML by hand. No deploy config was changed.
- **`SOURCE_DASHBOARDS` = `['dashboard-hub']`. This is an assumption to confirm.** There's no `.storage/lovelace_dashboards` or `configuration.yaml` in the repo. `master.yaml` (the dashboard source) navigates to `/dashboard-hub/<view>` throughout, so `dashboard-hub` is almost certainly its `url_path`. The repo never names it "SuPar Home", though. Run the smoke test: it looks up the dashboard titled "SuPar Home" and prints its `url_path`. If they differ, change `config.js` or open the page with `?dash=<url_path>`.

## Deploy

Copy only the page folder. Never copy the repo as a whole into `/config`.

1. Copy `homeassistant/www/kiosk-test/` (including `vendor/`) to `/config/www/kiosk-test/`, using the Samba share, the File editor or Studio Code Server add-on, or `scp` to the SSH add-on. Nothing else in `/config` is touched.
2. If `/config/www` didn't exist before, restart Home Assistant once so it starts serving `/local/`.
3. Open `http://<your-ha>/local/kiosk-test/index.html#all` in a browser where you're signed in to HA.

No SSH or Samba access was configured where this was built, so it hasn't been deployed.

## Kiosk Satellite setup

1. On the tablet or in the KS remote admin, go to **Settings › Home Assistant › Custom Pages** and turn on **Share Home Assistant connection**.
2. Tap **Add page**. Name it **SuPar Test**, set the path to `/local/kiosk-test/index.html#all`, then tap **Save & Validate**.
3. Optionally add one entry per area, using the same file with a different hash, e.g. `/local/kiosk-test/index.html#kitchen`. Area hashes are the area IDs shown in the chip links. `#unassigned` shows entities with no area. KS switches between these without reloading.
4. Don't set it as the **Default dashboard** until testing is done.

**Recommendation:** the kiosk's long-lived token should belong to a **non-admin** HA user. With sharing on, the page can do anything that user can (except credential and user management, which KS blocks). The registry commands the page needs (`config/area_registry/list`, `config/device_registry/list`, `config/entity_registry/list_for_display`) and `lovelace/config` don't require admin in HA core. If any registry read is refused anyway, the page groups by entity type and shows a banner.

## How it works

### Connection

1. **Inside KS** (`window.kioskSatellite.platform === 'kiosksatellite'`): `createConnection({ createSocket: kioskSatellite.ha.createSocket })`, with no token in the page. If KS answers `not_allowed`, `not_configured` or `auth_invalid`, the library reports `ERR_INVALID_AUTH` and the page says: *Turn on Share Home Assistant connection in Settings › Home Assistant › Custom Pages, and make sure this page is added as a custom page.*
2. **Normal browser:** it reads HA's own session from `localStorage.hassTokens` and passes it to `getAuth({ hassUrl: location.origin, loadTokens, saveTokens })`. Refreshed tokens are written back to the same key. With no stored session, or a session for a different address, it says: *Open Home Assistant in this browser, sign in with 'Keep me logged in' ticked, then reload this page.* It never redirects to the login page.
3. **Unreachable:** it shows *Can't reach Home Assistant. Retrying…* and retries with backoff (1 s doubling to 30 s). Once connected, the library handles reconnects itself. A small "Reconnecting…" strip shows while it's disconnected.

No HA URL or token is stored anywhere in the page.

### Which entities

- `config.js` → `SOURCE_DASHBOARDS`, or `?dash=url_path1,url_path2` (use `default` for the default dashboard). Each one is read with `lovelace/config` (read-only).
- `extractEntities` serialises the config and matches `/\b[a-z_]+\.[a-z0-9_]+\b/g`. Matches that exist in `get_states` are kept, in first-seen order and de-duplicated. This picks up Bubble Card keys (`1_entity`, `sub_button`), button-card JS (`states['sensor.x']`, `hass.states.sensor.x`), Mushroom Jinja (`states('sensor.y')`) and `variables:` without special-casing each card. JSON escapes such as `\n` are blanked first, so an entity at the start of a template line isn't misread.
- `missing` lists matches whose domain exists but whose ID doesn't (likely renamed or deleted). Service names from `get_services` (e.g. `light.turn_on`) are excluded. A JS variable or file name that looks like `light.something` can still show up, so treat the list as a hint.
- **Fallback:** for a `strategy` dashboard, or one that yields no entities, the page shows every entity not hidden in the entity registry, with a banner.
- **Grouping:** the entity's area, else its device's area, else Unassigned. Areas are sorted by name with Unassigned last. If any registry read is refused, entities are grouped by domain instead.

### Rendering

- One `subscribe_entities` subscription filtered to the page's entity IDs. Each message is applied as a diff, and only the tiles whose entities changed are updated.
- Camera snapshots refresh every 10 s, only for tiles on screen (IntersectionObserver). They pause while the KS screensaver is active or the page is hidden, and re-read `entity_picture` each time because its token rotates. Images are only loaded from HA itself. An external `entity_picture` (e.g. remotely accessible media artwork) is skipped.
- **Tap and hold, as on the dashboard:** tapping a light, switch, fan, input boolean or automation tile toggles it. Tapping any other tile opens the details sheet. Holding any tile for half a second opens the details sheet.
- The details sheet shows the friendly name, state, relative `last_changed` and attributes. It redacts any attribute or URL query parameter named `token`, `access_token`, `api_key`, `key` or `password`. In KS it calls `setInteractionActive(true)` while the sheet is open and `false` when it closes.
- Unlocking a lock, and opening or closing a cover with device class `garage` or `gate`, needs a second tap within 3 s (the button shows "Tap again").
- The console gets one `kiosk-test loaded v<version>` line per document load, a summary line (entity and group counts, connection type) and short error codes. Attributes and URLs are never logged.

### Vendored library

`vendor/haws.mjs` is **home-assistant-js-websocket 9.8.1** (Apache-2.0), bundled into one ESM file. 9.8.1 was the newest release at least two weeks old when this was built: 9.9.0 came out on 19 November 2026. To rebuild it:

```bash
npm i home-assistant-js-websocket@9.8.1 esbuild@0.24.2
```

```bash
npx esbuild node_modules/home-assistant-js-websocket/dist/index.js --bundle --format=esm --minify --legal-comments=none --banner:js="/* home-assistant-js-websocket 9.8.1 (Apache-2.0) bundled with esbuild 0.24.2. Do not edit; see docs/kiosk-test.md. */" --outfile=homeassistant/www/kiosk-test/vendor/haws.mjs
```

## Styling

The page copies the look of the SuPar Home dashboard and the Glass theme (`homeassistant/themes/glass.yaml`):

- **Background:** the theme's light and dark gradient wallpaper, on a fixed layer.
- **Area panels:** frosted glass (radius 30), each with a 52 px icon well, the area name, and "N of M on".
- **Tiles:** radius 22 with 48 px icon wells. Anything on (a light, a switch, a playing speaker) uses the amber gradient and glow; toggle tiles also get the 52×30 switch.
- **Warnings:** unlocked locks and open garage doors or gates use the soft red warning fill.
- **Lights summary bar:** like the Lights view, with "N of M lights on" and a pill per area.
- **Details sheet:** uses the Glass popup fill and blurred scrim.

The colours are copied from `glass.yaml` into `styles.css`, because a `/local/` page doesn't get HA theme variables. If the theme changes, update both.

To keep the tablet responsive, only the panels, summary bar and banners use `backdrop-filter`; tiles are translucent fills inside an already blurred panel. Entry animations (a short staggered fade-up) are turned off when the system asks for reduced motion.

No fonts are downloaded: the system font stack is used, which is Roboto on the Android tablet, the same as HA's own dashboard.

## Cache busting

KS skips caches for custom pages. Normal browsers keep `/local/` files for about a month, but a reload always re-checks the top-level page. So `index.html` loads `app.js?v=N` and `styles.css?v=N`, and every module import carries the same `?v=N`. After any change to the page, run:

```bash
node tools/kiosk-test/bump-version.mjs
```

This bumps `VERSION` in `config.js` and rewrites every `?v=` in `www/kiosk-test/` (vendor excluded). Then deploy. One ordinary reload in a browser picks up the new files.

## Tests and smoke check

Run the unit tests:

```bash
node --test tests/kiosk-test
```

`tests/kiosk-test/package.json` only exists so this exact command resolves the folder to its test file on Node 22.

Run the smoke check (read-only):

```bash
HA_URL=http://homeassistant.local:8123 HA_TOKEN=<token> node tools/kiosk-test/smoke.mjs
```

It prints:
- whether the token's user is an admin, with a warning if so (use a token for the kiosk's non-admin user to see what the tablet will see)
- the dashboard titled "SuPar Home" and its `url_path`
- the resolved `url_path`
- which registry commands succeeded
- the entity count, the count per area, and `missing`

Add `DASH=a,b` to try other dashboards. Without `HA_URL`/`HA_TOKEN` it prints `skipped` and exits 0. It never prints or writes the token. Don't put the token in a file in this repo.

## Debugging

Open the KS remote admin and watch the page's JS console. Look for `kiosk-test loaded v…`, the summary line, and `kiosk-test:` warnings with error codes. The browser itself also logs failed WebSocket handshakes while HA is unreachable (one per retry, slowing to one every 30 s).

## Rollback

1. Delete `/config/www/kiosk-test/`.
2. Remove the **SuPar Test** entry (and any per-area entries) from KS Custom Pages.

Nothing else was changed.

## Known gaps

- `SOURCE_DASHBOARDS` (`dashboard-hub`) is inferred, not confirmed. See the findings above.
- Not yet run against the live HA or on the tablet. It was tested in Chromium against a mock HA websocket server (browser session, KS sharing on and off, refused registries, strategy fallback, unreachable HA, no session).
- `missing` can include false positives (JS variables or file names shaped like entity IDs).
- The climate target is read-only for low/high range thermostats. Covers always show open/stop/close, whatever their supported features.
- Selects are chosen in the details sheet, not on the tile.
- The fallback (all visible entities) can be long on a big install.

## Out of scope

- Live camera video. Use KS's own **Camera streams** feature.
- Pixel-for-pixel recreation of Bubble Card, Mushroom or button-card cards (the page borrows the Glass look, not the cards themselves), and porting the Bluey card or garage card.
- History graphs, editing dashboards, setting this page as the kiosk's default dashboard, and changing the kiosk's HA user.

## Manual test checklist (for Sushen)

- [ ] **Browser:** signed in to HA, `/local/kiosk-test/index.html#all` renders grouped tiles.
- [ ] **Two-way sync:** toggling a light from the page changes it in HA within about 1 s, and a change made in HA shows on the page within about 1 s.
- [ ] **KS, sharing on:** the page loads from the Custom Pages picker.
- [ ] **KS, sharing off:** the page shows the "Turn on Share Home Assistant connection" message.
- [ ] **Hash switching:** moving between area hashes doesn't reload (one "loaded" log line only).
- [ ] **Confirmation:** the garage door and lock tiles require a second tap.
- [ ] **Theme:** switching KS between light and dark restyles the page without a reload.
