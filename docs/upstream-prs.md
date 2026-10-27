# Upstream pull requests for tamaygz/hacs-stremio

Open them in this order. Each branch is based on upstream `master` (v0.5.46,
7d8d3e7), has no version bumps, and stacks on the one before.

---

## 1. VLC handover via vlc-x-callback, and Apple TV target resolution

**Open:** https://github.com/tamaygz/hacs-stremio/compare/master...sushenmathur:hacs-stremio:pr/vlc-handover

**Title:** Fix VLC handover on tvOS and use the card's Apple TV entity

**Description:**

Fixes VLC handover to Apple TV and follows up on #11 / #12.

- `generate_vlc_deep_link()` built `vlc://<raw url>`, which tvOS VLC doesn't
  accept. It now builds `vlc-x-callback://x-callback-url/stream?url=<encoded>`
  with the stream URL fully percent-encoded. Tested on two Apple TVs with MP4 and
  MKV streams via `media_player.play_media` (`media_content_type: url`).
- `auto` sends MKV/WebM to VLC; HLS/MP4 still go to AirPlay.
- The stream dialog no longer falls back to a hardcoded `media_player.apple_tv`.
  The service uses the card's entity if it exists, otherwise the Apple TV entity
  set in the integration options, otherwise a clear `ServiceValidationError`.
  `device_id` is now optional.
- Stream URLs are no longer logged (debrid links carry API tokens); logs show
  the host and length only.

Tests added for link encoding, log redaction and target resolution.

Note: VLC launch needs the Apple TV paired with the Companion protocol in HA's
Apple TV integration (the entity then has a `source_list`).

---

## 2. Handover hardening, faster wake, card options

**Open (after #1 is open):** https://github.com/tamaygz/hacs-stremio/compare/master...sushenmathur:hacs-stremio:pr/handover-hardening

**Title:** Harden Apple TV handover and wake a sleeping Apple TV before VLC

**Description:**

Builds on #<PR 1>; review its last three commits.

- **No URLs in errors.** Handover errors and logs are passed through
  `safe_error()`, which replaces any `scheme://…` with `<redacted-url>`. Before,
  the target integration's error text (including the full deep link and debrid
  token) reached the UI toast and `home-assistant.log`.
- **Apple TV targets only.** `_resolve_apple_tv_entity()` checks the entity
  registry platform. A non-`apple_tv` entity (for example a Music Assistant
  AirPlay speaker with the same name, which fails with "Could not resolve … to
  playable media item") falls back to the configured default or raises
  `not_apple_tv_entity` naming the entity and its platform.
- **Card editors** list only `apple_tv` platform entities in the Apple TV
  quick-picks and picker (custom entries still allowed).
- **Wake before VLC.** If the Apple TV is `off`/`standby`, the VLC handover turns
  it on, waits until it reports awake (max 30 s) plus `wake_delay` (default 3 s),
  then checks VLC came to the front within 8 s and resends up to 2 times. tvOS
  drops app launches while it is still waking. New optional `wake_delay` field.
- **Card options:** `show_copy_button: false` hides Copy URL in the stream
  dialog; `open_in_stremio_script` runs an HA script instead of the
  `stremio://` link (useful on wall panels, e.g. to turn on a TV and open the
  Stremio app on it).

Tests added for redaction, platform checks, wake, resend and retry limits.

---

## 3. Continue Watching: save VLC progress to Stremio

**Open (after #2 is open):** https://github.com/tamaygz/hacs-stremio/compare/master...sushenmathur:hacs-stremio:pr/continue-watching-sync

**Title:** Save VLC playback on Apple TV to Stremio Continue Watching

**Description:**

Builds on #<PR 2>; review its last three commits. Overlaps in purpose with #23;
happy to rebase onto it or fold this into it if you prefer that approach.

VLC on tvOS can't report progress to Stremio and has no start-position
parameter (it also ignores `media_seek`). The Apple TV integration does expose
VLC's now-playing info (`app_id: org.videolan.vlc-ios`, `media_position`,
`media_position_updated_at`, `media_duration`), so the integration can mirror
playback to Stremio:

- On a VLC handover with a `media_id`, the title is written to Stremio via
  `datastorePut` so it appears in Continue Watching. Titles not in the library
  are stored `removed + temp`, like Stremio's own players.
- `playback_tracker.py` follows the Apple TV entity and saves the position on
  pause, every 60 s while playing, and when VLC stops; past 92 % it marks the
  title watched. The previously saved position is kept for 5 minutes so the
  viewer can skip ahead (VLC always starts at 0:00).
- Cards send `media_id`, `media_type`, `season`, `episode` with the handover;
  new `track_progress` field (default on).
- Continue-watching items expose `time_offset` (Stremio `timeOffset`) and
  `video_id`; the stream dialog shows "Last stopped at mm:ss" for the episode in
  progress.
- `progress_percent` uses the stopped-at position and is capped at 100 %
  (timeWatched-based values went above 100 % after rewatching).
- Continue Watching includes `temp` items, matching Stremio.

Tests added for the client write, live position, tracker lifecycle and
percentage fix.
