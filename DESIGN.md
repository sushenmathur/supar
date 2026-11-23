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
  indigo-night: "#0f1636"
  night-cloth: "#172150"
  night-ink: "#eef1fb"
  night-faded: "#b4bde2"
  night-well: "#e3e8fb"
  night-turmeric: "#f2b53f"
  night-madder: "#c0402e"
  night-madder-text: "#ff9a85"
  night-dabu: "#93d0a2"
typography:
  display:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "88px"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Hind, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.3
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
  icon-well:
    backgroundColor: "{colors.indigo-ink}"
    textColor: "{colors.cloth}"
    rounded: "{rounded.well}"
    size: "40px"
  tab:
    textColor: "{colors.faded-indigo}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "48px"
  tab-current:
    backgroundColor: "{colors.turmeric}"
    textColor: "{colors.turmeric-ink}"
    rounded: "{rounded.control}"
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
  count-badge:
    backgroundColor: "{colors.madder}"
    textColor: "#ffffff"
    rounded: "{rounded.date}"
    height: "20px"
  sheet:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.indigo-ink}"
    rounded: "{rounded.sheet}"
    padding: "22px 24px"
  field:
    backgroundColor: "{colors.blued-cotton}"
    textColor: "{colors.indigo-ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "48px"
---

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
- **Indigo Ink** (light `indigo-ink`, dark `night-ink`): all primary text, the icon wells, meter outlines, the energy flow arrows and the current alarm segment. In dark mode the ink turns pale and the wells become pale blocks with indigo cut-outs (`night-well`).
- **Key Line** (`key-line`, dark rgba(226, 231, 250, 0.34)): the translucent indigo outline of every block, date stamp, field and segment, and the internal rules in the clock and energy blocks.

### Secondary
- **Turmeric** (`turmeric`, dark `night-turmeric`): the "on" pass. Lit lights, a charging car, the current tab, an armed confirm button, the self-powered meter and the 3px focus ring. Text on it is always **Turmeric Ink** (`turmeric-ink`), never white.

### Tertiary
- **Madder** (`madder`, dark `night-madder`): the "needs attention" pass. Alert banner, alert tiles, the Security count badge, the error toast, a low phone battery. Madder never appears when all is well. Text on it is white. Where madder must be read as text on cloth (connection status, full-page errors) use **Madder Text** (`madder-text`, dark `night-madder-text`), a deeper or lighter shade that holds contrast.
- **Dabu Green** (`dabu-green`, dark `night-dabu`): quiet "all is well" text only: someone is Home, alarm disarmed and OK, solar credit, a charging phone, the calm ticker dot. It is never a block fill.

### Neutral
- **Blued Cotton** (`blued-cotton`, dark `indigo-night`): the page ground the blocks sit on, and the fill of form fields inside sheets.
- **Cloth** (`cloth`, dark `night-cloth`): every block's fill and the sheet surface.
- **Faded Indigo** (`faded-indigo`, dark `night-faded`): secondary lines, subtitles, inactive tab labels, clock suffix, small headers' counts.

### Named Rules
**The Two Passes Rule.** A block carries at most one colour pass: turmeric for on, madder for attention. Calm blocks carry none. Never invent a third fill colour for state; green speaks only as text.

**The Overprint Rule.** In light mode the pass prints with `multiply` blending so the key line shows through it; in dark mode it prints `normal`. The overprint is the look, not a bug to clean up.

**The Real Things Exception.** Literal object colours stay literal: the family's monogram colours (a deep indigo and an aubergine, kept clear of the state colours) and the bin-lid swatches (charcoal, yellow, green) are the actual colours of those things and are not system tokens.

## Typography

**Display Font:** Hind (self-hosted, 400 to 700), falling back to system-ui
**Body Font:** Hind
**Label Font:** Hind

**Character:** One sturdy humanist sans, used heavy. Hind's open Devanagari-heritage shapes suit the Indian-textile world and stay legible at kitchen distance; hierarchy comes from size and weight, never from a second family.

### Hierarchy
- **Display** (600, 88px, line-height 0.9, -0.03em): the clock only. The AM/PM suffix drops to 24px in Faded Indigo.
- **Headline** (700, 22px): sheet (dialog) titles.
- **Title** (700, 15.5 to 16px, line-height 1.15): block heads (Lights, Energy, Family calendar) and every tile's name. Key figures inside blocks step up to 18 to 19px at 700 (zone times, energy stats, banner title); the temperature reads at 30px.
- **Body** (500, 15px, line-height 1.3): default page text and buttons.
- **Label** (600, 13 to 13.5px): the subtitle line under every name, block-head counts, zone captions. Single line with ellipsis, or clamped to two lines in the dense six-up rows.

### Named Rules
**The Tabular Figures Rule.** Every live number (clock, temperatures, percentages, kWh, money, counts, dates) is set with tabular figures so values do not jitter as they update.

**The Heavy Hand Rule.** Nothing on the stage is lighter than 500. Names and figures are 700; supporting lines are 600. Thin type does not survive the across-the-kitchen glance.

## Layout

A fixed 1280 by 800 stage, centred and uniformly scaled to fit the device viewport (inside the kiosk app's insets); the page itself never scrolls. The stage is a 60px tab bar above a two-column body: a 328px day column (clock and weather, two world clocks, people, family calendar, cars) and a fluid work grid, separated by a 16px column gap.

The work grid stacks a 58px status banner, two six-up rows of 66px tiles (quick actions, then rooms), and a lower band of three stacks (media and lights; energy and utilities; alarm, doors and camera) in 1.15 : 1 : 0.95 proportion. The gutter between blocks is 12px everywhere inside the grid, 10px inside tight groups (zones, people, cars, utilities, lights). Blocks pad 12px; dense tiles pad 6px 10px.

**The One Stage Rule.** Design at 1280 by 800 and let the stage scale; do not reflow into breakpoints. Rows that can overflow clamp or ellipsize their text instead of growing.

**The 48px Floor Rule.** Every tappable thing (tile, tab, button, segment, field) is at least 48px tall; sheet actions are 52px.

## Elevation & Depth

None. The system is flat ink on cloth: no box shadows, no blur, no gradients on blocks. Depth is printed, not lit. The only sense of layering is the colour pass sitting 3px off its key line, and the sheet's backdrop dimming the stage with indigo at 55%. The camera caption's dark scrim is a legibility device over a photograph, not elevation.

**The Printed, Not Lifted Rule.** If something needs to stand out, give it a colour pass or a carved well, never a shadow.

## Shapes

Square-ish and hand-made. Blocks round to unequal corners (6, 5, 7, 5px clockwise from top left); icon wells and monograms to 5, 4, 6, 4px; the sheet to 7px; controls (tabs, buttons, segments, fields) to an even 5px; calendar date stamps to 4px; meters (battery, self-powered) to 2px. Outlines use the key-line weighting (2px top and left, 1.5px right and bottom) on blocks, date stamps, segments, fields and the sheet; internal rules are a single 1.5px key line.

The **buti** is the system's one ornament: an 18 by 16px six-petal printed flower repeat in key-line ink (indigo on cloth; pale indigo in dark mode), never in a state colour, run as a 16px border strip. It edges the bottom of the tab bar and heads the clock block, and nowhere else.

**The Uneven Corner Rule.** Block and well corners are deliberately unequal. Do not "fix" them to a uniform radius.

## Components

### Block (the base container)
Every container is a block: cloth fill, hand-weighted key line, unequal corners. Content sits above a pseudo-layer that carries the optional colour pass.
- **On:** turmeric pass, offset 3px right and down, text turns Turmeric Ink and subtitles 78% of it.
- **Alert:** madder pass, same offset, text white (subtitles 86%), and the icon well inverts to a near-white square with a madder icon.
- **Unavailable:** the whole block at 50% opacity, disabled.
- **Motion:** when a pass appears it prints in, sliding from register to its 3px offset over 0.34s on a quick ease-out, unless reduced motion is requested. A pressed tile nudges 1px down and right.

### Tiles
The everyday control: a block with a carved icon well on the left, a 700-weight name and a 600-weight subtitle on the right. Used for quick actions, rooms, lights, media, cars, utilities and sheet actions. Six-up rows shrink the well to 34px and allow two-line subtitles.

### Icon Well
A solid indigo square (40px, 34 to 30px in dense rows) with a 24px line icon knocked out in cloth colour. Icons are a single in-house sprite at a 2.1 stroke with round caps and joins. Monograms for people reuse the well shape with a white initial on the person's colour.

### Navigation (tab bar)
A full-width block: brand wordmark ("SuPar" 700 with "Home" in Faded Indigo 500), then text-and-icon tabs (48px, 600, Faded Indigo). The current tab is a turmeric fill with Turmeric Ink text, not an underline. Count badges (20px, 700) sit inside a tab: ink-on-cloth for a neutral count (Lights), madder with white text only when the count is a problem (Security). The connection status sits right-aligned in Madder Text. The buti strip runs along the bar's lower edge.

### Status Banner
A 58px block across the work grid. Calm: no pass, ink text. Alert: madder pass with action buttons; the primary action is a white button with madder text, secondary actions are white-outlined, and a two-tap confirm turns the button turmeric ("armed") before it acts.

### Segmented Buttons (alarm modes)
Key-line outlined 48px buttons in a two-up grid; the current mode is a solid indigo well fill with cloth text.

### Meters and Flow
Battery and self-powered meters are a 1.5px ink outline at 2px radius with a flat fill (ink, turmeric for self-powered, madder when low, dabu when charging). The energy flow joins three wells with 2px dashed ink arrows that fade to the key line when idle. Energy stats sit in one key-line grid inside their block, not in boxes within the block.

### Sheet (dialog)
A 560px cloth panel with the key-line outline and 7px corners, 22px headline, Faded Indigo body, a grid of tile actions and a full-width Close. Fields inside are 48px, blued-cotton fill with the key-line outline.

### Toast and Message
The toast is a madder bar with white 600 text, bottom centre. The full-page loading or error message sits on the ground in 19px 600; errors use Madder Text.

## Do's and Don'ts

### Do:
- **Do** put every container on cloth with the hand-weighted key line (2px top and left, 1.5px right and bottom) and the unequal block corners.
- **Do** show state as a colour pass printed 3px out of register: turmeric for on, madder for attention, nothing for calm.
- **Do** carve icons out of solid indigo wells; keep icons in the one sprite at a 2.1 stroke.
- **Do** set every live number in tabular figures, names at 700, supporting lines at 600.
- **Do** use Madder Text, not Madder, wherever red must be read as text on cloth.
- **Do** keep every tappable target at least 48px tall and design on the fixed 1280 by 800 stage.
- **Do** define every colour for both light and dark; dark mode prints the pass `normal` instead of `multiply`.

### Don't:
- **Don't** use shadows, blur, glass or gradients on blocks; depth is printed, not lifted.
- **Don't** put white text on turmeric, or fill a block with dabu green.
- **Don't** add a third state colour or a second accent; the dyes carry meaning, not decoration.
- **Don't** spread the buti beyond selvedge edges (tab bar foot, clock head); it is an edge, not a background.
- **Don't** even out the block corners or the key-line weights.
- **Don't** introduce a second typeface or weights below 500.
