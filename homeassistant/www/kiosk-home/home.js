// Ports of the hubhome cards' logic (master.yaml). Pure: each function takes `get(id)` → state object.
import { E, FAV, LIGHT_POOL, LIGHT_META, ROOM_LIGHTS, SECURITY_CONTACTS, MEDIA, MEDIA_PLAYERS, BINS } from './config.js?v=29';

const st = (get, id) => get(id)?.state;
const on = (get, id) => st(get, id) === 'on';
const numOf = (get, id) => { const v = parseFloat(st(get, id)); return Number.isFinite(v) ? v : NaN; };
const changedAt = (get, id) => new Date(get(id)?.last_changed || 0).getTime();
export const titleCase = (s) => String(s).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const BAD_DOCK = (v) => Boolean(v) && !['ok', 'unavailable', 'unknown'].includes(v);

// ---- Alert banner ----

/** The banner's alert list, sorted by priority, ties in insertion order. Priority: 1 high (red), 2 medium (amber),
 *  3 low (grey). `door` is the door's name for grouping ("Garage and side doors open"). Patio, laundry and the front
 *  door (security door closed) only count at night; Snooze hides them and the Robbie and camera battery alerts. */
export function alerts(get) {
  const list = [];
  const push = (a) => list.push(a);
  const snoozed = on(get, E.snooze);
  const night = st(get, E.sun) === 'below_horizon';
  const front = on(get, E.frontContact);
  const screen = on(get, E.screenContact);
  if (on(get, E.garageContact)) {
    const kept = on(get, E.keepGarage);
    push({ p: kept ? 2 : 1, id: E.garageContact, door: 'Garage', kept, msg: kept ? 'Garage door kept open' : 'Garage door open', icon: 'garage' });
  }
  if (on(get, E.sideContact)) {
    const kept = on(get, E.keepSide);
    push({ p: kept ? 2 : 1, id: E.sideContact, door: 'Side', kept, msg: kept ? 'Side door kept open' : 'Side door open', icon: 'door' });
  }
  // Front and security doors both open: high. The security door on its own: high. The front door on its own: low.
  if (screen) {
    if (front) push({ p: 1, id: E.frontContact, door: 'Front', msg: 'Front door open', icon: 'door' });
    push({ p: 1, id: E.screenContact, door: 'Security', msg: 'Security door open', icon: 'shield' });
  }
  if (!snoozed) {
    if (night && front && !screen) push({ p: 3, id: E.frontContact, door: 'Front', msg: 'Front door open', icon: 'door' });
    if (night && on(get, E.patioContact)) push({ p: 2, id: E.patioContact, door: 'Patio', msg: 'Patio door open', icon: 'door' });
    if (night && on(get, E.laundryContact)) push({ p: 2, id: E.laundryContact, door: 'Laundry', msg: 'Laundry door open', icon: 'door' });
    if (BAD_DOCK(st(get, E.robbieDock))) push({ p: 2, id: E.robbieDock, msg: 'Roborock water tank empty', icon: 'robot' });
    const bat = numOf(get, E.sideBattery);
    if (!Number.isNaN(bat) && bat < 20) push({ p: 2, id: E.sideBattery, msg: 'Side camera battery low', icon: 'alert' });
  }
  if (on(get, E.quietHour)) push({ p: 3, quiet: true, id: E.quietHour, msg: 'Quiet hour on', icon: 'bellOff' });
  // The hallway door shows whenever it's open, day or night: worth knowing, not a warning.
  if (on(get, E.hallwayContact)) push({ p: 3, id: E.hallwayContact, door: 'Hallway', msg: 'Hallway door open', icon: 'door' });
  return list.map((a, i) => ({ ...a, i })).sort((a, b) => a.p - b.p || a.i - b.i);
}

export function minutesText(mins) {
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

/** One priority's alerts as text: "Garage and side doors", "Garage door kept open", "Roborock water tank empty".
 *  With `open`, open doors say so ("Garage and side doors open"). */
export function groupText(group, open = false) {
  const doors = group.filter((a) => a.door);
  const parts = [];
  if (doors.length === 1 && doors[0].kept) parts.push(doors[0].msg);
  else if (doors.length) {
    const names = doors.map((a, i) => (i ? a.door.toLowerCase() : a.door) + (a.kept ? ' (kept open)' : ''));
    const joined = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
    parts.push(`${joined} ${names.length > 1 ? 'doors' : 'door'}${open ? ' open' : ''}`);
  }
  for (const a of group) if (!a.door) parts.push(a.msg);
  return parts.join(' · ');
}

const LEVEL = { 1: 'urgent', 2: 'warn', 3: 'note' };

/** The banner: one entry per priority. The highest priority is the title, in its colour (red, amber, grey); each
 *  lower priority is a chip in its own colour. */
export function banner(get, now = Date.now()) {
  const list = alerts(get);
  if (!list.length) return { level: 'calm', title: 'All clear', sub: 'Doors closed · no alerts', icon: 'check', chips: [], list };
  const groups = [1, 2, 3].map((p) => list.filter((a) => a.p === p)).filter((g) => g.length);
  const icon = (g) => (g.length > 1 ? 'alert' : g[0].icon);
  const top = groups[0];
  // How long since the newest alert in the top group.
  const mins = Math.max(0, Math.round((now - Math.max(...top.map((a) => changedAt(get, a.id)))) / 60000));
  const dur = minutesText(mins);
  const sub = top.every((a) => a.quiet) ? `${dur} · Automated announcements suppressed` : `For ${dur}`;
  const chips = groups.slice(1).map((g) => ({ level: LEVEL[g[0].p], text: groupText(g), icon: icon(g) }));
  return { level: LEVEL[top[0].p], title: groupText(top, true), sub, icon: icon(top), chips, list };
}

/** Which banner buttons show. */
export function bannerButtons(get) {
  const night = st(get, E.sun) === 'below_horizon';
  const snoozable = night && [E.frontContact, E.patioContact, E.laundryContact].some((id) => on(get, id))
    || BAD_DOCK(st(get, E.robbieDock))
    || numOf(get, E.sideBattery) < 20;
  return {
    close: on(get, E.garageContact) && st(get, E.garageCover) === 'open',
    keepGarage: on(get, E.garageContact),
    keepSide: on(get, E.sideContact),
    snooze: !on(get, E.snooze) && snoozable,
    endQuiet: on(get, E.quietHour),
  };
}

// ---- Header ----

export function greeting(hour) {
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

const CONDITIONS = {
  'clear-night': 'Clear night', cloudy: 'Cloudy', exceptional: 'Exceptional', fog: 'Fog', hail: 'Hail', lightning: 'Lightning',
  'lightning-rainy': 'Thunderstorms', partlycloudy: 'Partly cloudy', pouring: 'Pouring', rainy: 'Rainy', snowy: 'Snowy',
  'snowy-rainy': 'Sleet', sunny: 'Sunny', windy: 'Windy', 'windy-variant': 'Windy',
};
export function conditionText(state) {
  if (!state || state === 'unavailable' || state === 'unknown') return '';
  return CONDITIONS[state] ?? titleCase(state);
}

/** Icon key for the weather state (day/night aware). */
export function weatherIcon(state, night) {
  if (state === 'clear-night' || (state === 'sunny' && night)) return 'moon';
  if (state === 'sunny') return 'sun';
  if (state === 'partlycloudy') return night ? 'cloud' : 'cloudsun';
  if (['rainy', 'pouring', 'hail', 'lightning', 'lightning-rainy', 'snowy', 'snowy-rainy'].includes(state)) return 'rain';
  return 'cloud';
}

export function personPlace(state) {
  return { home: 'Home', not_home: 'Away', 'Sushen - Work': 'Office', 'Paro - Work': 'Work', Gym: 'Gym' }[state] ?? (state || '—');
}

/** True when the phone is charging: reads the first of `ids` that has a usable state (not missing, unavailable or unknown). */
export function isCharging(get, ids) {
  for (const id of [].concat(ids)) {
    const v = String(get(id)?.state ?? '').trim().toLowerCase();
    if (v && v !== 'unavailable' && v !== 'unknown') return v === 'charging';
  }
  return false;
}

/** Battery colour band used across the dashboard: low <20, mid <50, ok otherwise. */
export function batteryBand(pct) {
  if (!Number.isFinite(pct)) return 'none';
  return pct < 20 ? 'low' : pct < 50 ? 'mid' : 'ok';
}

export function carLabel(get, car) {
  const t = st(get, car.tracker);
  const place = t === 'home' ? 'Home' : t === 'not_home' ? 'Away' : (t || '—');
  const pct = numOf(get, car.battery);
  const charging = car.chargingFlag ? on(get, car.chargingFlag) : numOf(get, car.chargingPower) > 10;
  return { place, pct: Number.isNaN(pct) ? null : Math.round(pct), charging };
}

// ---- Rooms ----

const lightCount = (get, ids) => ids.filter((id) => on(get, id)).length;
const countLabel = (n) => (n ? `${n} on` : 'All off');
const MACHINE_OFF = ['power_off', 'unavailable', 'unknown'];

export function rooms(get, mediaIds = []) {
  const living = lightCount(get, ROOM_LIGHTS.living);
  const kidsLights = lightCount(get, ROOM_LIGHTS.kids);
  const inRoom = [on(get, E.shanaya) && 'Shanaya', on(get, E.samar) && 'Samar'].filter(Boolean);
  const outdoor = lightCount(get, ROOM_LIGHTS.outdoor);

  const cover = st(get, E.garageCover);
  const door = { open: 'Door open', closed: 'Door closed', opening: 'Door opening', closing: 'Door closing' }[cover] ?? `Door ${cover ?? '—'}`;
  const gl = st(get, E.garageLight);
  const glText = gl === 'on' ? 'Light on' : gl === 'off' ? 'Light off' : 'Light unavailable';
  const garageOpen = cover === 'open' || cover === 'opening' || on(get, E.garageContact);

  const washer = !MACHINE_OFF.includes(st(get, E.washer) ?? 'unknown');
  const dryer = !MACHINE_OFF.includes(st(get, E.dryer) ?? 'unknown');
  const laundry = washer && dryer ? 'Washer & dryer on' : washer ? 'Washer running' : dryer ? 'Dryer running' : 'Idle';

  const media = mediaLabel(get, mediaIds);
  return {
    living: { label: countLabel(living), on: living > 0 },
    kids: { label: inRoom.length ? `${inRoom.join(' & ')} in · ${countLabel(kidsLights)}` : countLabel(kidsLights), on: kidsLights > 0 },
    // An open garage reads as an alert here, as it does in the banner and security column.
    garage: { label: garageOpen ? door : `${titleCase(door.replace('Door ', ''))} · ${glText.replace('Light ', 'light ')}`, on: gl === 'on', alert: garageOpen },
    outdoor: { label: countLabel(outdoor), on: outdoor > 0 },
    laundry: { label: laundry, on: washer || dryer },
    media,
  };
}

/** The Media tile: players playing (minus skipped ones) and switched-on TVs whose player is idle. */
export function mediaLabel(get, allIds = null) {
  const ids = allIds ?? [];
  const playing = ids.filter((id) => id.startsWith('media_player.') && !MEDIA.skip.some((p) => id.startsWith(p)) && st(get, id) === 'playing')
    .map((id) => MEDIA.names[id] ?? get(id)?.attributes?.friendly_name ?? id);
  const parts = [];
  if (playing.length === 1) parts.push(`${playing[0]} playing`);
  else if (playing.length > 1) parts.push(`${playing.length} playing: ${playing.join(', ')}`);
  for (const [sw, { name, player }] of Object.entries(MEDIA.switches)) {
    if (on(get, sw) && st(get, player) !== 'playing') parts.push(`${name} on`);
  }
  return { label: parts.join(' · ') || 'All off', on: playing.length > 0 || Object.keys(MEDIA.switches).some((sw) => on(get, sw)) };
}

// ---- Media pop-up ----

// Home Assistant's media player feature bits.
export const MF = { PAUSE: 1, SEEK: 2, VOLUME_SET: 4, VOLUME_MUTE: 8, PREVIOUS: 16, NEXT: 32, TURN_ON: 128, TURN_OFF: 256, VOLUME_STEP: 1024, PLAY: 16384 };
const MEDIA_RANK = { playing: 0, buffering: 1, paused: 1, on: 2, idle: 2, standby: 3, off: 4 };
const MEDIA_WORD = { playing: 'Playing', buffering: 'Loading', paused: 'Paused', on: 'On', idle: 'Idle', standby: 'Standby', off: 'Off' };

/** The Media pop-up's players: playing first, then paused, on or idle, then off, then unavailable (dimmed),
 *  keeping MEDIA_PLAYERS order within each. Each entry uses the first of its ids that is available. */
export function mediaPlayers(get) {
  const gone = (s) => !s || ['unavailable', 'unknown'].includes(s.state);
  return MEDIA_PLAYERS.map((p, i) => {
    const id = p.ids.find((x) => !gone(get(x))) ?? p.ids.find((x) => get(x)) ?? p.ids[0];
    const s = get(id);
    const a = s?.attributes ?? {};
    const unavailable = gone(s);
    const powerOn = p.power ? on(get, p.power) : null;
    const state = unavailable ? 'unavailable' : powerOn === false ? 'off' : s.state;
    const isOn = !unavailable && !['off', 'standby'].includes(state);
    const title = a.media_title ?? '';
    const by = a.media_artist ?? a.media_series_title ?? a.media_album_name ?? '';
    const app = a.app_name ?? a.source ?? '';
    const what = [title, by].filter(Boolean).join(' · ') || app;
    const sub = unavailable ? 'Unavailable'
      : powerOn === false ? `Off · ${p.powerName ?? 'Power'} power off`
        : [MEDIA_WORD[state] ?? 'On', isOn ? what : ''].filter(Boolean).join(' · ');
    const f = a.supported_features;
    return {
      ...p, id, i, state, unavailable, isOn, powerOn, sub, title, by, app,
      playing: state === 'playing',
      rank: unavailable ? 5 : MEDIA_RANK[state] ?? 2,
      can: (bit) => f == null || (f & bit) !== 0,
      vol: a.volume_level != null ? Math.round(a.volume_level * 100) : null,
      muted: Boolean(a.is_volume_muted),
      pic: a.entity_picture ?? '',
      pos: a.media_position, at: a.media_position_updated_at, dur: a.media_duration,
    };
  }).sort((x, y) => x.rank - y.rank || x.i - y.i);
}

/** The pop-up heading's summary: "2 playing · Kitchen speaker paused · TV on", "All off". */
export function mediaSummary(players) {
  const n = players.filter((p) => p.playing).length;
  const parts = [];
  if (n) parts.push(`${n} playing`);
  const others = players.filter((p) => p.isOn && !p.playing).map((p) => `${p.name} ${p.state === 'paused' ? 'paused' : 'on'}`);
  return [...parts, ...others.slice(0, 2)].join(' · ') || 'All off';
}

/** Elapsed time of a player at `now`, in seconds, from its last reported position; null without a duration. */
export function mediaElapsed({ pos, at, dur, playing }, now = Date.now()) {
  if (!(dur > 0) || pos == null) return null;
  const run = playing && at ? (now - new Date(at).getTime()) / 1000 : 0;
  return Math.max(0, Math.min(dur, pos + Math.max(0, run)));
}

/** 2:41, 1:02:05. */
export function clockTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}

// ---- Lights ----

/** The six favourite-light slots, with off favourites replaced by lights that are on elsewhere. */
export function lightSlots(get) {
  const t = (id) => changedAt(get, id);
  const extras = LIGHT_POOL.filter((id) => !FAV.includes(id) && on(get, id)).sort((a, b) => t(a) - t(b));
  const order = FAV.filter((f) => !on(get, f)).sort((a, b) => t(a) - t(b));
  const shown = extras.slice(Math.max(0, extras.length - order.length));
  const map = FAV.slice();
  shown.forEach((e, i) => { map[FAV.indexOf(order[i])] = e; });
  return map;
}

export function lightName(get, id) {
  return LIGHT_META[id]?.[0] ?? get(id)?.attributes?.friendly_name ?? id;
}

export const lightsOn = (get) => LIGHT_POOL.filter((id) => on(get, id)).length;
export const securityOpen = (get) => SECURITY_CONTACTS.filter((id) => on(get, id)).length;

// ---- Energy ----

export function watts(s) {
  const v = parseFloat(s?.state);
  if (!Number.isFinite(v)) return 0;
  const unit = String(s?.attributes?.unit_of_measurement ?? '').toLowerCase();
  return Math.abs(unit === 'kw' ? v * 1000 : v);
}
export const fmtW = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)} kW` : `${Math.round(v)} W`);
const money = (get, id) => `$${(Number.isFinite(numOf(get, id)) ? numOf(get, id) : 0).toFixed(2)}`;

export function energy(get) {
  const w = (id) => watts(get(id));
  const solar = w(E.solarPower);
  const imp = w(E.importPower);
  const exp = w(E.exportPower);
  const tesla = w(E.teslaCharger);
  const kia = w(E.kiaCharger);
  const house = Math.max(0, solar + imp - exp - tesla - kia);
  const load = house + tesla + kia;
  const self = load > 0 ? Math.round(Math.min(1, solar / load) * 100) : 0;
  const rate = parseFloat(st(get, E.rate));
  const tariff = st(get, E.tariff);
  return {
    tariff: [tariff && !['unknown', 'unavailable'].includes(tariff) ? titleCase(tariff) : null, Number.isFinite(rate) && rate ? `$${rate.toFixed(2)}/kWh` : null].filter(Boolean).join(' · '),
    today: money(get, E.costToday), sold: money(get, E.solarCredit), bill: money(get, E.billToDate), estimate: money(get, E.billEstimate),
    grid: { value: fmtW(exp || imp), label: exp > 0 ? 'Exporting' : imp > 0 ? 'From grid' : 'Grid idle', dir: exp > 0 ? 'out' : imp > 0 ? 'in' : 'idle' },
    home: fmtW(load),
    solar: { value: fmtW(solar), active: solar > 0 },
    tesla: { value: fmtW(tesla), charging: tesla > 0 },
    kia: { value: fmtW(kia), charging: kia > 0 },
    self,
  };
}

// ---- Appliances, Robbie, bins ----

const MACHINE_WORDS = { rinse_hold: 'Rinse hold', cool_down: 'Cooling', steam_softening: 'Steam', wrinkle_care: 'Wrinkle care' };

export function machine(get, statusId, endId, now = Date.now()) {
  const s = st(get, statusId);
  if (!s || s === 'power_off' || s === 'unavailable') return { label: 'Off', on: false };
  const word = MACHINE_WORDS[s] ?? titleCase(s);
  const end = st(get, endId);
  let mins = 0;
  if (end && !['unknown', 'unavailable', 'none', ''].includes(end)) {
    const t = new Date(end).getTime();
    if (Number.isFinite(t)) mins = Math.floor((t - now) / 60000);
  }
  return { label: mins > 0 ? `${word} · ${mins} min left` : word, short: mins > 0 ? `${mins} min left` : word, on: true };
}

export function robbie(get) {
  const v = st(get, E.robbie);
  const dk = st(get, E.robbieDock);
  const dockErr = BAD_DOCK(dk) && v !== 'error';
  if (dockErr) return { label: titleCase(dk), alert: true, on: false };
  const words = { docked: 'Docked', cleaning: 'Cleaning', returning: 'Returning', paused: 'Paused', error: 'Error' };
  return { label: words[v] ?? titleCase(v ?? '—'), alert: v === 'error', on: v === 'cleaning' || v === 'returning' };
}

/**
 * Next bin collection. The wheelie-bin sensors aren't defined in this repo, so read whichever shape
 * they have: a number of days, a date, or a `days`/`days_to`/`date` attribute. Unknown shapes are skipped.
 */
export function nextBins(get, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const daysUntil = (s) => {
    if (!s || ['unknown', 'unavailable'].includes(s.state)) return null;
    const a = s.attributes ?? {};
    for (const v of [a.days, a.days_to, a.daysTo, s.state]) {
      const n = Number(v);
      if (v !== '' && v !== null && v !== undefined && Number.isFinite(n)) return n;
    }
    for (const v of [a.date, a.next_date, a.next_collection, s.state]) {
      const t = Date.parse(v);
      if (Number.isFinite(t)) { const d = new Date(t); return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - start) / 86400000); }
    }
    if (/today/i.test(s.state)) return 0;
    if (/tomorrow/i.test(s.state)) return 1;
    return null;
  };
  const due = BINS.map((b) => ({ ...b, days: daysUntil(get(b.id)) })).filter((b) => b.days !== null && b.days >= 0);
  if (!due.length) return null;
  const min = Math.min(...due.map((b) => b.days));
  const when = min === 0 ? 'Today' : min === 1 ? 'Tomorrow' : new Date(start + min * 86400000).toLocaleDateString('en-AU', { weekday: 'short' });
  return { when, bins: due.filter((b) => b.days === min) };
}

// ---- Security ----

export function alarmState(state) {
  const words = { disarmed: 'Disarmed', armed_home: 'Armed home', armed_away: 'Armed away', armed_night: 'Armed night', arming: 'Arming', pending: 'Pending', triggered: 'Triggered' };
  return { label: words[state] ?? titleCase(state ?? '—'), armed: Boolean(state) && state.startsWith('armed'), alert: state === 'triggered' || state === 'pending' };
}

export function frontDoor(get) {
  const unlocked = st(get, E.frontDoor) !== 'off';
  const open = on(get, E.frontContact);
  return { label: `${unlocked ? 'Unlocked' : 'Locked'} · ${open ? 'Open' : 'Closed'}`, alert: unlocked || open, unlocked };
}

/** Time-of-day phase for the page's ambient tint: night, dawn, dusk or day (from sun.sun). */
export function skyPhase(sun) {
  if (!sun) return 'day';
  if (sun.state === 'below_horizon') return 'night';
  const el = Number(sun.attributes?.elevation);
  if (Number.isFinite(el) && el < 12) return sun.attributes?.rising ? 'dawn' : 'dusk';
  return 'day';
}
