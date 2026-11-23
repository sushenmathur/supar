---
version: 1
slug: "dashboards-home-2026-index-html"
primary_target: "dashboards/home-2026/index.html"
related_targets: ["dashboards/home-2026/option-1-glass.html","dashboards/home-2026/option-2-blockprint.html","dashboards/home-2026/option-3-scoreboard.html"]
---

# Home dashboard options (wall tablet), November 2026

Scope: three static HTML mock-ups of the SuPar Home view for the kitchen wall tablet (1280×800 CSS px, landscape), each with light and dark modes. Mode: Operate. Build path: code-led (no image generation). All of today's Home content at equal weight; sample data, labelled.

Unresolved: which option to take forward; whether the chosen one becomes a live Kiosk Satellite page or a Lovelace theme.

## Direction contract

### Option 1: Glass, evolved (pinned by the owner: "One near Glass, two new")
THESIS: Keep the Glass world, fix its noise. One blur level, three radii, glance-distance hierarchy; refuses gradient-on-gradient tiles where nothing leads.
OWN-WORLD: Glass wallpaper gradients, frosted panels, white hairline edges; Figtree; amber light-glow for "on", rose for alerts; drawn line icons.
STORY: From across the kitchen: time, any alert, who's home. Up close: one tap for lights, actions, rooms.
FIRST VIEWPORT: Side rail nav left. Top band: alert banner across, then greeting/clock panel, people, actions. Middle: room strip. Bottom three columns: favourites (TV, Aircon, six lights), calendar + cars + camera, security + bins + appliances + energy.
FORM: seed: none (pinned) "One near Glass, two new". Signature move: lit tiles glow in their room's tint, like light through frosted glass.

### Option 2: Block print (assigned)
THESIS: The home as hand-blocked cotton: an indigo key-line grid on blued cotton, state printed as a second colour pass. Refuses grey cards with one accent.
OWN-WORLD: neel-blued cotton ground (light) / indigo-dyed ground (dark); indigo ink lines; turmeric for on, madder for alerts, dabu green for OK; Hind; square-ish 6px corners, 1.5px key lines.
STORY: Same jobs; state reads as colour blocks.
FIRST VIEWPORT: Top tab bar nav. Left: tall day column (clock, weather, people, calendar). Right: grid of rooms, actions, lights, security, energy, appliances, camera.
FORM: candidate 5 of 7; seed:0314b235cd733303. Signature move: registration offset: an active tile's turmeric (or alert madder) block sits printed 4px off its indigo key line.

### Option 3: Scoreboard (Impeccable's pick)
THESIS: The house read like a heritage cricket scoreboard: every value a painted plate in a slot, legible across the room. Refuses floating glass tiles.
OWN-WORLD: scoreboard green ground (dark) / sightscreen white (light); white painted numerals in dark-green slots; gold for "in"/on, red "out" light for alerts; Barlow Condensed plates, Barlow body; square corners.
STORY: The board answers first (time, temp, home, lights on, alerts); controls sit below.
FIRST VIEWPORT: Bottom dock nav. Top: the board, a full-width row of numbered slots. Below: three columns of plated rows for people/actions/rooms, lights/TV/aircon, security/bins/appliances/energy/calendar/camera.
FORM: candidate 1 of 7 (Impeccable's pick); seed:0314b235cd733303. Signature move: changed values swap like plates, a short vertical slide.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
