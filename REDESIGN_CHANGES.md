# Liquid Glass redesign: recommended changes

Repo `sushenmathur/supar` · branch `redesign/glass-ui` · status: **Phase 1 audit and HTML mockups done, awaiting approval. No Home Assistant YAML changed yet.**

Full detail: `REDESIGN_AUDIT.md`. Mockups: `dashboards/glass/index.html` (previews in `dashboards/glass/previews/`).

## Decisions already made

| Topic | Decision |
|---|---|
| Accent | One blue accent, for on/selected states only. Amber kept only for lights that are on |
| Font | Geist (SIL OFL, vendored), system SF stack as fallback |
| Low-power tablet | Add a `Glass Lite` theme (blur off) |
| Old draft files | Kept, marked superseded in `homeassistant/README.md` |

## What the audit found (current dashboard)

1. About 80 lines in `master.yaml` hardcode hex or `rgba()` outside the theme, and the three popup blocks (Robbie, Kia, Bluey) are copies of each other.
2. The theme blurs every `ha-card`, so nested button-cards stack blur. Blur radii vary (18, 20, 30, 34px) and there is no `@supports not (backdrop-filter)` fallback.
3. Secondary text is 4.1–4.4:1 (below the 4.5:1 target), and white on the Robbie teal is 1.9:1.
4. No font is set, and there is no hover, press or focus feedback.
5. Four competing accents (violet/indigo, amber, teal, plus status colours).
6. Already fine: sections views (no masonry), no Bubble Card, card-mod not used on any Bubble Card, no JS template shadows `hass`.

## Recommended changes

### Theme (`homeassistant/themes/glass.yaml`)
- Move every colour, glass, radius, shadow, spacing, type and motion value into `modes: light | dark` variables (token list in `dashboards/glass/tokens.css`).
- Three surface tiers: card (blur 24px), elevated (rail, popups, alert; blur 32px), inset tile (**no blur**). At most two blur layers stacked.
- `@supports not (backdrop-filter)` falls back to a solid translucent fill. Add `Glass Lite` (blur 0).
- Radii 26 / 22 / 16 / pill / 32. Shadows soft, wide, tinted. Spring easing `cubic-bezier(.32,.72,0,1)`, 180 / 240 / 320 ms. `prefers-reduced-motion` honoured everywhere.
- Wallpapers `www/glass/wallpaper-light.svg` and `-dark.svg`, applied via `lovelace-background`; one fixed grain layer at 3.5% opacity.
- Font loader via `extra_module_url` (Geist, `?v=` cache-bust).

### Shared button-card templates
Rework `glass_action`, `glass_toggle`, `glass_chip`, `glass_info_pill`, `room_tile`, `glass_person_pill`, `glass_vehicle`, `world_clock` onto the inset tier and tokens. Replace the three copied popup blocks with one `glass_popup` base. Replace `1fr` rows with auto sizing where height is not intentional.

### Per view (one commit each)
| View | Change |
|---|---|
| Home | Tokenised alert banner (solid tint), display-size time, pill people chips and quick actions, tokenised room tints and energy/weather palettes, shared popup recipe |
| Lights, Outdoor | Inset tiles, accent-soft when on, accent brightness sliders |
| Climate | Pill mode buttons, large temperature value |
| Security | Grouped glass card, open = `--glass-bad` |
| Living Room, Kids, Laundry | Theme-only restyle, no YAML structure change |
| Garage | Only the chrome changes. `custom:garage-card` and its layered assets (`/local/garage-card-custom-v3`) are untouched, no wrapper added |
| Media | Wrapper and background only |

Everything keeps its entity IDs, tap/hold actions, service calls, conditions and templates.

## Key token values (both modes, full set in `tokens.css`)

| Token | Light | Dark |
|---|---|---|
| `--glass-accent` / `-ink` / `-text` | `#1d63ed` / `#ffffff` / `#1a5ad8` | `#5aa2ff` / `#06121f` / `#87bbff` |
| `--glass-ok` / `warn` / `bad` | `#127239` / `#975208` / `#be123c` | `#6ee7b7` / `#fbbf24` / `#fc9dab` |
| `--glass-ink` / `-2` | `#101a2e` / 76% | `#f4f7fc` / 76% |
| `--glass-bg` | white 66% → 34% | white 10% → 4% |
| Blur / saturate | 24px (32px elevated) / 170% | same |

## Verified so far

- `dashboards/glass/contrast.py`: every body-text pair is at least 4.5:1 in both modes, measured over the real wallpapers at worst-case regions (it failed 19 pairs on the first run, which drove the tuning above).
- Mockups checked in headless Chromium in light, dark, Glass Lite, no-backdrop-filter and alert/popup states.

## Not verified / limits

- Nothing has run against a live Home Assistant. `ha core check` is not available in the sandbox, so Phase 3 will use yamllint, `homeassistant/dashboard/validate.py`, a hardcoded-colour lint and screenshots.
- Mockup icons are stand-ins for the MDI icons. The garage-card area is a placeholder.
- Contrast was computed from the wallpaper and glass alphas, not from a screenshot of the live blurred result.

## Next steps

1. Approve (or adjust) the mockups.
2. **Phase 2:** theme + `Glass Lite`, assets, font loader, shared templates, one reference card in live YAML for sign-off.
3. **Phase 3:** per-view commits with yamllint and `validate.py` after each.
4. **Phase 4:** pre-flight checklist and install steps (copy `themes/glass.yaml` to `/config/themes/`, copy `www/glass/` to `/config/www/glass/`, add the `extra_module_url` entry, restart HA, hard-refresh because `/local/` caches aggressively).
