# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Two adults in one household (Sushen and Paro). The main device is a Lenovo Idea Tab Pro mounted on the wall in landscape. They glance at it while walking past and tap it up close to run the house. The kids don't use it directly (confirmed).

## Product Purpose
The Home view of a Home Assistant dashboard (`dashboard-hub`, view `hubhome`). On one screen it shows the state of the house and gives one-tap control of the things used every day. It works when both questions get answered at a glance: "is anything wrong or left on?" and "what's happening today?". Everything else is one tap away.

## Operating Context
- Fixed 16:10 landscape tablet. Kiosk mode can hide the Home Assistant header and sidebar. The view should fit one screen without scrolling.
- Light and dark follow the system setting (the `Glass` theme today).
- The household is in Australia, with relatives in India and Austin, hence the world clocks.

## Capabilities and Constraints
- Content to keep on the Home view (confirmed): greeting, date and clock; weather; world clocks (India, Austin); people (Sushen, Paro) with location and phone battery; quick actions (Good Night, Announce, Lost Phone, WiFi, Robbie the robot vacuum); rooms (Living, Kids, Garage, Outdoor, Laundry, Media) with live status; TV (Apple OTT) media control; Aircon; six favourite lights (Kitchen Pendants, Bedroom Downlights, Media Room, Tall Lamp, Corridor, Hallway); calendar agenda; vehicles (Sorento, Bluey the Tesla) with range and location; Front Door camera; Home Alarm (arm home / arm away); Garage Door; Front Door lock; energy (today's cost, sold, bill to date, estimated bill, tariff period and rate, grid/home/solar flow, Tesla and Kia charging, self-powered %); side navigation (Home, Rooms, Lights, Climate, Security, Music, More) with badge counts.
- Conditional items appear only when relevant: bin collection, washer/dryer running, alert ticker, low camera battery.
- Implementation is Home Assistant Lovelace YAML in `homeassistant/dashboard/master.yaml` using custom:button-card templates, Bubble Card pop-ups and card-mod, with a theme in `homeassistant/themes/`. Any design must be buildable with these.
- Design concepts are done as static HTML mock-ups in `dashboards/` on a 1600×1000 stage, with PNG previews made by headless Chromium.

## Evidence on Hand
- Live screenshot of the current Home view: `dashboards/previews/home-view-current.webp`.
- Earlier concept rounds in `dashboards/` (Aurora, Daylight, Obsidian and the B-series). B5 is the current build.

## Product Principles
1. Status before control: anything left on, open, unlocked or faulty should stand out from across the room.
2. One screen, no scrolling: everything listed above fits the tablet at rest.
3. Calm at rest: when the house is quiet, the screen is quiet.
4. Every tile maps to a real entity. Nothing decorative pretends to be data.
