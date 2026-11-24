# DESIGN.md: SuPar Home kiosk, "Warm Stone Glass"

Handoff for the Claude Code session that owns the kiosk page (`homeassistant/www/kiosk-home/`, source on branch
`claude/gallant-cori-vepkh0`). It describes the chosen redesign and exactly how to apply it. Everything here was
rendered and checked on the real page (the built `kiosk-home.html`) with simulated Home Assistant data.

## 1. Goal and scope

Restyle the kiosk from the current "block print" look to **Warm Stone Glass**: a warm, light-first palette with
frosted see-through cards over a soft warm backdrop, plus a matching dark mode.

- **Looks only.** No markup, JavaScript, entity, routing or behaviour changes. Every rule targets classes that already exist.
- **All views.** Home and the sub-views (`#lights`, `#homeclimate`, `#security`, rooms, media, More) pick it up through the tokens.
- **Same layout.** Keep the fixed 1280×800 stage, its scaling and the Kiosk Satellite insets.

## 2. What the redesign fixes (from the design review)

1. **Turmeric meant two things.** It was used for "device on" (`.b.on`) and for the info banner (`.banner.on`), so a warning looked like another device that was on. Now "on" is an amber tint and "info" is a glass card with an amber stripe on the left.
2. **Too much fill.** About 13 tiles were filled saturated turmeric at once, so nothing stood out. "On" is now a soft amber glass tint.
3. **Doubled borders.** The offset colour block (`.b::after`, moved 3 px) and its redrawn key line (`.b::before`) read as a doubled border at kiosk distance. Both are removed.
4. **Cut-off text.** "Sorento · Home · 78% · charging" was truncated, and "Good Night" was clipped by the wider font. The car summary now wraps to two lines and the row label sizes are tightened.

## 3. Design language

| Element | Rule |
|---|---|
| Surfaces | Frosted glass cards: translucent fill, `backdrop-filter: blur(22px) saturate(170%)`, bright 1 px top edge (specular highlight), soft inner glow, warm drop shadow |
| Backdrop | Five soft radial colour blobs (peach, sand, amber, rose, stone) over a warm linear gradient, so the glass has something to blur |
| Corners | Cards 18 px (`--r`), small items 12 px (`--r-s`), avatars round, bars and meters are 8 px pills |
| Type | **Plus Jakarta Sans** (400–800) everywhere; clock 700 with tight tracking (−0.045em); names 700 |
| Icons | Unchanged (the page's own SVG set) |
| Motion | No offset "print" animation. Button press scales to 0.98 (120 ms). The existing flow-line and spin animations stay. `prefers-reduced-motion` is respected |

### State rules (the core of the redesign)

| State | Classes | Treatment |
|---|---|---|
| Idle device / card | `.b` | Clear glass card, ink text |
| Device on | `.b.on` (not `.banner`) | Amber-tinted glass (`--on-bg`), gold icon well (`--on-well`), amber sub-text, warm glow underneath |
| Info alert | `.banner.on` | Glass card with a 5 px amber stripe on the left (`--info-bar`); never the "on" tint |
| Urgent / warn alert | `.b.alert`, `.banner.alert` | Solid red (`--alert`), white text, red glow |
| All clear | `.banner.calm` | Glass card, green tick well |
| Selected / current | `.tab.cur`, `.ev .d.today`, `.abtn.cur`, `.seg button.cur`, `.switch-btn.on` | Solid accent (`--accent`): near-black in light, warm white in dark |
| Good / secure | `--dabu` text (Home, Disarmed, Sold), self-powered bar | Green |

## 4. Tokens

The page's existing tokens are kept and re-pointed (`--ground`, `--cloth`, `--ink`, `--ink-2`, `--key`, `--well`,
`--well-ink`, `--turmeric*`, `--madder*`, `--dabu`, `--weather-ic`, `--sel`, `--pass-blend`). New tokens are added.
Dark values apply under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` and under
`:root[data-theme="dark"]`, the same pattern the page already uses.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--font` | Plus Jakarta Sans | same | All text |
| `--r` / `--r-s` | 18px / 12px | same | Card / small radius |
| `--ground` | `#F4F0EB` | `#141210` | Page base (under the backdrop) |
| `--backdrop` | warm blobs over `#F6EDE2 → #EFE4D6` | amber/brown blobs over `#17120E → #120E0B` | Body background |
| `--cloth` | `rgba(255,255,255,.52)` | `rgba(46,38,30,.46)` | Glass card fill |
| `--line` / `--key` | `rgba(255,255,255,.75)` | `rgba(255,236,214,.14)` | Card edge |
| `--ink` | `#1C1917` | `#F5F0EA` | Text |
| `--ink-2` | `#57534E` | `#B8B0A6` | Secondary text |
| `--well` / `--well-ink` | `rgba(255,255,255,.62)` / `#44403C` | `rgba(255,240,220,.1)` / `#D6CFC6` | Icon well |
| `--soft` | `rgba(255,255,255,.5)` | `rgba(255,240,220,.06)` | Date stamps |
| `--track` | `rgba(28,25,23,.1)` | `rgba(255,240,220,.14)` | Bar and meter tracks |
| `--on-bg` | `linear-gradient(150deg, rgba(255,214,153,.62), rgba(253,236,207,.45))` | `linear-gradient(150deg, rgba(245,158,11,.34), rgba(120,72,20,.3))` | Device on, fill |
| `--on-ink` / `--on-sub` | `#1C1917` / `#8A4B05` | `#FBEBD3` / `#F3B867` | Device on, text |
| `--on-well` / `--on-well-ink` | `#D97706` / `#FFFFFF` | `#F59E0B` / `#1C1206` | Device on, icon well |
| `--on-border` | `rgba(255,236,204,.9)` | `rgba(251,191,36,.4)` | Device on, edge |
| `--info-bg` / `--info-ink` | `rgba(255,255,255,.58)` / `#1C1917` | `rgba(46,38,30,.5)` / `#F5F0EA` | Info banner |
| `--info-bar` / `--info-well-ink` | `#B45309` / `#FFFFFF` | `#F59E0B` / `#1C1206` | Info stripe and icon |
| `--alert` / `--alert-ink` | `#DC2626` / `#FFFFFF` | same | Urgent |
| `--accent` / `--accent-ink` | `#1C1917` / `#FFFFFF` | `#F5F0EA` / `#141210` | Selected / current |
| `--good`, `--dabu` | `#15803D` | `#4ADE80` | Good / secure |
| `--good-bg` | `#DCFCE7` | `#14301E` | All-clear well |
| `--turmeric` / `--turmeric-ink` | `#D97706` / `#FFFFFF` | same | Focus ring, legacy uses |
| `--madder` / `--madder-text` | `#DC2626` / `#B91C1C` | `#DC2626` / `#FCA5A5` | Legacy red uses |
| `--weather-ic` | `#D97706` | `#F59E0B` | Weather icon |
| `--glass-blur` | `blur(22px) saturate(170%)` | same | Backdrop filter |
| `--glass-edge` | `inset 0 1px 0 rgba(255,255,255,.95), inset 0 -1px 0 rgba(255,255,255,.25), inset 0 0 22px rgba(255,255,255,.35)` | `inset 0 1px 0 rgba(255,240,220,.22), inset 0 0 22px rgba(255,240,220,.05)` | Specular edge |
| `--shadow` | `0 10px 30px -8px rgba(120,72,20,.18), 0 2px 6px rgba(120,72,20,.06)` | `0 12px 32px -10px rgba(0,0,0,.55)` | Drop shadow |

### Contrast (WCAG AA, 4.5:1 for text)

Measured on the rendered glass, not on the tokens alone:

| Pair | Light | Dark |
|---|---|---|
| Secondary text on a glass card | 7.0:1 | 8.0:1 |
| "On" sub-text on amber glass | 5.8:1 | 4.8:1 |
| Text on urgent red | 4.8:1 | 4.8:1 |
| Green "Home" on a card | 5.0:1 | — |

If you change the backdrop, the blur or the card opacity, re-measure "On" sub-text in dark mode first. It has the least margin.

## 5. Implementation steps (in the kiosk source session)

1. **Get the theme CSS.** It's in Appendix A and B below, or in this repo at:
   ```
   git fetch origin claude/exciting-pascal-fmm0ir
   git show origin/claude/exciting-pascal-fmm0ir:dashboards/kiosk-redesign/themes/src/_base.css
   git show origin/claude/exciting-pascal-fmm0ir:dashboards/kiosk-redesign/themes/src/option-1b-warm-stone-glass.css
   ```
2. **Self-host the font.** Download the Plus Jakarta Sans **latin** woff2 (variable, one file covers 400–800) into
   `homeassistant/www/kiosk-home/fonts/plus-jakarta-sans-latin.woff2`. Add one rule at the top of `styles.css`:
   ```css
   @font-face { font-family: "Plus Jakarta Sans"; font-weight: 400 800; font-display: swap; src: url("fonts/plus-jakarta-sans-latin.woff2") format("woff2"); }
   ```
   Use this exact `url("fonts/…woff2")` form: `tools/kiosk-home/build-single.mjs` inlines only that pattern.
   Don't load Google Fonts at run time: the kiosk must work without internet. Keep the Hind files and rules, because the sub-views fall back to them while testing, and remove them once you've signed off.
3. **Append the theme.** Add Appendix A (shared layer) and then Appendix B (Warm Stone Glass), in that order, at the
   **end** of `styles.css`, without its `/*@fonts …*/` and `/*@base*/` marker lines. They must load after the existing rules.
   Optionally, once it's signed off, fold the tokens into the existing `:root` blocks and delete the overridden block-print rules.
4. **Bump the version** so tablets drop the cached files:
   `node tools/kiosk-test/bump-version.mjs --dir homeassistant/www/kiosk-home`
5. **Rebuild the single file:** `node tools/kiosk-home/build-single.mjs` → `homeassistant/www/kiosk-home.html`.
6. **Run the tests:** `node --test tests/kiosk-home` (they test logic, so they should pass unchanged).
7. **Check on the tablet** (see section 7). If scrolling or taps lag, lower `--glass-blur` to `blur(14px) saturate(150%)`
   or limit `backdrop-filter` to the larger cards (`.time`, `.lights`, `.energy`, `.cal`, `.alarm`) and give the small tiles a solid `rgba(255,255,255,.82)` fill.

## 6. Constraints

- **Touch targets** stay 48 px or more (the existing `.tab`, `.btn`, `.abtn`, `.seg button` and `.chip` sizes are unchanged).
- **Never hide focus.** The focus ring stays `3px solid var(--turmeric)` (now amber `#D97706`).
- **Reduced transparency:** `@media (prefers-reduced-transparency: reduce)` turns the blur off and makes cards near-solid. Keep this rule.
- **Reduced motion:** keep the page's existing `prefers-reduced-motion` handling. The new press effect is inside `no-preference`.
- **Performance:** `backdrop-filter` is the most expensive part. Use it on cards, not on text or icons, and don't animate it.
  The page's `html.still` pause (screensaver or hidden page) still applies to the animations.
- **Camera tiles:** leave them unfrosted; the image sits inside the glass edge.

## 7. Acceptance checklist

- [ ] Home in light and dark matches the reference screenshots (Appendix C)
- [ ] Info banner ("Side camera battery low") is a glass card with an amber stripe, not amber-filled
- [ ] Urgent banner (open the garage in a test) is solid red with white text and the Close door / Keep open buttons readable
- [ ] Tiles that are on are amber glass and tiles that are off are clear glass, legible across the room
- [ ] No doubled borders anywhere (the `.b::before` and `.b::after` passes are gone)
- [ ] "Good Night" and "Arm home" fit on one line; car summaries wrap, not cut
- [ ] Sub-views (#lights, #homeclimate, #security, a room, More) and pop-up sheets look consistent: glass cards, accent for the current option
- [ ] Works offline (the font is self-hosted and inlined in the single-file build)
- [ ] Smooth on the tablet: scrolling sheets, tapping tiles, opening pop-ups
- [ ] Version bumped and `kiosk-home.html` rebuilt

## 8. Alternatives considered (not chosen)

Kept in `dashboards/kiosk-redesign/` on `claude/exciting-pascal-fmm0ir` in case of a change of mind: **Warm Stone** (the
same palette without glass), **Midnight Slate** (dark first, amber glow) and **Indigo Studio** (today's indigo look,
modernised). Each is one theme file in `themes/`, with previews in `previews/`.


## Appendix A: Shared modernisation layer (`_base.css`)

```css
/* ===== Shared modernisation layer (included in every option) =====
   Loads after the page's own styles. Each option sets the tokens below; this layer maps them onto the
   page's existing classes. It changes looks only: no markup or behaviour changes.
   New tokens: --font, --font-display, --r (card radius), --r-s (small radius), --shadow, --line,
   --on-bg / --on-ink / --on-sub / --on-well / --on-well-ink (a device that is on),
   --info-bg / --info-ink / --info-bar (info banner), --alert / --alert-ink (needs attention),
   --accent / --accent-ink (selected tab, today, current buttons, switches). */

body { font-family: var(--font); }
.clock, .wx b, .zones b, .stats b, .flow b, .big, .vhead h1 { font-family: var(--font-display, var(--font)); }

/* Cards: one clean surface. The offset colour block and its key line go. */
.b { background: var(--cloth); border: 1px solid var(--line); border-radius: var(--r); box-shadow: var(--shadow); }
.b::after, .b::before { display: none !important; }
.b.on { background: var(--on-bg); color: var(--on-ink); border-color: var(--on-border, transparent); }
.b.on .sub { color: var(--on-sub); }
.b.alert { background: var(--alert); color: var(--alert-ink); border-color: transparent; }
.b.alert .sub { color: var(--alert-ink); opacity: .9; }

/* Icon wells */
.well, .mono { border-radius: var(--r-s); }
.well { background: var(--well); color: var(--well-ink); }
.b.on .well { background: var(--on-well); color: var(--on-well-ink); }
.b.alert .well { background: rgba(255, 255, 255, .22); color: var(--alert-ink); }
.mono { border-radius: 50%; }

/* Info banner: calm card with an accent bar, so "info" never looks like a device that is on. */
.banner.on { background: var(--info-bg); color: var(--info-ink); border-color: transparent; box-shadow: inset 5px 0 0 var(--info-bar), var(--shadow); }
.banner.on .sub { color: var(--info-ink); opacity: .78; }
.banner.on .well { background: var(--info-bar); color: var(--info-well-ink, #fff); }
.banner.on .btn.line { border-color: currentColor; color: inherit; }
.banner.calm .well { background: var(--good-bg, var(--well)); color: var(--dabu); }
.btn { border-radius: var(--r-s); }
.btn.solid { color: var(--alert); }

/* The printed border strip on the clock card goes; the card gets its top padding back. */
.time .buti, .buti { display: none; }
.time { padding-top: 16px; }
.wx { border-top: 1px solid var(--line); }

/* Tab bar */
.bar { border-radius: var(--r); }
.tab { border-radius: var(--r-s); }
.tab.cur { background: var(--tab-cur-bg, var(--accent)); color: var(--tab-cur-ink, var(--accent-ink)); }
.count { border-radius: 999px; }

/* Bars and meters: rounded pills */
.batt i, .selfp i, .meter { border: 0; height: 8px; border-radius: 999px; background: var(--track); }
.batt i::after, .selfp i::after, .meter::after { left: 0; top: 0; bottom: 0; border-radius: 999px; }
.batt i::after { width: var(--lvl, 0%); }
.selfp i::after { background: var(--good, var(--dabu)); max-width: 100%; }
.batt.chg i { border: 0; }

/* Calendar date stamps */
.ev .d { border: 1px solid var(--line); border-radius: var(--r-s); background: var(--soft); }
.ev .d.today { background: var(--accent); color: var(--accent-ink); border-color: transparent; }
.ev .d.today small { color: var(--accent-ink); opacity: .85; }

/* Buttons and inputs that used the key line */
.abtn, .seg button, .sheet input, .sheet select { border: 1px solid var(--line); border-radius: var(--r-s); }
.abtn.cur, .seg button.cur { background: var(--accent); color: var(--accent-ink); }
.sheet { border: 1px solid var(--line); border-radius: calc(var(--r) + 4px); box-shadow: 0 30px 80px rgba(0, 0, 0, .35); }
.stats div:nth-child(odd) { border-right: 1px solid var(--line); }
.stats div:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
.evrow { border-top: 1px solid var(--line); }
.cam img, .camtile img { border-radius: calc(var(--r) - 1px); }
.switch-btn.on i { background: var(--accent); }
.share::after { background: var(--accent); }

/* Small fixes: car summaries and light names wrap instead of being cut off. */
.row6 .name { font-size: 14px; letter-spacing: -0.015em; }
.abtn { white-space: nowrap; font-size: 14.5px; gap: 5px; padding: 0 8px; }
.abtn .ic { width: 20px; height: 20px; }
.car .sub { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.15; }

/* Motion: no offset-block "print" animation; keep a gentle press. */
@media (prefers-reduced-motion: no-preference) {
  button.b { transition: transform .12s ease, background-color .2s ease, box-shadow .2s ease; }
  button.b:active { transform: scale(.98); }
}
```

## Appendix B: Warm Stone Glass (`option-1b-warm-stone-glass.css`)

Tokens first, then the shared layer, then the Warm Stone flourishes and the liquid glass layer. In `styles.css`,
append Appendix A, then this.

```css
/* Option 1b – Warm Stone Glass: Warm Stone with a liquid glass treatment.
   Based on Option 1 – Light first, calm and soft.
   Palette from ui-ux-pro-max "Home Decoration & Interior Design" (stone #78716C, warm white #FAF5F2,
   gold #D97706, red #DC2626). Type: Plus Jakarta Sans (the skill's pick for smart-home controls).
   A device that is on gets a soft amber tint and a gold icon, not a full-colour fill. */
:root {
  --font: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --r: 18px; --r-s: 12px;
  --ground: #F4F0EB; --cloth: #FFFFFF; --ink: #1C1917; --ink-2: #57534E; --line: #E9E4DC; --key: #E9E4DC;
  --shadow: 0 1px 2px rgba(28, 25, 23, .05), 0 8px 22px rgba(28, 25, 23, .06);
  --well: #F3EEE7; --well-ink: #44403C; --soft: #F8F4EF; --track: #EAE5DD;
  --on-bg: #FDF1DE; --on-ink: #1C1917; --on-sub: #8A4B05; --on-well: #D97706; --on-well-ink: #FFFFFF; --on-border: #F6DDB3;
  --info-bg: #FFFFFF; --info-ink: #1C1917; --info-bar: #B45309; --info-well-ink: #FFFFFF;
  --alert: #DC2626; --alert-ink: #FFFFFF;
  --accent: #1C1917; --accent-ink: #FFFFFF;
  --good: #15803D; --good-bg: #DCFCE7; --dabu: #15803D;
  --turmeric: #D97706; --turmeric-ink: #FFFFFF; --turmeric-ink-2: rgba(255, 255, 255, .85);
  --madder: #DC2626; --madder-text: #B91C1C; --weather-ic: #D97706; --pass-blend: normal; --sel: rgba(217, 119, 6, .25);
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --ground: #141210; --cloth: #1E1B18; --ink: #F5F0EA; --ink-2: #B8B0A6; --line: #2E2A26; --key: #2E2A26; --shadow: none;
  --well: #2A2622; --well-ink: #D6CFC6; --soft: #24201D; --track: #36312C;
  --on-bg: #3A2A12; --on-ink: #FBEBD3; --on-sub: #F3B867; --on-well: #F59E0B; --on-well-ink: #1C1206; --on-border: #5A3F15;
  --info-bg: #1E1B18; --info-ink: #F5F0EA; --info-bar: #F59E0B; --info-well-ink: #1C1206;
  --accent: #F5F0EA; --accent-ink: #141210; --good: #4ADE80; --good-bg: #14301E; --dabu: #4ADE80;
  --madder-text: #FCA5A5; --weather-ic: #F59E0B;
} }
:root[data-theme="dark"] {
  --ground: #141210; --cloth: #1E1B18; --ink: #F5F0EA; --ink-2: #B8B0A6; --line: #2E2A26; --key: #2E2A26; --shadow: none;
  --well: #2A2622; --well-ink: #D6CFC6; --soft: #24201D; --track: #36312C;
  --on-bg: #3A2A12; --on-ink: #FBEBD3; --on-sub: #F3B867; --on-well: #F59E0B; --on-well-ink: #1C1206; --on-border: #5A3F15;
  --info-bg: #1E1B18; --info-ink: #F5F0EA; --info-bar: #F59E0B; --info-well-ink: #1C1206;
  --accent: #F5F0EA; --accent-ink: #141210; --good: #4ADE80; --good-bg: #14301E; --dabu: #4ADE80;
  --madder-text: #FCA5A5; --weather-ic: #F59E0B;
}
/* (Appendix A goes here when built; in styles.css it is already above) */
/* Flourishes */
.clock { font-weight: 700; letter-spacing: -0.045em; }
.time { background: linear-gradient(165deg, #FFF4E4 0%, #FFFFFF 55%); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .time { background: linear-gradient(165deg, #2A2116 0%, #1E1B18 60%); } }
:root[data-theme="dark"] .time { background: linear-gradient(165deg, #2A2116 0%, #1E1B18 60%); }
.name { font-weight: 700; letter-spacing: -0.01em; }
.sub { font-weight: 500; }
.bar { box-shadow: none; }

/* ===== Liquid glass layer =====
   Frosted, see-through cards over a warm blurred backdrop: backdrop blur + saturation, a bright top edge
   (specular highlight), a soft inner glow and a gentle drop shadow. Devices that are on become amber glass. */
:root {
  --cloth: rgba(255, 255, 255, .52); --line: rgba(255, 255, 255, .75); --key: rgba(255, 255, 255, .75);
  --well: rgba(255, 255, 255, .62); --soft: rgba(255, 255, 255, .5); --track: rgba(28, 25, 23, .1);
  --on-bg: linear-gradient(150deg, rgba(255, 214, 153, .62), rgba(253, 236, 207, .45)); --on-border: rgba(255, 236, 204, .9);
  --info-bg: rgba(255, 255, 255, .58);
  --glass-blur: blur(22px) saturate(170%);
  --glass-edge: inset 0 1px 0 rgba(255, 255, 255, .95), inset 0 -1px 0 rgba(255, 255, 255, .25), inset 0 0 22px rgba(255, 255, 255, .35);
  --shadow: 0 10px 30px -8px rgba(120, 72, 20, .18), 0 2px 6px rgba(120, 72, 20, .06);
  --backdrop:
    radial-gradient(620px 460px at 8% 6%, rgba(255, 183, 120, .75), transparent 70%),
    radial-gradient(560px 420px at 58% 28%, rgba(255, 220, 160, .7), transparent 70%),
    radial-gradient(600px 460px at 96% 12%, rgba(244, 166, 140, .55), transparent 70%),
    radial-gradient(640px 480px at 30% 100%, rgba(214, 196, 170, .7), transparent 70%),
    radial-gradient(560px 440px at 92% 96%, rgba(255, 196, 120, .55), transparent 70%),
    linear-gradient(160deg, #F6EDE2, #EFE4D6);
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --cloth: rgba(46, 38, 30, .46); --line: rgba(255, 236, 214, .14); --key: rgba(255, 236, 214, .14);
  --well: rgba(255, 240, 220, .1); --soft: rgba(255, 240, 220, .06); --track: rgba(255, 240, 220, .14);
  --on-bg: linear-gradient(150deg, rgba(245, 158, 11, .34), rgba(120, 72, 20, .3)); --on-border: rgba(251, 191, 36, .4);
  --info-bg: rgba(46, 38, 30, .5);
  --glass-edge: inset 0 1px 0 rgba(255, 240, 220, .22), inset 0 0 22px rgba(255, 240, 220, .05);
  --shadow: 0 12px 32px -10px rgba(0, 0, 0, .55);
  --backdrop:
    radial-gradient(620px 460px at 8% 6%, rgba(217, 119, 6, .35), transparent 70%),
    radial-gradient(560px 420px at 60% 30%, rgba(180, 83, 9, .22), transparent 70%),
    radial-gradient(600px 460px at 96% 12%, rgba(190, 90, 70, .25), transparent 70%),
    radial-gradient(640px 480px at 30% 100%, rgba(120, 90, 60, .3), transparent 70%),
    radial-gradient(560px 440px at 92% 96%, rgba(245, 158, 11, .2), transparent 70%),
    linear-gradient(160deg, #17120E, #120E0B);
} }
:root[data-theme="dark"] {
  --cloth: rgba(46, 38, 30, .46); --line: rgba(255, 236, 214, .14); --key: rgba(255, 236, 214, .14);
  --well: rgba(255, 240, 220, .1); --soft: rgba(255, 240, 220, .06); --track: rgba(255, 240, 220, .14);
  --on-bg: linear-gradient(150deg, rgba(245, 158, 11, .34), rgba(120, 72, 20, .3)); --on-border: rgba(251, 191, 36, .4);
  --info-bg: rgba(46, 38, 30, .5);
  --glass-edge: inset 0 1px 0 rgba(255, 240, 220, .22), inset 0 0 22px rgba(255, 240, 220, .05);
  --shadow: 0 12px 32px -10px rgba(0, 0, 0, .55);
  --backdrop:
    radial-gradient(620px 460px at 8% 6%, rgba(217, 119, 6, .35), transparent 70%),
    radial-gradient(560px 420px at 60% 30%, rgba(180, 83, 9, .22), transparent 70%),
    radial-gradient(600px 460px at 96% 12%, rgba(190, 90, 70, .25), transparent 70%),
    radial-gradient(640px 480px at 30% 100%, rgba(120, 90, 60, .3), transparent 70%),
    radial-gradient(560px 440px at 92% 96%, rgba(245, 158, 11, .2), transparent 70%),
    linear-gradient(160deg, #17120E, #120E0B);
}
html, body { background: var(--backdrop) fixed; }
body { background-image: var(--backdrop); background-repeat: no-repeat; background-size: cover; }
.b, .abtn, .ev .d { -webkit-backdrop-filter: var(--glass-blur); backdrop-filter: var(--glass-blur); }
.b { box-shadow: var(--glass-edge), var(--shadow); }
.b.on:not(.banner) { box-shadow: inset 0 1px 0 rgba(255, 248, 235, .9), inset 0 0 24px rgba(255, 220, 160, .35), 0 12px 30px -10px rgba(217, 119, 6, .35); }
.banner.on { box-shadow: inset 5px 0 0 var(--info-bar), var(--glass-edge), var(--shadow); }
.b.alert { box-shadow: inset 0 1px 0 rgba(255, 255, 255, .45), 0 12px 30px -10px rgba(220, 38, 38, .5); }
.well { box-shadow: inset 0 1px 0 rgba(255, 255, 255, .8); }
.b.on .well { box-shadow: inset 0 1px 0 rgba(255, 255, 255, .45), 0 4px 12px -2px rgba(217, 119, 6, .5); }
.time { background: linear-gradient(165deg, rgba(255, 236, 210, .55), rgba(255, 255, 255, .38) 60%); }
.abtn { background: rgba(255, 255, 255, .4); }
.cam { box-shadow: var(--glass-edge), var(--shadow); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .time { background: linear-gradient(165deg, rgba(120, 72, 20, .35), rgba(46, 38, 30, .4) 60%); }
  :root:not([data-theme="light"]) .abtn { background: rgba(255, 240, 220, .06); }
  :root:not([data-theme="light"]) .well { box-shadow: inset 0 1px 0 rgba(255, 240, 220, .14); } }
:root[data-theme="dark"] .time { background: linear-gradient(165deg, rgba(120, 72, 20, .35), rgba(46, 38, 30, .4) 60%); }
:root[data-theme="dark"] .abtn { background: rgba(255, 240, 220, .06); }
/* Glass is the most expensive effect on a tablet GPU: drop the blur if the screen asks for less transparency. */
@media (prefers-reduced-transparency: reduce) { .b, .abtn, .ev .d { backdrop-filter: none; -webkit-backdrop-filter: none; } :root { --cloth: rgba(255, 255, 255, .9); } }
```

## Appendix C: References

On branch `claude/exciting-pascal-fmm0ir`, in `dashboards/kiosk-redesign/`:

| File | What it is |
|---|---|
| `previews/option-1b-warm-stone-glass-light.png`, `-dark.png` | Reference screenshots, 1280×800 |
| `previews/current-light.png`, `-dark.png` | The page before the redesign |
| `snapshots/option-1b-warm-stone-glass.html` | Static reference page; opens offline |
| `themes/option-1b-warm-stone-glass.css` | Built theme with the font embedded as base64 (preview use only; on the kiosk, self-host the font as in step 2) |
| `harness/` | Simulated Home Assistant (`fake-ha.js`) and renderer (`render.cjs`) used to make the previews |

To preview the theme on the real page without a tablet: `cd harness && NODE_PATH=$(npm root -g) node render.cjs option-1b-warm-stone-glass`
(this reads `harness/kiosk-home.current.html`; replace it with a fresh build to preview new changes).
