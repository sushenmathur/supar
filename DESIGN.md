---
name: SuPar Home
description: The family's wall-tablet Home dashboard, printed like hand-blocked cotton.
colors:
  blued-cotton: "#e9eef7"
  cloth: "#f7f9fd"
  indigo-ink: "#1b2559"
  faded-indigo: "#47527f"
  key-line: "rgba(27, 37, 89, 0.42)"
  turmeric: "#f0ae2e"
  turmeric-ink: "#2a1c00"
  madder: "#b4362b"
  madder-text: "#9e2c22"
  dabu-green: "#2f6a3e"
  weather-ochre: "#9a6200"
  indigo-night: "#0f1636"
  night-cloth: "#172150"
  night-ink: "#eef1fb"
  night-faded: "#b4bde2"
  night-key-line: "rgba(226, 231, 250, 0.34)"
  night-overprint-line: "rgba(10, 14, 40, 0.55)"
  night-well: "#e3e8fb"
  night-turmeric: "#f2b53f"
  night-madder: "#c0402e"
  night-madder-text: "#ff9a85"
  night-dabu: "#93d0a2"
  lid-charcoal: "#5b6170"
  lid-yellow: "#e8c21c"
  lid-green: "#3f9a52"
  lid-red: "#c8372b"
  monogram-indigo: "#3a4aa6"
  monogram-aubergine: "#6b4a8e"
typography:
  display:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "88px"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  reading:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  display-suffix:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
  headline:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.3
  stamp:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  figure:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.1
    fontFeature: "tnum"
  figure-small:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    fontFeature: "tnum"
  title:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.3
  label:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.15
  badge:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 700
    fontFeature: "tnum"
  stamp-day:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.06em"
rounded:
  meter: "2px"
  date: "4px"
  control: "5px"
  well: "5px 4px 6px 4px"
  block: "6px 5px 7px 5px"
  sheet: "7px"
spacing:
  inner: "10px"
  gutter: "12px"
  column: "16px"
  block-pad: "12px"
components:
  tile:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.indigo-ink}"
    rounded: "{rounded.block}"
    padding: "6px 12px"
    height: "48px"
  tile-on:
    backgroundColor: "{colors.turmeric}"
    textColor: "{colors.turmeric-ink}"
    rounded: "{rounded.block}"
  tile-alert:
    backgroundColor: "{colors.madder}"
    textColor: "#ffffff"
    rounded: "{rounded.block}"
  tile-two-line:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.indigo-ink}"
    rounded: "{rounded.block}"
    padding: "7px 10px"
  icon-well:
    backgroundColor: "{colors.indigo-ink}"
    textColor: "{colors.cloth}"
    rounded: "{rounded.well}"
    size: "40px"
  icon-well-small:
    backgroundColor: "{colors.indigo-ink}"
    textColor: "{colors.cloth}"
    rounded: "{rounded.well}"
    size: "32px"
  icon-well-flow:
    backgroundColor: "{colors.indigo-ink}"
    textColor: "{colors.cloth}"
    rounded: "{rounded.well}"
    size: "44px"
  tab:
    textColor: "{colors.faded-indigo}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "48px"
  tab-current:
    backgroundColor: "{colors.turmeric}"
    textColor: "{colors.turmeric-ink}"
    rounded: "{rounded.control}"
  count-badge:
    backgroundColor: "{colors.indigo-ink}"
    textColor: "{colors.cloth}"
    typography: "{typography.badge}"
    rounded: "{rounded.date}"
    height: "20px"
  count-badge-alert:
    backgroundColor: "{colors.madder}"
    textColor: "#ffffff"
    typography: "{typography.badge}"
    rounded: "{rounded.date}"
    height: "20px"
  button-on-alert:
    backgroundColor: "#ffffff"
    textColor: "{colors.madder}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-armed:
    backgroundColor: "{colors.turmeric}"
    textColor: "{colors.turmeric-ink}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  segment:
    textColor: "{colors.indigo-ink}"
    rounded: "{rounded.control}"
    height: "48px"
  segment-current:
    backgroundColor: "{colors.indigo-ink}"
    textColor: "{colors.cloth}"
    rounded: "{rounded.control}"
  sheet:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.indigo-ink}"
    rounded: "{rounded.sheet}"
    padding: "22px 24px"
  sheet-action:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.indigo-ink}"
    rounded: "{rounded.block}"
    height: "52px"
  sheet-action-armed:
    backgroundColor: "{colors.madder}"
    textColor: "#ffffff"
    rounded: "{rounded.block}"
    height: "52px"
  field:
    backgroundColor: "{colors.blued-cotton}"
    textColor: "{colors.indigo-ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "48px"
---

> This is the block print system used by `www/kiosk-home/`. The glass version, `www/kiosk-home-glass/`, uses Warm Stone Glass, specified in `dashboards/kiosk-redesign/DESIGN.md`.


# Design System: SuPar Home

## Overview

**Creative North Star: "The Block-Printed Wall Cloth"**

The home is a length of hand-blocked cotton pinned to the kitchen wall. Every block of content is a cloth panel outlined by an indigo key line, pressed by hand, so the line is heavier on the top and left edges and the corners are never quite equal. Nothing glows, floats or frosts. State is not a badge or a toggle switch: it is a second colour pass printed over the block, turmeric when something is on, madder when something needs attention, and that pass lands slightly out of register with the key line, the way a real second block does.

The surface is dense and fixed: a single 1280 by 800 landscape stage on a wall tablet, read from across the room and tapped up close. Calm is the resting state (cloth, indigo, nothing printed over it); colour only arrives with meaning, so a glance across the kitchen counts the turmeric and madder blocks and knows what is happening. Light and dark follow the device: by day, indigo ink on neel-blued cotton; by night, the cloth is indigo-dyed and the ink turns pale.

**Key Characteristics:**
- Indigo key line on every block, hand-weighted (2px top and left, 1.5px right and bottom) with unequal corners.
- State printed as a flat colour pass, offset 3px down and right, overprinting the key line.
- Carved icon wells: solid indigo squares with the line icon cut out of them.
- A printed buti border repeat used sparingly as a selvedge edge.
- One humanist family (Hind) at heavy weights, tabular figures for every number.
- Flat throughout: no shadows, no gradients, no glass.

## Colors

A small dyer's palette: indigo ink and blued cotton for structure, three natural dyes for state.

### Primary
- **Indigo Ink** (light `indigo-ink`, dark `night-ink`): all primary text, the icon wells, the neutral count badge, meter outlines, the energy flow arrows and the current alarm segment. In dark mode the ink turns pale and the wells become pale blocks with indigo cut-outs (`night-well`).
- **Key Line** (`key-line`, dark `night-key-line`): the translucent indigo outline of every block, date stamp, field and segment, and the internal rules in the clock and energy blocks.
- **Overprint Line** (`night-overprint-line`, dark mode only): the key line redrawn above an opaque colour pass, so the outline still prints over turmeric and madder at night.

### Secondary
- **Turmeric** (`turmeric`, dark `night-turmeric`): the "on" pass. Lit lights, a charging car, the current tab, an armed confirm button on the alert banner, the self-powered meter and the 3px focus ring. Text on it is always **Turmeric Ink** (`turmeric-ink`), never white; subtitles on it are Turmeric Ink at 78%.
- **Weather Ochre** (`weather-ochre`, dark `night-turmeric`): the weather icon beside the temperature, and nothing else. A deep turmeric that holds contrast as a line on cloth; it is an icon colour, never a pass.

### Tertiary
- **Madder** (`madder`, dark `night-madder`): the "needs attention" pass. Alert banner, alert tiles, the Security count badge, an armed destructive sheet action, the error toast, a low phone battery. Madder never appears when all is well. Text on it is solid white (#fff) in both modes, subtitles included. Where madder must be read as text on cloth (connection status, full-page errors) use **Madder Text** (`madder-text`, dark `night-madder-text`), a deeper or lighter shade that holds contrast.
- **Dabu Green** (`dabu-green`, dark `night-dabu`): quiet "all is well" text only: someone is Home, alarm disarmed and OK, solar credit sold, a charging phone. It is never a block fill.

### Neutral
- **Blued Cotton** (`blued-cotton`, dark `indigo-night`): the page ground the blocks sit on, and the fill of form fields inside sheets.
- **Cloth** (`cloth`, dark `night-cloth`): every block's fill, the sheet surface, and the figure inside a neutral count badge.
- **Faded Indigo** (`faded-indigo`, dark `night-faded`): secondary lines, subtitles, inactive tab labels, the clock suffix, block-head counts, and the buti petals in dark mode.

### Named Rules
**The Two Passes Rule.** A block carries at most one colour pass: turmeric for on, madder for attention. Calm blocks carry none. Never invent a third fill colour for state; green speaks only as text.

**The Overprint Rule.** In light mode the pass prints with `multiply` blending so the key line shows through it; in dark mode the pass is opaque (`normal`), so the key line is redrawn above it in the Overprint Line. The overprint is the look, not a bug to clean up.

**The Real Things Exception.** Literal object colours stay literal: the family's monogram colours (`monogram-indigo`, `monogram-aubergine`, kept clear of the state colours) and the bin-lid swatches (`lid-red` for general waste, `lid-yellow`, `lid-green`, `lid-charcoal`) are the actual colours of those things. The red lid is the one red that isn't an alert, because it's the bin's real colour. They are recorded so they read as intentional, but they are not UI colours: never use them for text, fills, passes or ornament.

## Typography

**Display Font:** Hind (self-hosted, 400 to 700), falling back to system-ui
**Body Font:** Hind
**Label Font:** Hind

**Character:** One sturdy humanist sans, used heavy. Hind's open Devanagari-heritage shapes suit the Indian-textile world and stay legible at kitchen distance; hierarchy comes from size and weight, never from a second family.

### Hierarchy
The ramp ships in five groups. Every size in the build belongs to one of them.

- **Clock** (`display` 600, 88px, line-height 0.9, -0.03em; `reading` 700, 30px, -0.02em; `display-suffix` 600, 24px): the clock face only. The 88px time, the 30px outdoor temperature beside the weather icon, and the 24px AM/PM suffix in Faded Indigo.
- **Headline** (`headline` 700, 22px): sheet (dialog) titles and the keys of the announce keypad.
- **Figures** (`stamp` 700, 20px, line-height 1; `figure` 700, 19px; `figure-small` 700, 18px): key numbers inside blocks. 20px is the calendar date-stamp numeral; 19px the world-clock times and the energy flow figures; 18px the energy stats, the banner title and the monogram initial. The brand wordmark sits at 19px 700, and the full-page loading or error message at 19px 600.
- **Names and Body** (`title` 700, 16px, line-height 1.15; `body` 500, 15px, line-height 1.3): block heads (Lights, Energy, Family calendar) at 16px; every tile name at 15.5px, stepping to 14.5px in the six-up rows; default page text and buttons at 15px, banner subtitles at 14px.
- **Labels and Marks** (`label` 600, 13.5px; `badge` 700, 12.5px; `stamp-day` 700, 11px, 0.06em, uppercase): the subtitle line under every name at 13.5px (13px in dense rows, block-head counts and zone captions); tab count badges at 12.5px; the weekday abbreviation on a calendar date stamp at 11px.

### Named Rules
**The Tabular Figures Rule.** Every live number (clock, temperatures, percentages, kWh, money, counts, dates) is set with tabular figures so values do not jitter as they update.

**The Heavy Hand Rule.** Nothing on the stage is lighter than 500. Names and figures are 700; supporting lines are 600. Thin type does not survive the across-the-kitchen glance.

## Layout

A fixed 1280 by 800 stage, centred and uniformly scaled to fit the device viewport (inside the kiosk app's insets); the page itself never scrolls. The stage is a 68px tab bar (the 48px tabs over the 16px buti strip, inside the key line, so the strip prints whole) above a two-column body: a 328px day column (clock and weather, two world clocks, people, family calendar, cars) and a fluid work grid, separated by a 16px column gap.

The work grid stacks a 56px status banner, a 62px six-up row of quick actions, an 80px six-up row of rooms, and a lower band of three stacks in 1.15 : 1 : 0.95 proportion: the TV and Aircon pair (62px) above the lights block; energy above an 84px row of three utility tiles; and the 112px alarm, two 56px door tiles and the camera. The gutter between blocks is 12px everywhere inside the grid and between the tab bar and the body, 10px inside tight groups (zones, people, cars, utilities, lights). Blocks pad 12px; dense tiles pad 6px 10px.

**The One Stage Rule.** Design at 1280 by 800 and let the stage scale; do not reflow into breakpoints. Rows that can overflow clamp or ellipsize their text instead of growing.

**The 48px Floor Rule.** Every tappable thing (tile, tab, button, segment, field) is at least 48px tall; sheet actions are 52px.

## Elevation & Depth

None. The system is flat ink on cloth: no box shadows, no blur, no gradients on blocks. Depth is printed, not lit. The only sense of layering is the colour pass sitting 3px off its key line (with the key line redrawn over it at night), and the sheet's backdrop dimming the stage with indigo at 55%. The camera caption's dark scrim is a legibility device over a photograph, not elevation.

**The Printed, Not Lifted Rule.** If something needs to stand out, give it a colour pass or a carved well, never a shadow.

## Shapes

Square-ish and hand-made. Blocks round to unequal corners (6, 5, 7, 5px clockwise from top left); icon wells and monograms to 5, 4, 6, 4px; the sheet to 7px; controls (tabs, buttons, segments, fields) to an even 5px; calendar date stamps and count badges to 4px; meters (battery, self-powered) to 2px. Outlines use the key-line weighting (2px top and left, 1.5px right and bottom) on blocks, date stamps, segments, fields and the sheet; internal rules are a single 1.5px key line.

The **buti** is the system's one ornament: a 22 by 16px repeat of a five-petal printed flower with a small dot between repeats, run as a 16px border strip. By day the petals are solid Indigo Ink with a Cloth centre; by night they are Faded Indigo (`night-faded`) with a Night Cloth centre. It is never printed in a state colour. It is retired: the owner removed it from the tab bar and the clock block, so the system now has no ornament. The flowers are kept here only as a record.

**The Uneven Corner Rule.** Block and well corners are deliberately unequal. Do not "fix" them to a uniform radius.

## Components

### Block (the base container)
Every container is a block: cloth fill, hand-weighted key line, unequal corners. Content sits above two pseudo-layers: the optional colour pass, and above it the dark-mode Overprint Line.
- **On:** turmeric pass, offset 3px right and down, text turns Turmeric Ink and subtitles 78% of it.
- **Alert:** madder pass, same offset, text and subtitles solid white, and the icon well inverts to a near-white square (92% white) with a madder icon.
- **Dark mode:** the pass is opaque, and the key line is redrawn above it in the Overprint Line on on and alert blocks.
- **Unavailable:** the whole block at 50% opacity, disabled.
- **Motion:** when a pass appears it prints in, sliding from register to its 3px offset over 0.34s on a quick ease-out, unless reduced motion is requested. A pressed tile nudges 1px down and right.
- **Living motion (state only, transform/opacity only):** energy flow lines march their dashes in the direction power moves (13.2s for 12 dash steps); the icon of something running (Robbie cleaning, washer, dryer) turns slowly (three turns per 9.6s); an urgent banner's madder pass drifts 2px; the clock stamps (scale .965 to 1, 0.26s) when the minute changes; a view fades up 6px over 0.18s when opened. Re-rendered animations resume at their current phase. All of it pauses while the kiosk screensaver is up or the page is hidden, and none of it runs under reduced motion.
- **Ambient:** a faint wash across the top 260px of the ground follows `sun.sun`: turmeric at dawn, madder at dusk, deeper indigo at night, none by day. It changes only when the sun's phase does.
- **Weather picture:** the clock card's weather is a printed picture (sun, moon, cloud, sun and cloud, rain) in turmeric and cloth with an ink key line, not a line icon.

### Tiles
The everyday control: a block with a carved icon well, a 700-weight name and a 600-weight subtitle. Two anatomies ship:
- **Side-by-side:** a 40px well on the left, name over subtitle on the right (36px well in the lights block, 34px for cars). Used for people, cars, lights and door tiles. Light names clamp to two lines.
- **Two-line:** a 32px well (20px icon) and the name share a 32px first line; the subtitle takes its own full-width second line below, and the content sits top-aligned in the tile (7px 10px padding), so tiles in a row read from the same top edge however long their summaries run. Used in the quick-action row, the room row and the TV and Aircon pair. The six-up rows let the subtitle run to two lines; the pair keeps it to one line with an ellipsis.
- **Stacked:** the three utility tiles (bins, washer, dryer) stack a 30px well above the name and subtitle.

### Icon Well
A solid indigo square with a line icon knocked out in cloth colour: 40px with a 24px icon by default, 44px with a 26px icon in the energy flow, 30 to 36px in dense tiles. Icons are a single in-house sprite at a 2.1 stroke with round caps and joins. Monograms for people reuse the 40px well shape with an 18px white initial on the person's monogram colour.

### Navigation (tab bar)
A full-width block: brand wordmark ("SuPar" 700 with "Home" in Faded Indigo 500), then text-and-icon tabs (48px, 600, Faded Indigo, 20px icons). The current tab is a turmeric fill with Turmeric Ink text, not an underline. Count badges (20px tall, 12.5px 700, 4px corners) sit inside a tab: a neutral count (Lights) is a solid ink badge with a cloth figure, carved like an icon well (pale with an indigo figure in dark); only a count that is a problem (Security) is madder with a white figure. The last tab, More, opens a sheet rather than a page. The connection status sits right-aligned in Madder Text. The bar has no ornament.

### Status Banner
A 56px block across the work grid. Calm: no pass, ink text. Alert: madder pass with action buttons; the primary action is a white button with madder text, secondary actions are white-outlined, and a two-tap confirm turns the button turmeric ("armed") before it acts.

### Segmented Buttons (alarm modes)
Key-line outlined 48px buttons in a two-up grid; the current mode is a solid indigo well fill with cloth text.

### Meters and Flow
Battery and self-powered meters are a 1.5px ink outline at 2px radius with a flat fill (ink, turmeric for self-powered, madder when low, dabu when charging). The energy flow joins three 44px wells, each over a 19px figure and a label, with 2px dashed ink arrows that fade to the key line when idle. Energy stats sit in one key-line grid inside their block, not in boxes within the block.

### Sheet (dialog)
A 560px cloth panel with the key-line outline and 7px corners, 22px headline, Faded Indigo body, a grid of 52px tile actions (icon inline, no well) and a full-width Close. Fields inside are 48px, blued-cotton fill with the key-line outline. A destructive action confirms in two taps: the first tap prints the madder pass on its tile and changes its label to "Tap again to…", and the tile reverts after three seconds. The More sheet holds Phones, Settings, Dev tools and a two-tap Restart Home Assistant.

### Toast and Message
The toast is a madder bar with white 600 text, bottom centre, 6px corners. The full-page loading or error message sits on the ground in 19px 600; errors use Madder Text.

## Do's and Don'ts

### Do:
- **Do** put every container on cloth with the hand-weighted key line (2px top and left, 1.5px right and bottom) and the unequal block corners.
- **Do** show state as a colour pass printed 3px out of register: turmeric for on, madder for attention, nothing for calm.
- **Do** carve icons out of solid indigo wells; keep icons in the one sprite at a 2.1 stroke.
- **Do** set every live number in tabular figures, names at 700, supporting lines at 600.
- **Do** use Madder Text, not Madder, wherever red must be read as text on cloth, and solid white wherever text sits on a madder pass.
- **Do** keep every tappable target at least 48px tall and design on the fixed 1280 by 800 stage.
- **Do** define every colour for both light and dark; dark mode prints the pass `normal` instead of `multiply` and redraws the key line above it.
- **Do** confirm a destructive or alarming action in two taps, armed by a colour pass.

### Don't:
- **Don't** use shadows, blur, glass or gradients on blocks; depth is printed, not lifted.
- **Don't** put white text on turmeric, or fill a block with dabu green.
- **Don't** add a third state colour or a second accent; the dyes carry meaning, not decoration.
- **Don't** use the monogram or bin-lid colours anywhere but the monogram and the lid swatches.
- **Don't** add ornament (the buti strip was tried and removed); the print reads through the colour passes, key lines and carved wells alone.
- **Don't** even out the block corners or the key-line weights.
- **Don't** introduce a second typeface or weights below 500.
