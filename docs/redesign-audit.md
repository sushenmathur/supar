# Quiet Glass redesign: audit

Scope: `homeassistant/dashboard/master.yaml` and `homeassistant/themes/glass-2.yaml`.
Rollback copies of both files are in `homeassistant/_archive/` (paste `_archive/master.yaml` into the raw editor and copy `_archive/glass.yaml` over the theme).

Verdicts: **KEEP** (same job, restyled), **MOVE** (leaves Home, still one tap away), **MERGE** (two or more cards become one), **DROP** (duplicate or decoration, nothing lost).

## 1. Target canvas

| | |
|---|---|
| Device | Lenovo Idea Tab Pro 12.7", 16:10, landscape |
| Panel | 2944 × 1840 physical pixels (manufacturer spec, from memory, not read from the device) |
| Assumed CSS viewport | **1280 × 800** (2944 / 2.3 = 1280, 1840 / 2.3 = 800; Android's usual density scale for this class of panel) |
| Status | **Assumption, not verified on the device.** This session cannot reach the tablet. |

How to verify on the tablet (30 seconds): add a temporary button-card to any view with
`name: "[[[ return innerWidth + ' × ' + innerHeight + ' @' + devicePixelRatio ]]]"` and read it, then delete it.
The companion app or a browser with system bars visible will report a smaller height (typically 48–72 px less). The Home layout needs 712 px of the 800 (see section 7), so it keeps about 88 px of slack for that.
If the reading is far from 1280 × 800, tune the two sections-view variables at the top of `glass-2.yaml` (`ha-view-sections-row-gap`, `ha-view-sections-column-gap`); nothing else depends on the viewport.

## 2. Old Home view: every card

The old Home view was 4 sections and 47 card nodes (stacks, grids and conditionals included), plus 17 mushroom cards across the dashboard, 11 button-card templates, 38 hex and 56 rgba literals and 20 `card_mod` blocks.

### Section 0 (full width header)

| # | Old card | Entities | Purpose | Verdict | Where it went and why |
|---|---|---|---|---|---|
| 1 | `conditional` > button-card alert banner (JS) | garage / side / security-screen / front / patio / laundry contacts, `sensor.robbie_dock_dock_error`, `sensor.side_battery`, `sun.sun`, `input_boolean.alert_banner_snooze`, `keep_garage_door_open`, `keep_side_door_open`, `cover.garage_door_v2` | Priority alert banner with Close door, Keep open, Snooze | **MERGE** | Now column, item 1 (`qg_now_item`, 2 rows). Same conditions, same priority order, same actions. Action buttons are now native `conditional` chips (no per-button JS `display`). The 2.4 s glow loop is replaced by one subtle ring pulse on priority 1 only. |
| 2 | `horizontal-stack` (header strip) | n/a | Layout wrapper | **DROP** | Replaced by one 12-column grid in a full-width section. |
| 2a | button-card greeting + clock (50 px) + temp + world-clock pills, tap opens weather pop-up | `sensor.time`, `weather.north_lakes_weather` | Time, greeting, weather, India and Austin clocks | **MERGE / MOVE / DROP** | Clock + date: top bar left (72 px). Weather: top bar chip, tap opens the weather pop-up (clock-weather-card kept). World clocks: **MOVE** to the person pop-up. "Good morning · 14th October · Sunny" greeting: **DROP** (repeats the date and the weather chip). |
| 2b | grid of 2 person pills with battery ring | `person.sushenmathur`, `person.paro`, `sensor.iphone_battery_level`, `sensor.iphone_battery_state`, `sensor.paro_phone_battery`, `sensor.paro_iphone_battery_state` | Presence and phone battery | **MERGE** | Top bar: two avatars with a presence dot and a place caption (`qg_person`). Battery moves into the person pop-up. The pulsing charging ring is **DROP** (looping animation). |
| 2c | grid of 5 quick actions | `scene.good_night`, `script.say_tts_message`, `script.lost_phone`, Wi-Fi image pop-up, `vacuum.robbie` | Shortcuts | **KEEP 4 / MOVE 1** | Good Night, Announce, Lost Phone, Wi-Fi become the equal 4-button scene row in the Home column. Robbie moves to Now (only while running or in error) and to the Living pop-up. All actions and pop-up contents are carried over. |
| 3 | grid of 6 `room_tile` | all lights / switches per room, `cover.garage_door_v2`, washer and dryer status, media players, kids occupancy | Room status and navigation | **KEEP** | Rooms column, 2 × 3 grid (`qg_room`). Same six rooms and the same "n on" logic. Per-room pastel tints and the scrolling marquee label are **DROP**; the tile tints with `--state-on` only while something in the room is on. Tap now opens a room pop-up (full controls) instead of navigating away. |

### Section 1 (aircon, media, favourite lights)

| # | Old card | Entities | Verdict | Where it went and why |
|---|---|---|---|---|
| 4 | `conditional` > tile TV, state not off (playback feature) | `media_player.tv` | **MERGE** | Now item "Media" (shows what is playing); full controls in the Media pop-up. |
| 5 | `conditional` > tile TV, state off (power on) | `media_player.tv`, `script.media_tv_power` | **DROP** | Same entity as #4 shown for the opposite state. "Off" no longer takes a box; power-on is the TV tile icon in the Media pop-up (`icon_tap_action` kept). |
| 6 | `conditional` > tile Aircon, running | `climate.living_room` | **MERGE** | Now item "Aircon on" (now covers all four zones); controls in the aircon pop-up. |
| 7 | `conditional` > tile Aircon, off | `climate.living_room` | **DROP** | Duplicate (same reasoning as #5). Switch-on lives in the Living pop-up (primary control). |
| 8–13 | 6 × `glass_toggle`: Kitchen Pendants, Dining, Media Room, Lamp, Corridor, Hallway | `light.kitchen_pendants`, `light.dining_light`, `light.sonoff_1000dbd8b7`, `switch.sonoff_100090d020`, `light.corridor_light`, `light.hallway_light` | **KEEP** | Favourites under the rooms, 2 columns, `qg_toggle`. "Kitchen Pendants" is shortened to "Pendants" and "Media Room" to "Media room" so the name never truncates. |

### Section 2 (calendar, cars, camera)

| # | Old card | Entities | Verdict | Where it went and why |
|---|---|---|---|---|
| 14 | calendar-card-pro (compact, 2 events, expands inline) | `calendar.supar_family` | **MERGE** | Home column: one "Next event" tile (native calendar attributes, no card). Tap opens the full agenda (calendar-card-pro, 7 days) in a pop-up. |
| 15 | `glass_chip` Sorento + `glass_vehicle` pop-up | `device_tracker.kia_gps_location`, `input_number.kia_battery_estimate`, `sensor.kia_charger_power`, `sensor.kia_last_charge_added`, `switch.kia_charger`, `input_boolean.kia_onroad`, `binary_sensor.kia_at_home` | **MOVE** | Garage view (picture + native tiles) and the Garage room pop-up. Charge power and the charger switch also sit in the Energy pop-up. The 100-line `glass_vehicle` template is **DROP** (picture + tiles do the same with no JS). |
| 16 | `glass_chip` Bluey + `glass_vehicle` pop-up | `device_tracker.bluey_location`, `sensor.bluey_battery_level`, `sensor.bluey_battery_range`, `sensor.bluey_charge_energy_added`, `sensor.bluey_charging`, `lock.bluey_lock`, `cover.bluey_trunk`, `switch.bluey_charge`, `input_boolean.tesla_onroad` | **MOVE** | Same as #15. |
| 17 | `picture-entity` front door snapshot + live-view pop-up | `camera.front_door_snapshot_2`, `camera.front_door_live_view_2` | **MOVE** | Security view (live camera grid plus the snapshot). A doorbell press pop-up needs an automation: see `redesign-followups.md`. |

### Section 3 (alerts, security, energy, appliances)

| # | Old card | Entities | Verdict | Where it went and why |
|---|---|---|---|---|
| 18 | wheelie-bin-card (visible 06:00–23:59 Mon and Sun) | `sensor.general_waste`, `sensor.garden_organics`, `sensor.recycling` | **MOVE** | Now item, evening before collection only (same weekdays, window narrowed to 16:00–23:59). Card kept: it understands the bin sensors' state format. |
| 19 | alert-ticker-card (hidden by a `visibility` rule, TTS and push config) | door contacts, `sensor.robbie_dock_dock_error`, `switch.sonoff_1000f6b15b`, `media_player.kitchen_speaker`, `tts.google_ai_tts`, `notify mobile_app_*` | **KEEP (headless)** | Not a visible card: it is the TTS and push notifier for door alerts, and it only works while the dashboard is open. Config kept verbatim, still hidden, parked at the end of the Now column. See followups for moving this to an automation. |
| 20 | mushroom-alarm-control-panel-card (always visible) | `alarm_control_panel.home_alarm` | **MERGE** | Now item only when armed or triggered; arm/disarm pop-up uses a native tile with the `alarm-modes` feature; Security view tile. Mushroom retired: a tile feature does the job. |
| 21 | mushroom-template garage door | `cover.garage_door_v2`, `input_select.garage_door_state`, `binary_sensor.garage_door_sensor_contact` | **DROP** | Duplicate of the alert banner, the Garage room tile, the Security view tile. Open/close and the state helper live in the Garage pop-up and view. |
| 22 | mushroom-template front door | `input_boolean.front_door`, `binary_sensor.front_door_contact`, `binary_sensor.crimsafe_door_contact` | **DROP** | Duplicate of the alert banner and Security. Lock toggle is in the Outdoor pop-up and Outdoor view. Status sentence reports "Front door unlocked". |
| 23 | button-card energy: stat row, animated flow, EV rows, self-powered bar | `sensor.sh50rs_a21c2106894_*`, `sensor.bluey_charger_power`, `sensor.kia_charger_power`, `sensor.daily_import_cost`, `sensor.daily_solar_credit`, `sensor.electricity_bill_to_date`, `sensor.electricity_estimated_bill`, `select.grid_import_tariff`, `sensor.current_energy_rate` | **MERGE** | Home column: hero number (home draw), solar / grid / car indicators, self-powered bar. Cost, tariff, rate and EV charging move into the Energy pop-up. Looping wire animation **DROP**. |
| 24 | mushroom-template washer | `sensor.washer_current_status`, `sensor.washer_remaining_time` | **MERGE** | Single Now item "Laundry running" for washer and dryer. |
| 25 | mushroom-template dryer | `sensor.dryer_current_status`, `sensor.dryer_remaining_time` | **MERGE** | Same Now item. |
| 26 | navbar-card (`template: main`) | n/a | **KEEP** | Still one template (`navbar-templates.main`). Light-count badge removed (not an alert); Security badge only for alert-grade open doors. |

Duplicates found on the old Home view: TV tile twice (on/off), aircon tile twice, garage door three times (alert banner, room tile, mushroom card) plus once more in the alert ticker, front door four times (banner, mushroom card, ticker, camera), washer and dryer twice (mushroom cards and the Laundry room tile), cars twice (chips and the vehicle pop-ups), two alert engines (banner and ticker), quick-action Robbie and the Living view Robbie section.

## 3. Other views

| View | Old cards | Verdict | New |
|---|---|---|---|
| **Security** | markdown header; heading Access; mushroom alarm; tile garage (cover-open-close); tile front lock (lock-commands); heading Doors; 7 door tiles; heading Cameras; advanced-camera-card (7 cameras); navbar; view badges (patio presence, patio motion, backyard motion) | KEEP / MERGE | Heading with the three badges; alarm = native tile with `alarm-modes`; the rest unchanged; added the front door snapshot picture. advanced-camera-card kept (no native multi-camera live grid). |
| **Lights** | markdown header; 3 headings; 20 tiles; Good Night badge | KEEP | Same groups and tiles. Good Night stays as a heading badge. 6–8 controls per section. |
| **Climate** | markdown header; mushroom "average temperature" badge; 4 × (sensor graph + thermostat dial) in a horizontal stack | MERGE | One section per zone: heading with the temperature badge, a tile with hvac-mode and target-temperature features (identical to the Home aircon pop-up), and the 12 h graph. Average temp is a `qg_chip`. Dials retired for the tile. |
| **Living Room** | markdown header; 3 motion badges; picture-elements; heading Robbie; mushroom-vacuum-card; 5 clean buttons | KEEP / MERGE | Heading + picture-elements kept. Robbie: tile with `vacuum-commands` replaces mushroom-vacuum; sixth button (Hallways, previously only in the Home pop-up) added so view and pop-up match. |
| **Garage** | mushroom chips header; garage-card; advanced-camera-card; 2 × glass_vehicle; 11 × glass_chip | KEEP / MERGE | garage-card and camera kept (custom, no native equivalent). Cars: heading, picture, native tiles. Added `input_select.garage_door_state` and `sensor.bluey_charging`. |
| **Kids Rooms** | markdown header; 2 mushroom chip rows; 2 cameras; 2 mushroom climate cards | MERGE | Heading badges replace the chips; tile climate replaces mushroom climate (same hvac modes cool, heat, off). Cameras kept. |
| **Outdoor** | markdown header; 3 headings; 12 tiles | KEEP | Unchanged content, tokens only. |
| **Laundry** | markdown header; mushroom "drying" badge; water-leak and door badges; 2 × washing-machine-card | KEEP / MERGE | washing-machine-card kept (no tile equivalent, rich data). Drying advisory becomes a `qg_chip` with the same rule; water-leak and door move to heading badges. |
| **Media** | homeii-music-flow panel | KEEP | Unchanged except `mobile_custom_color` (a hex literal, inert while `mobile_dynamic_theme_mode: auto`) removed. |
| **Screensaver** (new) | n/a | NEW | `saver` view, `Glass 2 Saver` theme. |

## 4. Consolidation

| Old template | New |
|---|---|
| `glass_action` | `qg_scene` |
| `room_tile` + `ticker` (marquee) | `qg_room` (marquee dropped) |
| `glass_toggle` | `qg_toggle` |
| `glass_chip`, `glass_popup_chip`, `glass_info_pill` | `qg_chip` |
| `glass_person`, `glass_person_pill` | `qg_person` |
| `world_clock` | `qg_stat` (instance with a time label) |
| `glass_vehicle` | dropped (native picture + tiles) |
| (new) base surface | `qg_card` |
| (new) Now column row | `qg_now_item` |

11 templates became 8. Every `qg_*` template inherits `qg_card`; state is expressed only through the custom properties `--qg-on` and `--qg-tone*` on the card, so there is no per-property JavaScript.
Mushroom: 17 cards → 0 (alarm → tile `alarm-modes`; vacuum → tile `vacuum-commands`; climate → tile `climate-hvac-modes` + `target-temperature`; chips → heading badges; template cards → `qg_now_item`; template badges → `qg_chip`).
`card_mod`: 20 blocks → 0 (the theme variables do the work).
Custom cards kept, each with no native equivalent: button-card, navbar-card, advanced-camera-card, garage-card, washing-machine-card, wheelie-bin-card, alert-ticker-card, calendar-card-pro, clock-weather-card, homeii-music-flow.

## 5. What changed under the hood

| Measure | Old | New |
|---|---|---|
| Hex literals in `master.yaml` | 38 | **0** |
| `rgba()` literals | 56 | **0** |
| Literal font sizes / radii | 14 / 12 | **0 / 0** (6 sizes and 2 radii plus pill, all `var(--…)`) |
| Font families | 1 (unset, theme default) | 1 (`Inter`, system-ui fallback) |
| Looping animations | 11 | **1** keyframe (`qg-pulse`), used on priority-1 alerts and a triggered alarm |
| `backdrop-filter` elements on Home | every card (19 declarations) | **1** (the navbar); pop-ups and the navbar pop-out only while open |
| Home cards rendered at rest | 47 nodes (all always on) | **26** (budget ~35; verified by `validate.py`) |
| Home cards with every item active | n/a | 35 top-level (an active alert adds up to 9 nested cards (its stack, four conditionals and up to four chips)) |
| `master.yaml` lines | 4 014 | 4 976 (longer because each room, person, energy and alarm pop-up is fully expanded; plain YAML, no anchors, because the raw editor drops them) |

## 6. Home information architecture (as built)

* **Top bar** (2 rows): time 72 px + date · status sentence (`All secure · 1 light on · Off-peak`, warning icon and text if a door is open or the front door is unlocked) · weather · two people.
* **Now** (column 1, conditional, priority order): alerts, doors open by day, alarm (armed or triggered), media, aircon, laundry, Robbie, kids in room after 20:00, bins, otherwise "Everything's calm". `validate.py` simulates 20 000 random states and fails if "calm" ever disagrees with the other items.
* **Rooms** (column 2): six tiles (2 × 3), then six favourite lights.
* **Home** (column 3): energy hero, next event, four scene buttons.
* **Navigation**: one `navbar-card` template on every view; Security badge only for alert-grade open doors.

## 7. Acceptance checks

| Check | Result |
|---|---|
| Home fits 1280 × 800 with no scroll, both modes | **Mock-up: yes.** Measured in headless Chromium at 1280 × 800: the tallest column ends at y = 712 in calm and busy scenes, light and dark (88 px spare). **On the device: not yet verified** (see section 1 and the followups checklist). Worst case (every Now item active at once) exceeds one screen by design; it needs 11 rows of 9. |
| 0 hex / rgba literals in `master.yaml` | **0** (checked by `validate.py`, which fails the build on any). |
| ≤ 2 radii, ≤ 6 font sizes, 1 font family | **2 + pill, 6, 1** (checked by `validate.py`). |
| Every entity from the old Home view reachable within 1 tap | **Yes: 107 of 107** (67 on Home, 38 in pop-ups, 2 via the Security view on the rail). Appendix below. Entities that only appear while active (bin sensors, `alert_banner_snooze`, `robbie_dock_dock_error`, alert-ticker internals) are conditional by design. |
| Text contrast ≥ 4.5:1 body, ≥ 7:1 primary labels, both modes | **Pass.** Primary text (`text-1`) is 14.6–17.9:1 in light and 11.3–17.7:1 in dark on every surface and state tint; secondary text (`text-2`) is 6.2–7.6:1 light and 5.8–9.2:1 dark; state "ink" colours on their tints are ≥ 5.6:1 (light) and ≥ 7.2:1 (dark). `Glass 2 Saver` (low luminance by design): `text-1` ≥ 7.5:1, `text-2` ≥ 5.0:1. 66 pairs are checked by `validate.py`, which fails below target; `validate.py -v` prints them all. |
| Touch targets ≥ 48 × 48 px | **Pass for every Quiet Glass card** (`min-height: var(--tap)`; rows are 56 px and up; the Home mock-up was measured in headless Chromium: every card, chip, nav item, scene, toggle, person and bin button is ≥ 48 px). **Exceptions** (native HA controls, not restyled): heading badges (≈ 28–32 px, informational), tile feature buttons (≈ 40 px), the hvac-mode segmented control inside tiles. |
| ≤ ~35 cards on Home | **26 at rest, 35 with everything active** |
| Backdrop blur: at most the navbar on Home | **Yes** (the navbar only; pop-ups while open) |
| No transition > 300 ms; `prefers-reduced-motion` honoured | **Yes** (150 ms / 220 ms tokens; reduced-motion rule in `qg_card`; pulse is the sole exception, 2.4 s, only for a priority-1 alert or a triggered alarm) |

Not verified (needs the real Home Assistant instance, listed again in `redesign-followups.md`): sections-view geometry variables, pop-up width variables, tile feature names on your HA version, heading badge options, the navbar-card badge class, `visibility` time conditions, and the saver `zoom`.


### Appendix: reachability of every entity the old Home view used (107)

Generated by walking the new Home view (cards, actions and pop-up content; `triggers_update` and `visibility` lists do not count). Service names that look like entity ids (`button.press`, `cover.close_cover`, `scene.turn_on`, `input_text.set_value`) and the alert-ticker's TTS engine id (`tts.google_ai_tts`) are excluded.

* **On Home (0 taps, shown or acted on directly)**: 67 entities. `alarm_control_panel.home_alarm`, `binary_sensor.crimsafe_door_contact`, `binary_sensor.front_door_contact`, `binary_sensor.garage_door_sensor_contact`, `binary_sensor.laundrydoorsensor_contact`, `binary_sensor.patio_door_contact`, `binary_sensor.samar_room_occupancy_new`, `binary_sensor.shanaya_room_occupancy_status`, `binary_sensor.side_door_contact`, `calendar.supar_family`, `climate.living_room`, `cover.garage_door_v2`, `input_boolean.alert_banner_snooze`, `input_boolean.front_door`, `input_boolean.keep_garage_door_open`, `input_boolean.keep_side_door_open`, `light.aarlo_samar_cam`, `light.backyard_light`, `light.corridor_light`, `light.dining_light`, `light.driveway_light`, `light.garage_light`, `light.hallway_light`, `light.kitchen_downlights`, `light.kitchen_pendants`, `light.kitchenled`, `light.laundry_light`, `light.sonoff_1000dbd8b7`, `light.tall_lamp`, `media_player.aarlo_`, `media_player.bedroom_apple_tv`, `media_player.bluey_media_player`, `media_player.browser_`, `media_player.home_speakers_2`, `media_player.hubs_bedroom_apple_tv`, `media_player.kitchen_speaker`, `media_player.media_apple_tv`, `media_player.tv`, `person.paro`, `person.sushenmathur`, `scene.good_night`, `script.lost_phone`, `script.say_tts_message`, `select.grid_import_tariff`, `sensor.bluey_charger_power`, `sensor.dryer_current_status`, `sensor.dryer_remaining_time`, `sensor.garden_organics`, `sensor.general_waste`, `sensor.kia_charger_power`, `sensor.recycling`, `sensor.robbie_dock_dock_error`, `sensor.sh50rs_a21c2106894_mppt_total_power`, `sensor.sh50rs_a21c2106894_purchased_power`, `sensor.sh50rs_a21c2106894_total_export_active_power`, `sensor.side_battery`, `sensor.washer_current_status`, `sensor.washer_remaining_time`, `sun.sun`, `switch.bedroom_tv`, `switch.patio_lights`, `switch.sonoff_100053e676`, `switch.sonoff_1000905c71`, `switch.sonoff_100090d020`, `switch.sonoff_1000f6b15b`, `vacuum.robbie`, `weather.north_lakes_weather`
* **One tap (pop-up)**: 38 entities. `binary_sensor.austin_daytime`, `binary_sensor.hyd_daytime`, `binary_sensor.kia_at_home`, `button.robbie_coffee_station_clean`, `button.robbie_hallways`, `button.robbie_kitchen_clean`, `button.robbie_media_clean`, `button.robbie_media_kitchen2`, `button.robbie_tiled_area_clean`, `cover.bluey_trunk`, `device_tracker.bluey_location`, `device_tracker.kia_gps_location`, `input_boolean.kia_onroad`, `input_boolean.tesla_onroad`, `input_number.announce_volume`, `input_number.kia_battery_estimate`, `input_select.announce_speaker`, `input_select.garage_door_state`, `input_text.announce_message`, `lock.bluey_lock`, `script.announce_from_helpers`, `script.media_tv_power`, `sensor.bluey_battery_level`, `sensor.bluey_battery_range`, `sensor.bluey_charge_energy_added`, `sensor.bluey_charging`, `sensor.current_energy_rate`, `sensor.daily_import_cost`, `sensor.daily_solar_credit`, `sensor.electricity_bill_to_date`, `sensor.electricity_estimated_bill`, `sensor.iphone_battery_level`, `sensor.iphone_battery_state`, `sensor.kia_last_charge_added`, `sensor.paro_iphone_battery_state`, `sensor.paro_phone_battery`, `switch.bluey_charge`, `switch.kia_charger`
* **One tap on the navigation rail (Security view)**: `camera.front_door_live_view_2`, `camera.front_door_snapshot_2`.

Nothing is missing and nothing is deeper than one tap. Entities listed under Home that only appear while something is active (for example `alarm_control_panel.home_alarm` when armed) are also one tap away at rest: on the Security view (alarm), the room pop-ups (vacuum, washer, dryer, TV) or the Climate view.
