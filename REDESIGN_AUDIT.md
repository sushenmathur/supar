# REDESIGN_AUDIT: iOS "Liquid Glass" for the Supar Home Assistant dashboard

Branch: `redesign/glass-ui` · Phase 1 (audit only, no code edited) · Dials: VARIANCE 4, MOTION 4, DENSITY 6

> **Starting point:** this is not a greenfield job. The repo already ships a `Glass` theme, a 4,006-line `master.yaml`
> and ~40 HTML mockups. The redesign is therefore a **consolidation and refinement**: move every glass value into the
> theme, remove the hardcoded colours, tighten the blur budget, and add the polish (type, motion, specular edges) the
> current build lacks. Nothing here changes behaviour.

---

## 1. Inventory

### 1.1 Files

| Path | What | Notes |
|---|---|---|
| `homeassistant/dashboard/master.yaml` | Single source of truth (raw Lovelace config) | 10 views, 12 button-card templates, 1 navbar template |
| `homeassistant/themes/glass.yaml` | `Glass` theme, light + dark | 100 lines; card-mod rule applies blur to **every** `ha-card` |
| `homeassistant/themes/glass-theme-additions.yaml` | Paste-in block, already merged into `glass.yaml` | Duplicate, drift risk |
| `homeassistant/dashboard/*.yaml` (25 files) | Per-card sources and "paste-under" template snippets | Overlap with `master.yaml`; `.only` and `.pills` variants are older drafts |
| `homeassistant/dashboard/validate.py` | YAML parse, template refs, JS `node --check` | Only automated check that exists |
| `dashboards/*.html`, `proto/`, `previews/` | ~40 mockups and PNGs, final is `option-b5-popups.html` | Hardcoded colours, uses Inter and Lucide-style SVGs |
| `.claude/skills/*` | taste-skill library (both requested skills present) | Read in full |
| `/config/www/` | **Does not exist in the repo.** No wallpaper or font assets | Must be created (see 3.5) |
| `/config/themes/` | Not in the sandbox. The repo path `homeassistant/themes/` stands in for it | |

### 1.2 Views (all `theme: Glass`)

| Path | Title | Layout | Main cards |
|---|---|---|---|
| `hubhome` | Home | sections, 4 columns | 50 button-card, 14 tile, alert banner (conditional), greeting, people pills, quick actions, rooms, energy, Robbie, Kia/Bluey popups, navbar |
| `security` | Security | sections | 9 tile, entity, heading, markdown |
| `lights` | Lights | sections | 20 tile, 7 light-brightness |
| `homeclimate` | Climate | sections | 4 thermostat, hvac-modes, sensors |
| `living-room` | Living Room | sections | tile, icon, entity |
| `garage` | Garage | sections | `custom:garage-card` (layered image), advanced-camera-card, 12 button-card (`glass_vehicle`, `glass_chip`) |
| `kidsroom` | Kids Rooms | sections | light, picture-entity, mushroom-chips |
| `outdoor` | Outdoor | sections | 12 tile, entity |
| `laundry` | Laundry | sections | washing-machine-card ×2, mushroom badges, navbar-card |
| `music` | Media | **panel** | `custom:homeii-music-flow` |

### 1.3 Card types (counts in `master.yaml`)

Native: tile 60, grid 27, entity 20, heading 15, vertical/horizontal-stack 20, markdown 8, light-brightness 7,
thermostat 4, climate-hvac-modes 5, media-player-* 10, picture-entity 4, conditional 5, others singletons.
Custom: **button-card 62**, **navbar-card 9**, mushroom (template-card 4, template-badge 5, chips 3, vacuum 2,
climate 2, alarm 2), advanced-camera-card 2, washing-machine-card 2, garage-card 1, clock-weather-card 1,
calendar-card-pro 1, alert-ticker-card 1, wheelie-bin-card 1, homeii-music-flow 1.
**Bubble Card: 0.** `card_mod`: 20 uses, **none on a Bubble Card** (constraint already satisfied).
Also present: `kiosk_mode` (hides header and sidebar for user `suparhome`).

### 1.4 Reusable button-card templates

`ticker`, `glass_action`, `room_tile`, `glass_toggle`, `glass_chip`, `glass_popup_chip`, `glass_person`,
`glass_person_pill`, `glass_info_pill`, `world_clock`, `glass_vehicle`, plus `navbar-templates.main`.
Popup styling is copy-pasted **three times** (lines ~1135, ~1890, ~2053) for Robbie, Kia and Bluey.

---

## 2. Audit against the skills' criteria

Scores are 1 (poor) to 5 (done). Method: grep counts on `master.yaml`, rendered mockups, and contrast computed
over the real wallpaper gradients.

| Area | Score | Evidence |
|---|---|---|
| Tokenisation (hard constraint) | **2** | 37 lines with hex and 45 with `rgba()` in `master.yaml` outside the theme. Examples: `#f59e0b` / `#c7d2fe` icons (l.391), alert text `#fff` / `#be123c` (l.780–911), energy palette `C = {solar:'#f59e0b',…}` (l.2482), weather icon colours (l.1040), tinted room gradients (l.76, 162, 384). Popup blocks repeat the theme values as inline `var(--x, rgba(…))` fallbacks (≈10 copies) |
| Glass fidelity | **3** | Has border + inset top highlight + gradient fill. Missing: bottom edge highlight, saturate is 190% (brief: 160–180%), no layered "elevated" tier (popup uses same recipe as cards), no noise/grain |
| Blur budget / performance | **2** | `card-mod-card` in the theme blurs every `ha-card`. Button-cards on the Home view sit **inside** blurred section cards, so blur is stacked. 15 `backdrop-filter` sites with four different radii (18, 20, 30, 34 px). 34 px is outside the 20–32 px brief. **No `@supports not (backdrop-filter)` fallback anywhere.** Wall tablet risk |
| Contrast (≥4.5:1) | **3** | Primary text 7.7–14.3:1 (fine). **Secondary text fails**: light mode 4.2–4.4:1 on glass over the wallpaper, dark mode 4.1:1 over the teal blob. White on the `glass-robbie` teal `#2dd4bf` is 1.9:1 |
| Typography | **2** | No `font-family` anywhere in dashboard or theme (browser/HA default Roboto). No font loader. Numbers use `tabular-nums` in one place only. Weights are 600/700 almost everywhere. Headline tracking set only in mockups. Sensor values lack a clear numeric tier |
| Colour and accent discipline | **2** | Four competing accents: amber (`on` state), violet/indigo (`primary-color #5b8cff`, `accent-color #a78bfa`, `glass-accent` gradient), teal (Robbie), plus red/green/amber status. Skill rule is one accent. The purple-blue gradient is the "AI gradient" fingerprint the redesign skill flags |
| Surface and depth | **3** | Wallpaper is theme gradient only (no asset, view `background` has no image). Three tiers are not distinct: wallpaper → card → popup use near-identical recipes |
| Layout | **3** | Already sections views, no masonry. 40 fixed `height: Npx` and 15 `1fr` usages; several `grid-template-rows: 1fr min-content` inside templates (brief: prefer auto). Three-up `grid` rows repeated on Security, Lights, Outdoor |
| Interaction states | **2** | One `transition` in the whole file. No hover/press feedback on tiles or button-cards (only `.popup-item:active`). No focus-visible ring |
| Motion | **3** | 11 keyframes (alert pulse, ring pulse, Robbie spin/glow, ticker, energy flow) are purposeful and mostly guarded. `prefers-reduced-motion` appears 6 times, but not on `phone-ring-pulse`, `kia/bluey-ring-pulse` consistently. Ticker uses `linear infinite` (acceptable for a marquee). No spring easing |
| Component quality | **3** | Templates are well factored but popups and rings are duplicated. `glass_person` appears unused (superseded by `glass_person_pill`) |
| Code hygiene | **3** | JS templates do not shadow `hass` (0 hits). `validate.py` passes structurally. Duplicate snippets under `dashboard/` drift from `master.yaml`. No yamllint config |
| Icons | **n/a** | All icons are MDI/Phu/Glyphs via HA. Cannot be swapped without a behaviour-visible change. Left as is (see 6) |

**Summary of the five highest-impact issues:** (1) hardcoded colours break the single-source theme rule,
(2) stacked blur plus no fallback is a tablet performance risk, (3) secondary text and the teal chip fail contrast,
(4) no typeface or numeric hierarchy, (5) no hover/press/focus states, and popup tier is not visually elevated.

---

## 3. Design-token proposal

All of these live in `themes/glass.yaml` under `modes: light|dark` (or shared). Cards reference `var(--glass-…)` only.
Card-mod stays on non-Bubble cards, and the theme's own card-mod rule is the one place raw values appear.

### 3.1 Colour (one accent, status colours are semantic only)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--glass-ink` (primary text) | `#101a2e` | `#f5f7fb` | Titles, values |
| `--glass-ink-2` (secondary) | `rgba(16,26,46,.72)` | `rgba(245,247,251,.74)` | Labels. **Raised from .62 so it clears 4.5:1** |
| `--glass-ink-3` (tertiary, non-essential) | `rgba(16,26,46,.52)` | `rgba(245,247,251,.54)` | Timestamps, decorative only |
| `--glass-accent` | `#2f7df6` | `#5aa2ff` | **On/active only**: toggled-on tile, selected nav, slider fill |
| `--glass-accent-ink` | `#ffffff` | `#06121f` | Text on accent (≥4.5:1 in both) |
| `--glass-accent-soft` | `rgba(47,125,246,.16)` | `rgba(90,162,255,.22)` | Active chip tint |
| `--glass-warm` | `#ffb340` | `#ffc266` | Light bulbs "on" glow only (physical metaphor, kept) |
| `--glass-ok / -warn / -bad` | `#15803d / #b45309 / #be123c` | `#6ee7b7 / #fbbf24 / #fb7185` | Status text and rings |
| `--glass-alert-high/mid/low` | solid tinted glass | same, tuned | Alert banner (white text ≥4.5:1 checked) |
| `--glass-robbie` | `#0f766e` | `#2dd4bf` | Fixes white-on-teal 1.9:1 |
| `--glass-weather-*`, `--glass-energy-*` | tokenised palette | tokenised palette | Replaces inline hex in JS templates |

Decision for you: the current violet/indigo accent is replaced by a single iOS-style blue. Amber stays **only** as
the light-on glow. If you would rather keep the amber as the main "on" colour, say so; it changes one token.

### 3.2 Glass

| Token | Value |
|---|---|
| `--glass-blur` | `24px` (cards) |
| `--glass-blur-elevated` | `32px` (popups, nav rail, dialogs) |
| `--glass-saturate` | `170%` |
| `--glass-bg` (L / D) | `linear-gradient(160deg, rgba(255,255,255,.62), rgba(255,255,255,.30))` / `linear-gradient(160deg, rgba(255,255,255,.12), rgba(255,255,255,.04))` |
| `--glass-bg-elevated` | one tier lighter (L) / one tier more opaque (D) |
| `--glass-bg-solid-fallback` | `rgba(246,248,253,.92)` / `rgba(22,28,48,.92)` for `@supports not (backdrop-filter)` |
| `--glass-hairline` | 1px `rgba(255,255,255,.70)` / `rgba(255,255,255,.18)` |
| `--glass-specular` | inset top highlight `rgba(255,255,255,.85)` / `.30`, plus 1px bottom inner shade |
| `--glass-inset` (inner tile on card) | **no blur**, plain translucent fill (see 3.7) |

### 3.3 Radius

`--glass-r-card: 26px` · `--glass-r-tile: 22px` · `--glass-r-inner: 16px` (concentric: inner = outer − padding) ·
`--glass-r-pill: 999px` for chips, buttons, pills, nav items · `--glass-r-popup: 32px`. Replaces the 20–32px mix.

### 3.4 Shadow (soft, wide, tinted to the wallpaper hue, single light source from top)

| Token | Light | Dark |
|---|---|---|
| `--glass-shadow-1` (card) | `0 1px 2px rgba(40,60,110,.06), 0 14px 38px rgba(40,60,110,.14)` | `0 1px 2px rgba(0,0,0,.30), 0 16px 40px rgba(2,6,20,.38)` |
| `--glass-shadow-2` (elevated) | `0 2px 4px rgba(40,60,110,.08), 0 28px 70px rgba(40,60,110,.22)` | `0 2px 4px rgba(0,0,0,.34), 0 30px 72px rgba(2,6,20,.55)` |
| `--glass-glow-on` | accent or warm at 40% | same, 45% |

### 3.5 Background (needs something behind the glass)

Two assets, both created in Phase 2, no external fetch: `www/glass/wallpaper-light.svg` and `wallpaper-dark.svg`
(layered gradient mesh with soft blobs, blur baked in, ~20 KB each, 2560×1600, `preserveAspectRatio=slice`), plus a
fixed, `pointer-events:none` grain layer (SVG turbulence data-URI, 3% opacity). Applied via the theme's
`lovelace-background` and `primary-background-color`; the CSS gradient stays as the fallback if `/local/` 404s.
Served from `/local/glass/…`. Only one fixed layer carries grain; scroll areas carry none.

### 3.6 Spacing and type scale

Spacing (4-pt): `--glass-s1 4 · s2 8 · s3 12 · s4 16 · s5 20 · s6 28 · s7 40`. Section gap 16, card padding 20.
Density 6: tight inside a card, generous between groups.

Type (font: see 6.1): `--glass-font`, `--glass-font-num` (same family, `tabular-nums`)

| Role | Size / weight | Tracking |
|---|---|---|
| Display value (clock, big sensor) | 56 / 300 | −0.04em |
| Title (greeting, card header) | 28 / 600 | −0.025em |
| Value (stat in a card) | 22 / 600, tabular | −0.015em |
| Body / name | 15 / 500 | −0.005em |
| Label / secondary | 13 / 500 | 0 |
| Overline (sparingly) | 11 / 600, sentence case or small caps | +0.04em |

### 3.7 Blur budget (performance)

Rule: **at most two blur layers in the viewport stack at any point.**
1. Section card (`--glass-blur: 24px`) is the only blurring surface on a view.
2. Tiles, chips and pills **inside** a card use `--glass-inset` (translucent fill + hairline + specular, **no** `backdrop-filter`).
3. Elevated tier (nav rail, popups, dialogs, alert banner) uses 32px and is mutually exclusive with the card behind it dimming via scrim.
4. The theme's global `card-mod-card` rule is narrowed so button-cards nested in a section card do not blur again.
5. `@supports not (backdrop-filter: blur(1px))` swaps to `--glass-bg-solid-fallback`.
6. Wall-tablet "saver" mode: a `--glass-blur: 0px` override in the theme variant for low-power clients (optional second theme name `Glass Lite`).

### 3.8 Motion

| Token | Value |
|---|---|
| `--glass-ease` | `cubic-bezier(.32,.72,0,1)` (spring-like, no linear / ease-in-out) |
| `--glass-t-fast / -base / -slow` | `180ms / 240ms / 320ms` |
| Hover (pointer devices only) | `translateY(-1px)` + brighter specular, 180ms |
| Press | `scale(.98)`, 180ms |
| State change (toggle on/off) | background/glow cross-fade, 240ms |
| Popup open | opacity + `translateY(8px) scale(.98)` → rest, 320ms |
| Kept, restyled | alert pulse, charging ring pulse (Kia, Bluey, phone), Robbie spin/glow, energy flow, ticker. All recoloured via tokens, all wrapped in `prefers-reduced-motion: reduce { animation: none }` |

Animations touch only `transform`, `opacity`, `filter` (and `box-shadow` on the existing small glows).

### 3.9 Focus and elevation scale

`--glass-focus-ring: 0 0 0 3px var(--glass-accent-soft), 0 0 0 1px var(--glass-accent)`. Z-index is owned by HA
and navbar-card; no new z-index values are introduced.

---

## 4. Per-dashboard change plan

All plans preserve entity IDs, `tap_action` / `hold_action`, service calls, `visibility` / conditions and templates.
Each view lands as its own commit in Phase 3.

| # | View | Change |
|---|---|---|
| 0 | **Theme and templates** (Phase 2) | Rewrite `glass.yaml` with the tokens above; font loader; wallpaper assets; rework `glass_action`, `glass_toggle`, `glass_chip`, `glass_info_pill`, `room_tile`, `glass_person_pill`, `glass_vehicle`, `world_clock` onto `--glass-inset` + tokens; a single `glass_popup` base replaces the three copied popup blocks; navbar styles use elevated tier |
| 1 | **Home** | Alert banner tokenised (solid tint, no pulse under reduced motion). Greeting: display-size time, title-size greeting. People pills: unchanged data, pill radius, token ring colours. Quick actions: pill-radius icon buttons with press scale. Rooms: tint becomes `--glass-room-tint-n` variables, lit state uses `--glass-warm` glow. Energy: palette to tokens, tabular numerals. Robbie / Kia / Bluey popups share one elevated recipe. Replace `1fr` rows with `auto` where height is not intentional |
| 2 | **Lights** | Tiles become `--glass-inset` with accent-soft when on; brightness sliders use accent fill; no blur on tiles |
| 3 | **Climate** | Thermostat and hvac-modes pills in accent-soft; big temperature gets the display value style |
| 4 | **Security** | Contact sensors in grouped glass card; open state uses `--glass-bad`, not a new colour; heading style from scale |
| 5 | **Living Room** | Icon tiles and entities restyled via theme only (no YAML structure change) |
| 6 | **Garage** | **Sibling-layer architecture untouched**: `custom:garage-card` is a third-party card whose layers live in `/local/garage-card-custom-v3` (not in this repo, so I cannot restyle or verify it). Only the glass chrome around it changes: vehicle cards, chips, camera card frame. No wrapper added around the garage card |
| 7 | **Kids Rooms** | Light cards, picture-entity frames (radius and hairline), mushroom chips via theme variables |
| 8 | **Outdoor** | Tile grid as Lights |
| 9 | **Laundry** | washing-machine-card and badges via theme variables; navbar-card kept |
| 10 | **Media** (panel) | Wrapper only: the card is a single third-party panel; theme background and rail only |

Also: delete nothing, but mark the stale draft files in `homeassistant/dashboard/` (`*.only.yaml`, `announce-card.pills.yaml`,
`glass-theme-additions.yaml`) as superseded in the README, so `master.yaml` and the theme stay the only live sources.

---

## 5. Mockup deliverable (before any YAML, as you asked)

HTML only, no build tooling, in `dashboards/glass/`:

1. `tokens.css`: the exact token set from section 3, light + dark, so the mockups and the theme cannot drift
2. `reference-card.html`: one restyled card (people pill + room tile + light tile + chip) in both modes, with hover, press, focus, reduced-motion toggle, and a "no backdrop-filter" switch
3. `home.html`: full Home view at 1600×1000, light + dark, plus alert and popup states
4. `views.html`: Lights, Climate, Security, Garage chrome

Then your approval → Phase 2 (theme, assets, font loader, shared templates, **one reference card in live YAML**) →
approval → Phase 3 per-view commits → Phase 4 verification.

---

## 6. Decisions I need from you

### 6.1 Typeface (the one real conflict between your brief and the skills)
Your brief asks for Inter "or similar". The `high-end-visual-design` skill bans Inter, Roboto, Arial and Helvetica.
Recommendation: **Geist** (SF-like grotesk, tabular figures, open licence), loaded by a small `extra_module_url`
JS file that injects the `@font-face` rules from `/local/glass/fonts/`, with the system stack `-apple-system,
BlinkMacSystemFont, 'SF Pro Text'` as fallback so Apple devices still get real SF. Alternatives: Inter Tight, Plus Jakarta Sans.
Fonts must be self-hosted (the sandbox cannot fetch them, so you would drop the `.woff2` files in `/config/www/glass/fonts/`; I will give exact links).

### 6.2 Where the skills and the brief disagree on scope (my call, flagged)
| Skill rule | Brief / reality | What I will do |
|---|---|---|
| "Blur only on fixed/sticky elements" | Brief wants frosted cards | Blur only on section cards and elevated tier; nested items get no blur (3.7) |
| Double-bezel on every card | Dense wall dashboard (density 6) | Only on hero surfaces (greeting, energy, popups). Everything else is a single hairline + specular edge |
| Ultra-light line icons, no Lucide | Icons come from HA (MDI / Phu / Glyphs) | Unchanged; swapping would alter behaviour-visible UI |
| 3-column card grids flagged as generic | HA sections already control columns | Vary row spans and card sizes (asymmetric bento) where it does not move content |
| Large entry animations | "State-change feedback only" | No scroll or load entrance animation |
| Grain overlay | Perf constraint | One fixed layer, 3% opacity, removable by theme variable |

### 6.3 Questions
1. **Accent:** blue (my proposal) or keep amber as the primary "on" colour?
2. **Font:** Geist (recommended), Inter Tight, or Inter anyway?
3. **Tablet saver:** want the optional `Glass Lite` (no blur) theme for the wall tablet?
4. **`homeassistant/dashboard/*.yaml` drafts:** keep and mark as superseded (my default), or delete?

---

## 7. Verification constraints

- `ha core check` and a live HA instance are not available in this sandbox. Phase 3 checks will be: `yamllint`
  (installable via pip; I will add a `.yamllint` tuned to HA's long lines), `homeassistant/dashboard/validate.py`
  (YAML + templates + JS syntax), a token-lint script that fails on any hex/`rgba()` outside the theme, and headless
  Chromium screenshots of the mockups. **None of this runs against a live dashboard.** You will need to paste the raw config
  and restart per the Phase 4 install steps.
- Contrast (≥4.5:1) will be computed by script against the wallpaper SVG at its worst-case regions, in both modes.
- `/local/` assets cache hard: Phase 4 includes a hard-refresh reminder and a `?v=` query on the font loader URL.

**STOP. Awaiting your approval (and answers to 6.3) before building mockups.**
