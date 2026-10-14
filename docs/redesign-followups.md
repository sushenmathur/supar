# Quiet Glass: followups

Nothing here was written into the repository as an automation. These are the behaviours that need one (or a device setting), plus everything I could not test without your Home Assistant instance. Replace `<tablet>` and `<browser_id>` with your device's names.

## A. Behaviour that needs an automation or a device setting

### A1. Idle screensaver (after N minutes)

The `saver` view and the near-black `Glass 2 Saver` theme are in `master.yaml`. Nothing switches to it yet.

| | |
|---|---|
| Entity | browser_mod's per-device activity sensor, `binary_sensor.<tablet>_activity` (turns off after the browser_mod activity timeout; check the exact id under Settings > Devices > Browser Mod) |
| Trigger | that sensor `off` for N minutes (suggest 5) |
| Service | `browser_mod.navigate` with `path: /home-2-0/saver`, target the tablet's browser |
| Return | tap anywhere (built into the saver card, navigates to Home); touching the screen also turns the activity sensor back on |

```yaml
alias: Tablet screensaver
triggers:
  - trigger: state
    entity_id: binary_sensor.<tablet>_activity
    to: "off"
    for: "00:05:00"
actions:
  - action: browser_mod.navigate
    data:
      path: /home-2-0/saver
    target:
      device_id: <browser_mod device id>
```

### A2. Screen brightness by sun

| | |
|---|---|
| Entity | `sun.sun` (or `sensor.sun_solar_elevation`) |
| Trigger | sunset, sunrise (and optionally the saver starting) |
| Service | Companion app: `notify.mobile_app_<tablet>` with `message: command_screen_brightness_level` and `data: {command: 40}` (0–255), or `message: command_auto_screen_brightness`. Fully Kiosk: `number.set_value` on `number.<tablet>_screen_brightness` |

I have not checked which of these your tablet exposes; use whichever matches how it runs the dashboard.

### A3. Day and night theme ("follow system")

The theme itself needs nothing: `Glass 2` defines light and dark and follows the device.

* Driving setting: **Android Settings > Display > Dark theme > Schedule > "Sunset to sunrise"** on the tablet.
* In Home Assistant, on the tablet's profile: **Theme: Glass 2, Dark mode: Auto** (not "Dark" or "Light").
* The Good Night scene cannot flip the device to dark by itself. If you want that, it needs a device command (companion app or Fully Kiosk) in an automation; I did not assume one exists.
* Night look (reduced accent saturation, no bright surfaces) is just the dark palette: accent `#9ab4ee`, amber `#f2b84b`, card `#161c28`. The saver is darker again.

### A4. Doorbell press opens a pop-up on the tablet

I do not know which entity reports the press (Reolink, Arlo, Eufy, ... each differ), so this is a template:

```yaml
alias: Doorbell shows camera on tablet
triggers:
  - trigger: state
    entity_id: <doorbell press entity, e.g. event.front_door_doorbell or binary_sensor.front_door_ding>
actions:
  - action: browser_mod.popup
    data:
      dismissable: true
      size: normal
      timeout: 30000
      content:
        type: picture-entity
        entity: camera.front_door_live_view_2
        camera_view: live
        show_name: false
        show_state: false
      style: |
        --ha-dialog-surface-background: var(--popup-bg);
        --mdc-dialog-scrim-color: var(--scrim);
    target:
      device_id: <browser_mod device id>
```

### A5. Alert notifications without the dashboard open

The old alert-ticker-card (kept verbatim, hidden) is the thing that speaks the garage alert on `media_player.kitchen_speaker`, flips `switch.sonoff_1000f6b15b` and pushes patio alerts to `mobile_app_suparhub2`. It only does that while the dashboard is open in a browser. If that matters, move the rules to an automation, then delete the card. The strange `visibility` template on that card (a `visibility:` block pasted inside a `value_template`) is preserved as it was; it evaluates to hidden.

### A6. "Off-peak until 4 pm"

The status sentence shows the tariff name from `select.grid_import_tariff` (for example "Off-peak"). An "until 4 pm" needs an entity that says when the tariff changes. If you have one (or add a template sensor), add it to the status JS in the top bar (`name:` of the second top-bar card).

### A7. Optional: one "media active" sensor

The Media Now item uses an explicit list (`media_player.tv`, `media_apple_tv`, `hubs_bedroom_apple_tv`, `bedroom_apple_tv`, `switch.bedroom_tv`) because a visibility rule cannot match "any media_player playing". A template binary sensor over your speakers and TVs would let the list shrink to one entity. The label text already includes every playing player except the skipped ones.

## B. Judgement calls I made (change them if wrong)

| Call | Where | Why |
|---|---|---|
| World clocks: Sushen > India (`binary_sensor.hyd_daytime`), Paro > Austin (`binary_sensor.austin_daytime`). Each pop-up shows the person's own region first and the other second. | `person_popup(...)` arguments | The old Home view never said whose region each clock was. |
| Kids rooms appear in Now when a room is occupied between 20:00 and 06:30. | `KIDS_NIGHT` | "Occupied past bedtime" read as a nightly all-clear that the kids are in. The 20:00 and 06:30 window is my guess; neither the bedtime nor the "if that sensor exists" part was in the config beyond the two occupancy sensors. |
| Bin item shows 16:00–23:59 on Mon and Sun. | `C_BIN` | Weekdays kept from the old rule (06:00–23:59 Mon and Sun); window narrowed to the evening. Whether the wheelie-bin-card hides itself when no bin is due is unverified; if it shows an empty box on a Sunday or Monday evening with nothing due, look in that card's options for an "only show when due" setting. |
| "Door open" Now row: hallway door any time, front/patio/laundry by day only. | `C_DOORS` | The alert item already covers garage, side and security doors, and front/patio/laundry after dark (and respects snooze). This row fills the gaps without repeating them. |
| Navbar Security badge counts alert-grade doors only (garage, side, security always; front, patio, laundry, hallway after dark). The Lights light-count badge is gone. | `navbar()` | "Badge only for real alerts". |
| Names shortened on Home: "Pendants", "Media room". | favourites | Keep each toggle on one line at 16 px. |
| Cost, tariff, rate and EV charging moved into the Energy pop-up; the animated flow is static. | `energy_popup()` | As requested; looping animation removed. |
| Next event reads the calendar entity's own attributes. | `next_event()` | Avoids a custom card on Home. If `calendar.supar_family` only exposes the next event while one is active or imminent, the tile will read "No upcoming events" until then; check on the device. |
| Garage pop-up is long (door, controls, two cars). | `room_popup('garage')` | Everything the old car pop-ups held stays one tap from Home; the pop-up scrolls. |
| The `Glass 2 Saver` clock is the 72 px token scaled with CSS `zoom` (2.6×). | `glass-2.yaml`, `saver_view()` | Keeps the type scale at six sizes. |

## C. Not verified: checklist for the first run on the tablet

I could not run this against a live Home Assistant (no instance, no tablet). What I did run: YAML validity, every JavaScript block compiles, every template exists, token usage, contrast, a 20 000-state simulation of the "Everything's calm" rule, and a Chromium render of the mock-up at 1280 × 800. Please check, in this order:

1. **Viewport.** Read `innerWidth × innerHeight` on the tablet (snippet in `redesign-audit.md` section 1). Expected about 1280 × 800.
2. **Fonts.** Run `homeassistant/www/install-fonts.sh`, add the `quiet-glass-fonts.js` resource, hard refresh. Without them the dashboard uses system-ui and looks fine, just not Inter.
3. **Home scroll.** Home should not scroll in calm or in a typical busy evening. If it does, lower `ha-view-sections-row-gap` or `ha-view-sections-column-gap` in `glass-2.yaml` (these variable names are from the HA sections-view source as I remember it; if they have no effect on your version, the layout still works but the spacing is HA's default).
4. **Pop-up width.** The pop-up style sets `--mdc-dialog-min-width`, `--mdc-dialog-max-width` and `--ha-dialog-width-md` to 560 px. Which one your HA and browser_mod version honours may vary; a pop-up that is not about 560 px wide means one of the three needs changing in `POPUP_STYLE` (it is repeated verbatim in each pop-up).
5. **Native tile features.** `alarm-modes`, `vacuum-commands`, `target-temperature`, `climate-hvac-modes`, `lock-commands`, `cover-open-close` need a recent Home Assistant (2025.x). A tile that shows no feature row means that feature name is not supported on your version.
6. **Heading badges** (entity badges inside `heading`) and **`visibility`** with `or`, `and`, `numeric_state` and `time` conditions on cards: the old config already used `visibility` with a time rule, so these should work, but the Now column depends on them.
7. **Navbar badge colour.** I target `.badge` in the navbar styles. If the badge keeps its default colour the class name differs in your navbar-card version.
8. **Native tile state colours.** `glass-2.yaml` sets `state-light-active-color`, `state-switch-active-color`, `state-lock-unlocked-color`, `state-cover-open-color` and the generic active colour to the warm amber "ink". Native tiles may still pick other colours for some domains; check a light, a switch and a door.
9. **`color-mix()` and `zoom`.** `color-mix()` needs Chromium / Android System WebView 111 or newer. If it is older, the tint declarations are ignored and cards fall back to the plain surface (each has a plain `var(--…)` declaration just before its `color-mix()` one), so you lose the amber and alert tints but nothing breaks.
10. **Alert ticker.** It must stay invisible. If you see an empty card in the Now column, its `visibility` rule is not being honoured.
11. **Other things to look for:** a room tile that never lights (its `watch` list needs a missing entity), the aircon Now item listing a zone you did not expect, the status sentence reading "Lights off" while a light is on (the status counts `light.*` only, not switches).

## D. Cleanup you can do after a week of use

* `card_mod` and mushroom are no longer referenced by this dashboard. Uninstall them only after checking your other dashboards.
* The old concept mock-ups under `dashboards/` are untouched. The old Home paste-in fragments now live in `homeassistant/_archive/fragments/`.
* `input_boolean.alert_banner_snooze` and its helper automation (`dashboard/alert-snooze-helper.yaml`) are still needed and unchanged.
