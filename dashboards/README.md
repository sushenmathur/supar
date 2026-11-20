# Home dashboard concepts

Three interactive mockups (open the `.html` files; tiles toggle on click) for the `hubhome` view on a
16:10 wall tablet (Lenovo Idea Tab Pro, landscape). Each is a 1600×1000 stage that scales to fit.
`./shoot.sh` regenerates `previews/*.png` with headless Chromium.

| Option | Look | Layout idea |
|---|---|---|
| A – Aurora | Dark glass on aurora gradients | 3-column bento, bottom dock nav |
| B – Daylight | Light frosted glass, pastel | Side rail, header strip, rooms as a row |
| C – Obsidian | Near-black, cyan/amber glow | Top status bar, energy flow as hero, round favourites |

All content comes from the existing config: Quick actions, world clocks, weather, both person trackers,
vehicle and room-occupancy badges, calendar, rooms, favourites (TV, Aircon, 6 lights), alarm, garage and
front door, energy (stats, flow, Tesla/Kia, self-powered) and Robbie. Navigation keeps the same seven routes.
Conditional items (bin collection, washer/dryer, alert ticker, low-battery camera badge) are not shown at rest;
they would appear as pills or overlays in the same space.

## November 2026 redesign options

Three new options for the Home view (`hubhome`), on the same 1600×1000 stage. Each has a light and a dark
theme that follows the system setting; press **T** to switch, or add `?theme=dark` to the URL.
Previews: `previews/redesign-<option>-light.png` and `-dark.png`. Data lives in `redesign-data.js`.

| Option | Idea | Navigation | What leads |
|---|---|---|---|
| A – Swatch (`redesign-a-swatch.html`) | Rooms as paint-chip swatches: a quiet room is a pale tint, an active room is full colour | Dark side rail | Room swatches; lit lights turn lamp amber |
| B – Almanac (`redesign-b-almanac.html`) | A tide-table style day ribbon: solar curve, sunrise and sunset, tariff periods, calendar events and a "now" line | Tabs across the top | Today's timeline, then a one-list "House" status |
| C – Classic (`redesign-c-canon.html`) | The standard smart-home app layout (category chips, scenes, favourites, rooms), done carefully | Side bar with people and cars | Status chips and favourite tiles |

Notes:
- Sorento and Bluey are shown alongside Kia and Tesla charging (Sorento is the Kia, Bluey the Tesla), so cars appear once.
- The tariff bands in option B (shoulder, off-peak 9 am–4 pm, peak 4–9 pm) and the solar curve shape are illustrative.
  Wire them to the real tariff and Solcast/solar forecast sensors before building.
- The front door still is cropped from `previews/home-view-current.webp`.
- Fonts are self-hosted in `fonts/` (Figtree for A, Atkinson Hyperlegible Next for B, Roboto for C). In Home Assistant
  they would load through the theme's font loader.
