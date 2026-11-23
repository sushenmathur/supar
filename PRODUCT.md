# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The Mathur household (Sushen, Paro and the kids, Samar and Shanaya). The main surface is the Home view on a wall-mounted Android tablet (Lenovo Idea Tab Pro, 16:10, landscape) in the kitchen / family area. The whole family, kids included, glances at it from across the room and taps it up close to switch lights, run actions and check the front-door camera.

## Product Purpose

SuPar Home is the family's Home Assistant dashboard. The Home view answers "what's happening at home right now" at a glance (time, weather, alerts, who's home, doors, alarm, lights, cars, bins, appliances, energy) and offers one-tap control of the things used daily. Success: anyone in the family can read the important state from across the kitchen and act on it in one tap, without a learning curve.

## Positioning

A single family's home, not a generic smart-home template: their own people, cars (the Kia Sorento and the Tesla "Bluey"), robot vacuum "Robbie", rooms, bins, solar and tariff, and family calendar, arranged for their kitchen wall.

## Operating Context

- Runs as a Lovelace sections dashboard (`homeassistant/dashboard/master.yaml`, view `hubhome`), shown on the tablet through the Kiosk Satellite app, which can also show custom HTML pages served from HA's `/local/`.
- The tablet follows system light/dark mode (auto by time of day), so every design needs both.
- Always on; Kiosk Satellite runs a screensaver when idle.
- Navigation to the other views (Rooms, Lights, Climate, Security, Music, More) is a side navbar; rooms open as popups.

## Capabilities and Constraints

- Home view content to carry (today, all at equal weight): alert banner (garage/doors open, quiet hour, with close/snooze); greeting with date, time, weather and India/Austin clocks; Sushen and Paro presence pills with phone battery; quick actions (Good Night, Festive, Announce/Quiet hour, Lost Phone, WiFi, Robbie); room tiles (Living, Kids, Garage, Outdoor, Laundry, Media) with live summaries; TV and Aircon; six favourite lights; family calendar; Sorento and Bluey car chips; front-door camera snapshot; next bin collection; alert ticker; Home Alarm; garage door; front door; energy (cost today, solar credit, bill to date, estimate, live flow grid/home/solar, Tesla and Kia charging, self-powered %); washer and dryer status.
- Design mock-ups are static HTML with realistic sample data; any live build later runs as a Kiosk Satellite custom page with no runtime requests beyond Home Assistant.
- Touch targets at least 48 px; readable from across a kitchen.
- Previously explored and rejected or superseded directions live in `dashboards/` (Aurora, Daylight, Obsidian; the shipped look is the Glass theme, `homeassistant/themes/glass.yaml`).

## Brand Commitments

- The current Glass theme is the incumbent look. For the November 2026 Home redesign the owner asked for three options: one an evolution of Glass, two genuinely new directions.

## Evidence on Hand

- Live config: `homeassistant/dashboard/master.yaml`; theme: `homeassistant/themes/glass.yaml`; screenshot of today's Home view: `dashboards/previews/home-view-current.webp`.
- No real photos for the camera feed are in the repo; mock-ups use labelled stand-ins.

## Product Principles

- Glanceable first: the most important state reads from across the room.
- One tap for daily actions; anything risky (garage, unlock) asks for confirmation.
- Familiar to the whole family, kids included: plain words, no jargon.
- Calm when all is well, unmistakable when something needs attention.
