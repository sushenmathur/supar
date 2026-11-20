# Home view redesign – three options

Mock-ups for the Home (`hubhome`) view on the Lenovo wall tablet (16:10 landscape, 1600×1000 stage that scales to fit).
Open any option in a browser; tiles toggle on tap, and the pill at the bottom (or the moon/sun button in the design) switches Day/Night.

Brief (from the Q&A): wall tablet only · status first, then controls (balanced) · adults who are comfortable with tech ·
three different styles · current look feels dated · must keep the front door camera, favourite lights + TV/Aircon, calendar + vehicles ·
energy can shrink to a summary · separate night layout.

| Option | Style | Day layout | Night layout |
|---|---|---|---|
| 1 – Soft Bento | Warm neutral, white rounded tiles, pastel hero (Outfit / Work Sans) | Side rail · bento grid: hero clock, people, security, quick actions, rooms, camera, TV/Aircon, lights, calendar, cars, energy | Warm charcoal bento: big clock, Arm night, door/garage/people status, Good night + 3 lights + small camera |
| 2 – Editorial | Flat Swiss minimal, hairline rules, one orange signal colour (Space Grotesk / Inter) | Text tab bar · big type hero with a plain-English house summary · four numbered columns · rooms index along the bottom | Pure black, giant clock, summary sentence, Arm night / Good night rows, 3 light switches |
| 3 – Ambient | Dark-first, tiles that glow in the colour of what is on (Plus Jakarta Sans) | Status chips across the top · rooms column · large camera · favourites with an Aircon dial · floating dock with nav and quick actions | Centred clock in a ring with status around it, 4 round buttons |

`node shoot.cjs` (with `NODE_PATH` set to the global node_modules) regenerates `previews/*-day.png` and `*-night.png`.
Camera images are drawn placeholders. Built using guidance from the `ui-ux-pro-max` skill (44px+ touch targets, SVG icons, ≥4.5:1 text contrast, reduced-motion respected).
