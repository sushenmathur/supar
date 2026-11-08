# Mobile Hub “Announce” button — problem report

**Date:** 2026-11-06 (fixed 2026-11-06, verified 2026-11-08)
**Dashboard:** Mobile Home (`mobile-hub`) → view `mobile-hub` → section 1 → “Quick actions” bento → card index 2
**Script:** `script.say_tts_message` (“Home Announcement”) and `script.announce_from_helpers`

---

## Symptom

Tapping **Announce** in the Mobile Home dashboard produced no announcement on the phone.

## Root cause

The mobile button called the Home Announcement script with no inputs:

```yaml
tap_action:
  action: perform-action
  perform_action: script.turn_on
  target:
    entity_id: script.say_tts_message
```

`script.say_tts_message` requires `message` and builds its speaker target from `{{ speakers }}`.
The `default: media_player.home_speakers` on the `speakers` field is only a UI prefill for the
script's Run dialog — **script field defaults are not applied to service calls**.

So the first action:

```yaml
- action: media_player.volume_set
  target:
    entity_id: "{{ speakers }}"
```

rendered an empty entity ID and aborted the script before TTS. The tap did reach
Home Assistant and did start the script, but it failed within milliseconds.

## Evidence

Logbook for `script.say_tts_message` showed repeated starts going back to `off` almost
instantly (e.g. `22:41:13.139Z` → `22:41:13.140Z`), and the Core log matched each press:

```
WARNING  Template variable warning: 'speakers' is undefined when rendering '{{ speakers }}'
ERROR    Home Announcement: Error executing script.
         Error for call_service at pos 1: Template rendered invalid entity IDs:
```

The last matching entry was `09:02:19` local (Brisbane) on 2026-11-07 — the press reported.

## Why the desktop dashboard worked

The desktop **Home** dashboard (`dashboard-hub`) uses a different wiring: its Announce
button opens a Browser Mod popup with a speaker select, message text and volume, and the
popup’s Announce button runs `script.announce_from_helpers`, which passes all three values
through to `script.say_tts_message`. That is why the same idea worked there but not on mobile.

## Fix applied

Replaced only that card’s `tap_action` (no other dashboard content, no YAML files, no
reload/restart — storage dashboards save live).

New behaviour:

1. Clears `input_text.announce_message`.
2. Opens a simplified, phone-friendly Browser Mod popup containing a single `entities`
   card with:
   - `input_select.announce_speaker` (Speaker)
   - `input_text.announce_message` (Message)
   - `input_number.announce_volume` (Volume)
3. **Cancel** closes the popup.
4. **Announce** runs `script.announce_from_helpers` (which speaks via
   `script.say_tts_message` and clears the message afterwards), then closes the popup.

```yaml
tap_action:
  action: fire-dom-event
  browser_mod:
    service: browser_mod.sequence
    data:
      sequence:
        - service: input_text.set_value
          data:
            entity_id: input_text.announce_message
            value: ""
        - service: browser_mod.popup
          data:
            title: Announce
            icon: mdi:bullhorn
            size: normal
            dismissable: true
            content:
              type: vertical-stack
              cards:
                - type: entities
                  entities:
                    - entity: input_select.announce_speaker
                      name: Speaker
                      icon: mdi:speaker-multiple
                    - entity: input_text.announce_message
                      name: Message
                      icon: mdi:message-text
                    - entity: input_number.announce_volume
                      name: Volume
                      icon: mdi:volume-high
                - type: horizontal-stack
                  cards:
                    - type: custom:button-card
                      name: Cancel
                      show_icon: false
                      tap_action:
                        action: perform-action
                        perform_action: browser_mod.close_popup
                      styles:
                        card:
                          - height: 48px
                          - border-radius: 14px
                    - type: custom:button-card
                      name: Announce
                      icon: mdi:bullhorn
                      tap_action:
                        action: perform-action
                        perform_action: browser_mod.sequence
                        data:
                          sequence:
                            - service: script.announce_from_helpers
                            - service: browser_mod.close_popup
                      styles:
                        card:
                          - height: 48px
                          - border-radius: 14px
                          - background: var(--primary-color)
                          - color: var(--text-primary-color)
```

## Application and verification

- Applied with `hab dashboard patch mobile-hub`, pinned to the previewed `base_revision`.
- Preview diff contained exactly four changes, all inside the Announce card’s `tap_action`
  (`action` changed, `browser_mod` added, old `perform_action` and `target` removed).
- Apply result: `status: verified`, `saved: true`, `verified: true`; the observed revision
  matched the expected post-patch revision.
- Independent read-back of the dashboard confirmed the stored card contains only
  `icon`, `name`, `tap_action`, `template`, `type`, with the new popup config intact.
- Confirmed `browser_mod.sequence`, `browser_mod.popup`, `browser_mod.close_popup` and
  `input_text.set_value` all exist on this instance.
- No audible test announcement was run (it would speak in the house). The page was
  screenshotted, but the reviewing model could not read images, so rendering was not
  visually confirmed.

## How to test

1. Open the Companion app and refresh the dashboard (pull down, or close/reopen the app).
2. Tap **Announce**.
3. Choose a speaker, type a message, set volume, tap **Announce**.
4. The message should play and the popup should close.

## Notes

- **Quiet hour:** `script.announce_from_helpers` does not check
  `input_boolean.quiet_hour`. Per the user’s instruction, announcements intentionally
  override quiet hour; no gating was added.
- Browser Mod is already in use on this dashboard (the adjacent Quiet hour buttons use the
  same popup mechanism), so no additional integration is required.
- If the popup does not appear on a device, that device’s Browser Mod registration is the
  thing to check first.
