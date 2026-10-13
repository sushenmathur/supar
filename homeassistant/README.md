# Home Assistant dashboard (glass)

**`dashboard/master.yaml` is the single source of truth.** It is the complete raw configuration
(button-card templates, navbar templates, the Home view and the other nine views) as saved from the live dashboard.
Edit this file (or paste the live raw config back over it), never a copy.

| File | What it is |
|---|---|
| `dashboard/master.yaml` | Complete raw dashboard configuration (master) |
| `dashboard/validate.py` | Checks the master parses, all templates are defined and every JS template block compiles |
| `themes/glass.yaml` | The `Glass` theme (light and dark, follows system mode); every view sets `theme: Glass` |
| `../dashboards/glass/` | **Current** Liquid Glass mockups and tokens (redesign branch) |
| `../dashboards/` | Earlier mockups (previous final: `option-b5-popups.html`) |

### Superseded drafts (kept for history, not live sources)

`master.yaml` and `themes/glass.yaml` are the only live sources. These are older drafts or already merged into them:
`themes/glass-theme-additions.yaml`, `dashboard/glass-vehicle-template.only.yaml`, `dashboard/garage-view.only.yaml`,
`dashboard/announce-card.pills.yaml`, `dashboard/*.paste-under-button_card_templates.yaml`, `dashboard/person-pill-battery-ring.paste.yaml`,
`dashboard/navbar-templates.snippet.yaml`. Do not paste from them.

## Install

1. Copy `themes/glass.yaml` to `/config/themes/glass.yaml` (needs `frontend: themes: !include_dir_merge_named themes`), reload themes,
   and set the tablet profile to Theme **Glass**, Dark mode **Auto**.
2. Dashboard > pencil > three dots > *Raw configuration editor* > select all > paste `master.yaml` > save.
3. Optional: kiosk-mode (HACS) to hide the header and sidebar so the Home view fits one screen.

## Keeping the master current

After changing the dashboard in Home Assistant, copy the raw config back into `dashboard/master.yaml`,
run `python3 dashboard/validate.py`, then commit.

## Notes

- Background: the Home view has no background image, so it follows the system/theme background.
- Not run against a live instance by Claude. Checks are YAML validity, template references and JavaScript syntax only.
