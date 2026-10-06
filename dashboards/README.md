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
