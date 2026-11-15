# Stremio integration: fork changes and upstream PRs

The Stremio integration is a fork of `tamaygz/hacs-stremio`. The fork lives at
`sushenmathur/hacs-stremio`.

| | |
|---|---|
| Fork | https://github.com/sushenmathur/hacs-stremio |
| Upstream | https://github.com/tamaygz/hacs-stremio |
| Fork base | upstream `master` v0.5.46 (`7d8d3e7`) |
| Fork `master` | **v0.5.46.9** (`43a9f3a`) |
| Tags on the fork | v0.5.46.1, .3, .4, .6, .7, .8, .9 |
| Upstream PRs | #27, #28, #29 (stacked, not merged, upstream `master` is still `7d8d3e7`) |

HACS installs the fork's releases. Releases are published by hand on GitHub,
because this session cannot push tags or create releases.

---

## What the fork does

The goal is to play a Stremio stream on the Apple TV in VLC from the
dashboard cards, and keep Stremio's Continue Watching up to date while it plays.

1. **VLC handover that works on tvOS.** It uses a `vlc-x-callback` link with
   the stream URL percent-encoded. The old `vlc://` link never worked.
2. **The right Apple TV.** It uses the card's Apple TV, otherwise the one set
   in the integration options. Only `apple_tv` platform entities are accepted.
3. **Wakes a sleeping Apple TV.** It waits until the Apple TV is awake, then
   checks that VLC opened and resends the link if it didn't.
4. **Continue Watching sync.** It follows VLC's now-playing position on the
   Apple TV and saves it back to Stremio. It marks the title watched near the
   end.
5. **No stream links or keys in Home Assistant.** Debrid links carry API
   keys. They are kept out of logs, error toasts, sensor states, history and
   events.

---

## Release history (fork `master`)

Each release is a feature commit followed by a version bump.

### v0.5.46.1: VLC handover and Apple TV target (26 Oct 2026)

- **`bc98718`: use a vlc-x-callback link for the VLC handover and redact
  stream URLs in logs**
  - `generate_vlc_deep_link()` returns
    `vlc-x-callback://x-callback-url/stream?url=<encoded>`.
  - `auto` sends MKV and WebM to VLC. HLS and MP4 still go to AirPlay.
  - Logs show only the host and length of a URL (`redact_url()`).
- **`63b319e`: resolve the Apple TV target in the handover service and drop
  the hardcoded fallback**
  - `device_id` is optional.
  - The target is the requested entity, otherwise the configured Apple TV,
    otherwise a `no_apple_tv_entity` error.
  - The dialog no longer sends the non-existent `media_player.apple_tv`.
- **`90dfa5d`: redact stream URLs in the coordinator and media source logs.**

### v0.5.46.2: handover hardening and card options (27 Oct 2026)

- **`fc26f52`: keep URLs out of handover errors, accept only Apple TV
  targets, and wake the Apple TV before VLC**
  - `safe_error()` replaces any `scheme://…` link with `<redacted-url>`, in
    both errors and logs.
  - A non-Apple TV target (for example a Music Assistant AirPlay speaker)
    falls back to the default, or raises `not_apple_tv_entity`.
  - A sleeping Apple TV is turned on and the handover waits until it reports
    awake (max 30 s), plus `wake_delay`.
- **`f196d83`: card options**
  - The card editors list only Apple TV entities.
  - `show_copy_button: false` hides Copy URL.
  - `open_in_stremio_script` runs a Home Assistant script instead of the
    `stremio://` link.

### v0.5.46.3: show where playback stopped (27 Oct 2026)

- **`978a26b`**
  - Continue Watching items carry `time_offset` and `video_id`.
  - The stream dialog shows "Last stopped at mm:ss". VLC on tvOS can't start
    at a position, so this tells you where to skip to.

### v0.5.46.4: save VLC playback to Continue Watching (27 Oct 2026)

- **`f6d31f2`: add `playback_tracker.py`**
  - On a VLC handover, the title is written to Stremio (`datastorePut`).
    Titles not in the library are stored `removed + temp`, the same way
    Stremio's own players do it.
  - The tracker follows the Apple TV's VLC now-playing info. It saves on
    pause, every 60 s and when VLC stops, and marks the title watched past
    92 %.
  - It keeps the previous resume point for 5 minutes, because VLC always
    starts at 0:00.
  - Cards send `media_id`, `media_type`, `season` and `episode`, plus a new
    `track_progress` option.
  - `progress_percent` is capped at 100 %.

### v0.5.46.5: start VLC sooner after waking (27 Oct 2026)

- **`10e1f64`**
  - `wake_delay` defaults to 3 s (was 15 s).
  - After a wake, it checks that VLC came to the front within 8 s and resends
    the link up to 2 times.

### v0.5.46.6: series in Continue Watching (27 Oct 2026)

- **`f65885f`**
  - Series that weren't in the library were never recorded, because Cinemeta
    only gives `defaultVideoId` for movies.
  - The entry is now built from the Cinemeta name and poster.

### v0.5.46.7: Continue Watching rule and recorder size (27 Oct 2026)

- **`0b17f25`**
  - Continue Watching uses Stremio's rule: started (`timeOffset > 0`) and not
    finished.
  - The sensors' `items` attribute is excluded from the recorder, which had
    warned about the 16 KB limit.

### v0.5.46.8: now playing and stream URL privacy (27 Oct 2026)

- **`a79de77`**
  - Cards send the title and poster with the handover, so Now Playing fills in
    straight away.
  - The Current Stream URL sensor and the `stremio_playback_started` event show
    only the host and file name. The full link, with the debrid key, had been
    stored in history, the logbook and the events table.

### v0.5.46.9: now playing follows the latest handover (27 Oct 2026)

- **`6f62d2d`**
  - Current watching is the most recent title that was started and isn't
    finished. A title saved at 1 s had rounded to 0 % and was skipped.
  - A handover stays as Now Playing for up to 10 minutes until Stremio's
    Continue Watching picks it up.

---

## Pull requests submitted upstream

The three PRs were raised against `tamaygz/hacs-stremio` from the fork's
`pr/*` branches.

- They are stacked: each one includes the one before.
- Each is based on upstream `master` v0.5.46, with no version bumps and no
  attribution trailers.
- The PR head commits match the fork branches exactly (checked against the
  upstream `refs/pull/*/head` on 15 Nov 2026).
- Full PR descriptions are in [`upstream-prs.md`](upstream-prs.md).

| PR | Branch | Head | Title | Commits |
|---|---|---|---|---|
| [tamaygz/hacs-stremio#27](https://github.com/tamaygz/hacs-stremio/pull/27) | `pr/vlc-handover` | `03e8e31` | Fix VLC handover on tvOS and use the card's Apple TV entity | 2 |
| [tamaygz/hacs-stremio#28](https://github.com/tamaygz/hacs-stremio/pull/28) | `pr/handover-hardening` | `1245326` | Harden Apple TV handover and wake a sleeping Apple TV before VLC | +3 on #27 |
| [tamaygz/hacs-stremio#29](https://github.com/tamaygz/hacs-stremio/pull/29) | `pr/continue-watching-sync` | `3014bcf` | Save VLC playback on Apple TV to Stremio Continue Watching | +7 on #28 |

### tamaygz/hacs-stremio#27: VLC handover

- `90f8f79`: use the vlc-x-callback link for VLC handover and redact stream
  URLs in logs.
- `03e8e31`: resolve the Apple TV target in the handover service and drop the
  hardcoded fallback.

### tamaygz/hacs-stremio#28: handover hardening

- `f6efe72`: keep URLs out of handover errors, accept only Apple TV targets,
  and wake before VLC.
- `9ef84b6`: cards get Apple TV-only pickers, an optional copy button and an
  Open in Stremio script.
- `1245326`: start VLC sooner after waking the Apple TV.

### tamaygz/hacs-stremio#29: Continue Watching sync

- `74e38a6`: Continue Watching shows where playback stopped.
- `f32691c`: save VLC playback to Stremio Continue Watching.
- `c40faf5`: use the shared VLC app ID in the playback tracker.
- `ea90ccb`: record new series in Continue Watching.
- `466a02d`: match Stremio's Continue Watching rule and keep item lists out of
  history.
- `66a4081`: show handed-over titles as now playing and keep stream links out
  of states.
- `3014bcf`: now playing follows the latest handover.

This PR overlaps with upstream tamaygz/hacs-stremio#23, which also does
progress sync. The PR description includes a comparison table and offers to
rebase onto #23 or fold into it.

### Status

None of the three PRs is merged; upstream `master` is still `7d8d3e7`. I
couldn't read their open or closed state or any review comments from this
session, so check the PR pages for those.

---

## Dashboard side (`mobile-hub`)

These parts of the mobile dashboard use the fork:

- **Media page:** a Stremio card under the music player. It shows the counts,
  the latest title with its progress bar, and Continue, Browse and Library
  buttons.
- **Pop-ups:** `#stremio-continue`, `#stremio-browse` and `#stremio-library`.
  They use the fork's cards with these settings:
  - `apple_tv_entity: media_player.media_apple_tv`
  - `show_copy_button: false`
  - `open_in_stremio_script: script.media_tv_open_stremio`
  - full-width, auto-height layout
- **Entities used:**
  - `sensor.stremio_mathur_sushen_gmail_com_continue_watching_count`
  - `sensor.stremio_mathur_sushen_gmail_com_library_count`
  - `media_player.stremio_mathur_sushen_gmail_com_stremio`

---

## Security notes

- Stream URLs and tokens must never be printed, logged or committed. This
  applies to code, tests, commit messages, PR text and chat.
- Before v0.5.46.8, the full stream link (with the Real-Debrid key) was stored
  in Home Assistant history. The follow-up recommended at the time was:
  1. Reset the Real-Debrid API key.
  2. Purge the old history with `recorder.purge_entities` for
     `sensor.stremio_mathur_sushen_gmail_com_current_stream_url`.

---

## Rules followed for this work

- No AirPlay or direct handover changes, no Infuse, and no LG playback route.
- No pre-encoded stream URLs in service calls. The integration does the
  encoding.
- No version bumps on the upstream PR branches. Version bumps happen only on
  the fork's `master`.
- `.storage` is not edited by hand while Home Assistant is running.
