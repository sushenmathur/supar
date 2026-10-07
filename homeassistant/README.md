# Glass dashboard: Home Assistant config

Implements design **B5** (see `../dashboards/option-b5-popups.html`): glass cards that follow the system
light/dark mode, B's layout, A's energy card, and glass popups.

## Files

| File | What it is |
|---|---|
| `themes/glass.yaml` | Theme with light and dark glass variables, card styling, popup colours |
| `dashboard/templates.yaml` | `button_card_templates` and `navbar-templates` blocks (same seven routes, badges and popups) |
| `dashboard/home-view.yaml` | The redesigned `hubhome` view |

## Install

1. **Cards needed** (you already use all of them): button-card, card-mod, mushroom, navbar-card,
   clock-weather-card, calendar-card-pro, wheelie-bin-card, alert-ticker-card, browser_mod.
   Recommended: **kiosk-mode** (HACS) to hide the HA header and sidebar so the view fits one screen.
2. **Theme:** copy `themes/glass.yaml` to `/config/themes/glass.yaml`. Make sure `configuration.yaml` has
   `frontend: themes: !include_dir_merge_named themes`. Developer tools > YAML > *Reload themes*.
   On the tablet's profile choose Theme **Glass** and Dark mode **Auto**.
3. **Dashboard:** open the dashboard, pencil > three dots > *Raw configuration editor*.
   - Replace the `button_card_templates:` and `navbar-templates:` blocks with `dashboard/templates.yaml`.
   - Replace the first view (`path: hubhome`) with `dashboard/home-view.yaml`.
   - Leave the other views alone. They pick up the glass theme and the same nav automatically.
4. **Try it on a copy first.** Duplicate the dashboard and apply it there before touching the live one.

## What changed and what did not

- **Unchanged:** every entity ID, script, scene, tap action and browser_mod popup (Lost Phone, WiFi,
  Media, Robbie), the navbar routes, badges and submenus, the conditional bin and laundry cards, the alert ticker.
- **Changed:** layout, glass styling, vehicles and room occupancy moved from badges to status chips
  (only the low-battery camera badge stays a badge), people are compact cards, stat circles are now one energy card.
- **Background:** not set by the theme. Your view's own background image is kept, so the glass blurs the system background.

## Known assumptions (not testable outside your Home Assistant)

- Written against the card types and entity IDs in your current config; **not run against a live instance**.
  Checked: YAML validity and JavaScript syntax of every template.
- The theme styles all `ha-card` elements through card-mod's `card-mod-card`. If a card should stay plain, add
  `card_mod: style: "ha-card { background: none; border: none; box-shadow: none; }"` to it.
- The clock and people cards re-render when any entity changes (`triggers_update: all`), the same approach your
  world clocks use. If the time lags, add a `sensor.time` entity to the greeting card's `triggers_update`.
- Row heights in the sections grid (`rows:`) and the 96px tile heights are tuned for a 16:10 tablet at roughly
  1470 x 920 CSS px. Adjust `rows` or the `height:` values if anything scrolls.
- browser_mod popups take colour and radius from the theme (`popup-*` variables). Blur behind the popup is not
  available through the theme, so they are slightly more opaque than the mockup.
